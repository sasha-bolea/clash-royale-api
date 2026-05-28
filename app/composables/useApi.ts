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
    return (data as Clan | null) ?? null
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
  ): Promise<Tournament> {
    const { data: tournament, error: tErr } = await $db
      .from('tournaments')
      .insert({ clan_id: clanId, match_type: matchType, status: 'active' })
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

  // =====================================================
  // STANDINGS
  // =====================================================

  async function getStandings(clanId: number): Promise<Standing[]> {
    const { data, error } = await $db
      .from('standings')
      .select('*, players (*)')
      .eq('clan_id', clanId)
      .order('points', { ascending: false })
    if (error) throw error
    return (data as Standing[]) ?? []
  }

  async function addPoints(
    clanId: number,
    entries: Array<{ player_id: number; points: number }>,
  ): Promise<void> {
    for (const { player_id, points } of entries) {
      const { data } = await $db
        .from('standings').select('points')
        .eq('clan_id', clanId).eq('player_id', player_id).maybeSingle()
      const current = (data as { points: number } | null)?.points ?? 0
      await $db.from('standings').upsert({ clan_id: clanId, player_id, points: current + points })
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
    getTournamentMatches, saveTournamentMatch,
    // standings
    getStandings, addPoints, getTournamentsHistory,
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
