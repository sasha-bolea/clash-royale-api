import type {
  Player,
  Tournament,
  TournamentMatch,
  Standing,
  MatchType,
  SaveMatchPayload,
  CRPlayerProfile,
  CRBattle,
} from '~~/shared/types/domain'

// Wrapper Supabase + CR proxy. Porta 1:1 js/api.js + sposta CR API su /api/cr/*.
export function useApi() {
  const { $db } = useNuxtApp()

  // PLAYERS
  async function getPlayers(): Promise<Player[]> {
    const { data, error } = await $db.from('players').select('*').order('username')
    if (error) throw error
    return data ?? []
  }

  // TOURNAMENTS
  async function getActiveTournament(): Promise<Tournament | null> {
    const { data, error } = await $db
      .from('tournaments')
      .select(`*, tournament_players ( player_id, players (*) )`)
      .in('status', ['active', 'paused'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return (data as Tournament | null) ?? null
  }

  async function createTournament(playerIds: number[], matchType: MatchType): Promise<Tournament> {
    const { data: tournament, error: tErr } = await $db
      .from('tournaments')
      .insert({ match_type: matchType, status: 'active' })
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

  // MATCHES
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

  // Ritorna true se salvata, false se duplicato (cr_battle_id già esistente)
  async function saveTournamentMatch(payload: SaveMatchPayload): Promise<boolean> {
    const { tournament_id, player1_id, player2_id, winner_id,
      crowns_p1, crowns_p2, played_at, cr_battle_id, match_type } = payload

    const { error } = await $db.from('tournament_matches').insert({
      tournament_id, player1_id, player2_id, winner_id,
      crowns_p1, crowns_p2, played_at, cr_battle_id,
    })
    if (error) {
      if ((error as any).code === '23505') return false
      throw error
    }

    // Best effort su tabella globale battles
    $db.from('battles').insert({
      player1_id, player2_id, winner_id,
      crowns_p1, crowns_p2,
      battle_type: match_type,
      played_at, cr_battle_id,
    }).then(() => {}, () => {})

    return true
  }

  // STANDINGS
  async function getStandings(): Promise<Standing[]> {
    const { data, error } = await $db
      .from('standings')
      .select('*, players (*)')
      .order('points', { ascending: false })
    if (error) throw error
    return (data as Standing[]) ?? []
  }

  async function addPoints(entries: Array<{ player_id: number; points: number }>): Promise<void> {
    for (const { player_id, points } of entries) {
      const { data } = await $db
        .from('standings').select('points').eq('player_id', player_id).maybeSingle()
      const current = (data as { points: number } | null)?.points ?? 0
      await $db.from('standings').upsert({ player_id, points: current + points })
    }
  }

  // HISTORY
  async function getTournamentsHistory(): Promise<Tournament[]> {
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
      .in('status', ['finished', 'invalid'])
      .order('started_at', { ascending: false })
    if (error) throw error
    return (data as Tournament[]) ?? []
  }

  // CR API via server proxy (chiave server-only)
  async function getPlayerProfile(crTag: string): Promise<CRPlayerProfile> {
    const tag = crTag.replace('#', '')
    return await $fetch<CRPlayerProfile>(`/api/cr/player/${tag}`)
  }

  async function getBattlelog(crTag: string): Promise<CRBattle[]> {
    const tag = crTag.replace('#', '')
    return await $fetch<CRBattle[]>(`/api/cr/battlelog/${tag}`)
  }

  return {
    getPlayers,
    getActiveTournament,
    createTournament,
    updateTournamentStatus,
    getTournamentMatches,
    saveTournamentMatch,
    getStandings,
    addPoints,
    getTournamentsHistory,
    getPlayerProfile,
    getBattlelog,
  }
}
