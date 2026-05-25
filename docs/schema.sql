-- =====================================================
-- Royal Arena — Schema multi-clan (public)
-- Eseguire UNA volta su Supabase SQL Editor.
-- WIPE schema vecchio (privato), crea quello nuovo.
-- =====================================================

-- DROP vecchio schema (se esiste)
DROP TABLE IF EXISTS standings           CASCADE;
DROP TABLE IF EXISTS battles             CASCADE;
DROP TABLE IF EXISTS tournament_matches  CASCADE;
DROP TABLE IF EXISTS tournament_players  CASCADE;
DROP TABLE IF EXISTS tournaments         CASCADE;
DROP TABLE IF EXISTS players             CASCADE;
DROP TABLE IF EXISTS clan_members        CASCADE;
DROP TABLE IF EXISTS clans               CASCADE;
DROP FUNCTION IF EXISTS is_clan_member(INT)         CASCADE;
DROP FUNCTION IF EXISTS is_clan_owner(INT)          CASCADE;
DROP FUNCTION IF EXISTS join_clan_by_code(TEXT)     CASCADE;
DROP FUNCTION IF EXISTS transfer_ownership(INT, UUID) CASCADE;
DROP FUNCTION IF EXISTS regenerate_invite_code(INT) CASCADE;
DROP FUNCTION IF EXISTS clans_after_insert()        CASCADE;

-- =====================================================
-- TABELLE
-- =====================================================

CREATE TABLE clans (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clan_members (
  clan_id    INT  REFERENCES clans(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (clan_id, user_id)
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
  created_by  UUID REFERENCES auth.users(id),
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
-- RLS
-- =====================================================

ALTER TABLE clans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE players            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings          ENABLE ROW LEVEL SECURITY;

-- Helper: membership check (SECURITY DEFINER per evitare loop RLS)
CREATE OR REPLACE FUNCTION is_clan_member(_clan_id INT) RETURNS BOOL
LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = _clan_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_clan_owner(_clan_id INT) RETURNS BOOL
LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM clans
    WHERE id = _clan_id AND owner_id = auth.uid()
  );
$$;

-- Policies clans
CREATE POLICY clans_select ON clans FOR SELECT USING (is_clan_member(id));
CREATE POLICY clans_insert ON clans FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY clans_update ON clans FOR UPDATE USING (is_clan_owner(id));
CREATE POLICY clans_delete ON clans FOR DELETE USING (is_clan_owner(id));

-- Policies clan_members
CREATE POLICY cm_select ON clan_members FOR SELECT USING (is_clan_member(clan_id));
CREATE POLICY cm_delete ON clan_members FOR DELETE
  USING (user_id = auth.uid() OR is_clan_owner(clan_id));
-- INSERT bloccato lato client: passa via RPC join_clan_by_code o trigger su create clan

-- Policies players
CREATE POLICY players_select ON players FOR SELECT USING (is_clan_member(clan_id));
CREATE POLICY players_cud ON players FOR ALL
  USING (is_clan_owner(clan_id))
  WITH CHECK (is_clan_owner(clan_id));

-- Policies tournaments (qualsiasi membro crea/aggiorna)
CREATE POLICY t_select ON tournaments FOR SELECT USING (is_clan_member(clan_id));
CREATE POLICY t_cud ON tournaments FOR ALL
  USING (is_clan_member(clan_id))
  WITH CHECK (is_clan_member(clan_id));

CREATE POLICY tp_all ON tournament_players FOR ALL
  USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND is_clan_member(t.clan_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND is_clan_member(t.clan_id)));

CREATE POLICY tm_all ON tournament_matches FOR ALL
  USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND is_clan_member(t.clan_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND is_clan_member(t.clan_id)));

CREATE POLICY st_select ON standings FOR SELECT USING (is_clan_member(clan_id));
CREATE POLICY st_cud ON standings FOR ALL
  USING (is_clan_member(clan_id))
  WITH CHECK (is_clan_member(clan_id));

-- =====================================================
-- RPC
-- =====================================================

-- Join clan via codice invito. Idempotente.
CREATE OR REPLACE FUNCTION join_clan_by_code(code TEXT) RETURNS clans
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE c clans;
BEGIN
  SELECT * INTO c FROM clans WHERE invite_code = code;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Codice non valido'; END IF;
  INSERT INTO clan_members(clan_id, user_id) VALUES (c.id, auth.uid())
  ON CONFLICT DO NOTHING;
  RETURN c;
END $$;

-- Trasferisce ownership a un membro esistente. Solo owner.
CREATE OR REPLACE FUNCTION transfer_ownership(_clan_id INT, _new_owner UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_clan_owner(_clan_id) THEN RAISE EXCEPTION 'Non sei owner'; END IF;
  IF NOT EXISTS (SELECT 1 FROM clan_members WHERE clan_id = _clan_id AND user_id = _new_owner) THEN
    RAISE EXCEPTION 'Il nuovo owner non è membro del clan';
  END IF;
  UPDATE clans SET owner_id = _new_owner WHERE id = _clan_id;
END $$;

-- Rigenera invite_code. Solo owner. Ritorna il nuovo codice.
CREATE OR REPLACE FUNCTION regenerate_invite_code(_clan_id INT) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_code TEXT;
BEGIN
  IF NOT is_clan_owner(_clan_id) THEN RAISE EXCEPTION 'Non sei owner'; END IF;
  new_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
  UPDATE clans SET invite_code = new_code WHERE id = _clan_id;
  RETURN new_code;
END $$;

-- =====================================================
-- TRIGGER: alla creazione clan, owner diventa membro
-- =====================================================
CREATE OR REPLACE FUNCTION clans_after_insert() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO clan_members(clan_id, user_id) VALUES (NEW.id, NEW.owner_id);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_clans_after_insert AFTER INSERT ON clans
  FOR EACH ROW EXECUTE FUNCTION clans_after_insert();
