import type {
  Player,
  Tournament,
  TournamentMatch,
  Standing,
  MatchType,
  SaveMatchPayload,
  CRPlayerProfile,
  CRBattle,
  Clan,
} from '~~/shared/types/domain'

// Wrapper Supabase ($db da plugin) + CR proxy.
// Modello flat: no auth. Le query sono protette solo dall'oscurità del codice clan.
export function useApi() {
  const { $db } = useNuxtApp()

  // =====================================================
  // CLANS
  // =====================================================

  async function createClan(name: string): Promise<Clan> {
    // Genera code 6 char client-side; in caso di collisione (23505) retry.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode(6)
      const { data, error } = await $db
        .from('clans')
        .insert({ name, code })
        .select()
        .single()
      if (!error) return data as Clan
      if ((error as any).code !== '23505') throw error
    }
    throw new Error('Impossibile generare codice univoco. Riprova.')
  }

  async function getClanByCode(code: string): Promise<Clan | null> {
    const { data, error } = await $db.rpc('get_clan_by_code', { _code: code })
    if (error) throw error
    // Unknown code → the RPC returns a row of nulls, not null: treat it as not found.
    return isClanFound(data) ? data : null
  }

  async function regenerateCode(clanId: number): Promise<string> {
    const { data, error } = await $db.rpc('regenerate_code', { _clan_id: clanId })
    if (error) throw error
    return data as string
  }

  // =====================================================
  // PLAYERS
  // =====================================================

  async function getPlayers(clanId: number): Promise<Player[]> {
    const { data, error } = await $db
      .from('players')
      .select('*')
      .eq('clan_id', clanId)
      .order('username')
    if (error) throw error
    return (data as Player[]) ?? []
  }

  async function addPlayer(clanId: number, username: string, crTag: string): Promise<Player> {
    const { data, error } = await $db
      .from('players')
      .insert({ clan_id: clanId, username, cr_tag: crTag })
      .select()
      .single()
    if (error) throw error
    return data as Player
  }

  async function removePlayer(playerId: number): Promise<void> {
    const { error } = await $db.from('players').delete().eq('id', playerId)
    if (error) throw error
  }

  // =====================================================
  // TOURNAMENTS
  // =====================================================

  async function getActiveTournament(clanId: number): Promise<Tournament | null> {
    const { data, error } = await $db
      .from('tournaments')
      .select(`*, tournament_players ( player_id, players (*) )`)
      .eq('clan_id', clanId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return (data as Tournament | null) ?? null
  }

  async function createTournament(
    clanId: number,
    playerIds: number[],
    matchType: MatchType,
    fullRanking = false,
    autoRestart = false,
    startedAt?: string,
  ): Promise<Tournament> {
    const insert: Record<string, unknown> = { clan_id: clanId, match_type: matchType, status: 'active', full_ranking: fullRanking }
    if (startedAt) insert.started_at = startedAt
    // Only sent when on: the column may be missing on a database not yet migrated.
    if (autoRestart) insert.auto_restart = true
    const { data: tournament, error: tErr } = await $db
      .from('tournaments')
      .insert(insert)
      .select()
      .single()
    if (tErr) throw tErr

    const rows = playerIds.map(pid => ({ tournament_id: tournament.id, player_id: pid }))
    const { error: tpErr } = await $db.from('tournament_players').insert(rows)
    if (tpErr) throw tpErr

    return tournament as Tournament
  }

  async function updateTournamentStatus(
    tournamentId: number,
    status: Tournament['status'],
  ): Promise<void> {
    const update: Record<string, unknown> = { status }
    if (status === 'finished' || status === 'invalid') {
      update.finished_at = new Date().toISOString()
    }
    const { error } = await $db.from('tournaments').update(update).eq('id', tournamentId)
    if (error) throw error
  }

  async function setTournamentFullRanking(tournamentId: number, value: boolean): Promise<void> {
    const { error } = await $db
      .from('tournaments').update({ full_ranking: value }).eq('id', tournamentId)
    if (error) throw error
  }

  // Turns consecutive tournaments on/off for a tournament (the next one inherits it).
  async function setTournamentAutoRestart(tournamentId: number, value: boolean): Promise<void> {
    const { error } = await $db
      .from('tournaments').update({ auto_restart: value }).eq('id', tournamentId)
    if (error) throw error
  }

  /**
   * Closes an active tournament as finished, atomically.
   * @returns true if this call closed it, false if it was already closed
   *          (e.g. by another phone): only the closer starts the next one.
   */
  async function finishTournament(tournamentId: number): Promise<boolean> {
    const { data, error } = await $db
      .from('tournaments')
      .update({ status: 'finished', finished_at: new Date().toISOString() })
      .eq('id', tournamentId)
      .eq('status', 'active')
      .select('id')
    if (error) throw error
    return (data?.length ?? 0) > 0
  }

  async function getTournamentMatches(tournamentId: number): Promise<TournamentMatch[]> {
    const { data, error } = await $db
      .from('tournament_matches')
      .select(`
        *,
        player1:player1_id ( id, username, cr_tag ),
        player2:player2_id ( id, username, cr_tag ),
        winner:winner_id   ( id, username )
      `)
      .eq('tournament_id', tournamentId)
      .order('played_at')
    if (error) throw error
    return (data as TournamentMatch[]) ?? []
  }

  async function saveTournamentMatch(payload: SaveMatchPayload): Promise<boolean> {
    const { tournament_id, player1_id, player2_id, winner_id,
      crowns_p1, crowns_p2, played_at, cr_battle_id } = payload

    const { error } = await $db.from('tournament_matches').insert({
      tournament_id, player1_id, player2_id, winner_id,
      crowns_p1, crowns_p2, played_at, cr_battle_id,
    })
    if (error) {
      if ((error as any).code === '23505') return false
      throw error
    }
    return true
  }

  // Battle ids already used by a non-annulled tournament of the clan
  // (annulled tournaments don't count: their battles can be reused).
  async function getUsedBattleIds(clanId: number): Promise<Set<string>> {
    const { data, error } = await $db
      .from('tournament_matches')
      .select('cr_battle_id, tournaments!inner ( clan_id, status )')
      .eq('tournaments.clan_id', clanId)
      .neq('tournaments.status', 'invalid')
    if (error) throw error
    return new Set((data ?? []).map((r: { cr_battle_id: string }) => r.cr_battle_id))
  }

  /**
   * Saves an already-played tournament (validated by validatePastTournament).
   * Created as 'invalid' and switched to 'finished' only after every match is stored,
   * so a failure halfway leaves an annulled tournament that counts nowhere.
   * Match wins are added to the clan standings, as in a live tournament.
   */
  async function savePastTournament(
    clanId: number,
    playerIds: number[],
    fullRanking: boolean,
    matches: TournamentMatch[],
  ): Promise<number> {
    const sorted = [...matches].sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())
    const { data: tournament, error: tErr } = await $db
      .from('tournaments')
      .insert({
        clan_id: clanId,
        match_type: 'amichevole',
        status: 'invalid',
        full_ranking: fullRanking,
        started_at: sorted[0]!.played_at,
        finished_at: sorted[sorted.length - 1]!.played_at,
      })
      .select()
      .single()
    if (tErr) throw tErr

    const { error: tpErr } = await $db.from('tournament_players')
      .insert(playerIds.map(pid => ({ tournament_id: tournament.id, player_id: pid })))
    if (tpErr) throw tpErr

    const { error: mErr } = await $db.from('tournament_matches').insert(sorted.map(m => ({
      tournament_id: tournament.id,
      player1_id: m.player1_id,
      player2_id: m.player2_id,
      winner_id: m.winner_id,
      crowns_p1: m.crowns_p1,
      crowns_p2: m.crowns_p2,
      played_at: m.played_at,
      cr_battle_id: m.cr_battle_id,
    })))
    if (mErr) throw mErr

    const { error: fErr } = await $db.from('tournaments').update({ status: 'finished' }).eq('id', tournament.id)
    if (fErr) throw fErr

    const wins: Record<number, number> = {}
    sorted.forEach((m) => { wins[m.winner_id] = (wins[m.winner_id] ?? 0) + 1 })
    await addWins(clanId, Object.entries(wins).map(([id, w]) => ({ player_id: Number(id), wins: w })))
    return tournament.id as number
  }

  // =====================================================
  // STANDINGS
  // =====================================================

  async function getStandings(clanId: number): Promise<Standing[]> {
    const { data, error } = await $db
      .from('standings')
      .select('*, players (*)')
      .eq('clan_id', clanId)
      .order('wins', { ascending: false })
    if (error) throw error
    return (data as Standing[]) ?? []
  }

  async function addWins(
    clanId: number,
    entries: Array<{ player_id: number; wins: number }>,
  ): Promise<void> {
    for (const { player_id, wins } of entries) {
      const { data } = await $db
        .from('standings').select('wins')
        .eq('clan_id', clanId).eq('player_id', player_id).maybeSingle()
      const current = (data as { wins: number } | null)?.wins ?? 0
      await $db.from('standings').upsert({ clan_id: clanId, player_id, wins: current + wins })
    }
  }

  async function getTournamentsHistory(clanId: number): Promise<Tournament[]> {
    const { data, error } = await $db
      .from('tournaments')
      .select(`
        *,
        tournament_players ( players (*) ),
        tournament_matches (
          *, winner:winner_id ( username ),
          player1:player1_id ( username ),
          player2:player2_id ( username )
        )
      `)
      .eq('clan_id', clanId)
      .in('status', ['finished', 'invalid'])
      .order('started_at', { ascending: false })
    if (error) throw error
    return (data as Tournament[]) ?? []
  }

  // =====================================================
  // CR API (server proxy, chiave server-only)
  // =====================================================

  async function getPlayerProfile(crTag: string): Promise<CRPlayerProfile> {
    const tag = crTag.replace('#', '')
    return await $fetch<CRPlayerProfile>(`/api/cr/player/${tag}`)
  }

  async function getBattlelog(crTag: string): Promise<CRBattle[]> {
    const tag = crTag.replace('#', '')
    return await $fetch<CRBattle[]>(`/api/cr/battlelog/${tag}`)
  }

  return {
    // clans
    createClan, getClanByCode, regenerateCode,
    // players
    getPlayers, addPlayer, removePlayer,
    // tournaments
    getActiveTournament, createTournament, updateTournamentStatus,
    setTournamentFullRanking, setTournamentAutoRestart, finishTournament, getTournamentMatches, saveTournamentMatch,
    getUsedBattleIds, savePastTournament,
    // standings
    getStandings, addWins, getTournamentsHistory,
    // cr api
    getPlayerProfile, getBattlelog,
  }
}

// Codice 6 char alfanumerico uppercase (no caratteri ambigui)
function randomCode(len: number): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}
