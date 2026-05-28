-- =====================================================
-- Royal Arena — Schema flat multi-clan (no auth, code-only)
-- Eseguire UNA volta su Supabase SQL Editor.
-- Pre-req: abilitare estensione pg_cron (Database → Extensions).
-- =====================================================

-- WIPE schema vecchio (qualsiasi versione precedente)
DROP TABLE IF EXISTS standings           CASCADE;
DROP TABLE IF EXISTS battles             CASCADE;
DROP TABLE IF EXISTS tournament_matches  CASCADE;
DROP TABLE IF EXISTS tournament_players  CASCADE;
DROP TABLE IF EXISTS tournaments         CASCADE;
DROP TABLE IF EXISTS players             CASCADE;
DROP TABLE IF EXISTS clan_members        CASCADE;
DROP TABLE IF EXISTS clans               CASCADE;
DROP FUNCTION IF EXISTS is_clan_member(INT)            CASCADE;
DROP FUNCTION IF EXISTS is_clan_owner(INT)             CASCADE;
DROP FUNCTION IF EXISTS join_clan_by_code(TEXT)        CASCADE;
DROP FUNCTION IF EXISTS transfer_ownership(INT, UUID)  CASCADE;
DROP FUNCTION IF EXISTS regenerate_invite_code(INT)    CASCADE;
DROP FUNCTION IF EXISTS clans_after_insert()           CASCADE;
DROP FUNCTION IF EXISTS get_clan_by_code(TEXT)         CASCADE;
DROP FUNCTION IF EXISTS regenerate_code(INT)           CASCADE;
DROP FUNCTION IF EXISTS purge_clan_if_empty()          CASCADE;

-- =====================================================
-- TABELLE
-- =====================================================

CREATE TABLE clans (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE players (
  id         SERIAL PRIMARY KEY,
  clan_id    INT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  username   TEXT NOT NULL,
  cr_tag     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (clan_id, cr_tag)
);

CREATE TABLE tournaments (
  id          SERIAL PRIMARY KEY,
  clan_id     INT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  match_type  TEXT NOT NULL CHECK (match_type IN ('1v1','tripla','amichevole')),
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','paused','finished','invalid')),
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE tournament_players (
  tournament_id INT REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id     INT REFERENCES players(id) ON DELETE CASCADE,
  PRIMARY KEY (tournament_id, player_id)
);

CREATE TABLE tournament_matches (
  id            SERIAL PRIMARY KEY,
  tournament_id INT REFERENCES tournaments(id) ON DELETE CASCADE,
  player1_id    INT REFERENCES players(id),
  player2_id    INT REFERENCES players(id),
  winner_id     INT REFERENCES players(id),
  crowns_p1     SMALLINT,
  crowns_p2     SMALLINT,
  played_at     TIMESTAMPTZ,
  cr_battle_id  TEXT,
  UNIQUE (tournament_id, cr_battle_id)
);

CREATE TABLE standings (
  clan_id   INT REFERENCES clans(id) ON DELETE CASCADE,
  player_id INT REFERENCES players(id) ON DELETE CASCADE,
  points    INT DEFAULT 0,
  PRIMARY KEY (clan_id, player_id)
);

-- =====================================================
-- RLS aperta. Sicurezza per oscurità del codice clan.
-- =====================================================

ALTER TABLE clans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE players            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings          ENABLE ROW LEVEL SECURITY;

-- clans: SELECT + INSERT aperti. UPDATE/DELETE solo via RPC/trigger.
CREATE POLICY clans_select ON clans FOR SELECT USING (true);
CREATE POLICY clans_insert ON clans FOR INSERT WITH CHECK (true);

CREATE POLICY players_all     ON players            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY tournaments_all ON tournaments        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY tp_all          ON tournament_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY tm_all          ON tournament_matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY standings_all   ON standings          FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- RPC
-- =====================================================

-- Risolvi clan da codice. Anyone.
CREATE OR REPLACE FUNCTION get_clan_by_code(_code TEXT) RETURNS clans
LANGUAGE SQL STABLE AS $$
  SELECT * FROM clans WHERE code = _code LIMIT 1;
$$;

-- Rigenera codice. Anyone (modello flat).
CREATE OR REPLACE FUNCTION regenerate_code(_clan_id INT) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_code TEXT;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM clans WHERE code = new_code);
  END LOOP;
  UPDATE clans SET code = new_code WHERE id = _clan_id;
  RETURN new_code;
END $$;

-- =====================================================
-- AUTO-CLEANUP
-- =====================================================

-- Trigger: dopo DELETE su players, se 0 player → elimina clan (cascade)
CREATE OR REPLACE FUNCTION purge_clan_if_empty() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE clan_id = OLD.clan_id) THEN
    DELETE FROM clans WHERE id = OLD.clan_id;
  END IF;
  RETURN OLD;
END $$;

CREATE TRIGGER trg_purge_empty_clan
  AFTER DELETE ON players
  FOR EACH ROW EXECUTE FUNCTION purge_clan_if_empty();

-- Cron: ogni giorno alle 03:00 UTC elimina clan creati >24h fa, 0 player, 0 tornei.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Rimuove job esistente con stesso nome (idempotente)
SELECT cron.unschedule('purge-orphan-clans') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'purge-orphan-clans'
);

SELECT cron.schedule(
  'purge-orphan-clans',
  '0 3 * * *',
  $$DELETE FROM clans
    WHERE created_at < now() - interval '24 hours'
      AND id NOT IN (SELECT clan_id FROM players)
      AND id NOT IN (SELECT clan_id FROM tournaments)$$
);

-- Cron: ogni 30min invalida tornei attivi da >2h con 0 partite.
SELECT cron.unschedule('autoinvalid-idle-tournaments') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'autoinvalid-idle-tournaments'
);

SELECT cron.schedule(
  'autoinvalid-idle-tournaments',
  '*/30 * * * *',
  $$UPDATE tournaments
    SET status = 'invalid', finished_at = now()
    WHERE status = 'active'
      AND started_at < now() - interval '2 hours'
      AND id NOT IN (SELECT DISTINCT tournament_id FROM tournament_matches)$$
);
