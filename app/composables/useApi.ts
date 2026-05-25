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
  ClanMember,
} from '~~/shared/types/domain'

// Wrapper Supabase (via @nuxtjs/supabase) + CR proxy.
// Tutte le query sono protette da RLS server-side; il client filtra anche per UX.
export function useApi() {
  const db = useSupabaseClient()
  const user = useSupabaseUser()

  // =====================================================
  // CLANS
  // =====================================================

  // Lista clan a cui l'utente loggato appartiene.
  async function getMyClans(): Promise<Clan[]> {
    const { data, error } = await db
      .from('clans')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as Clan[]) ?? []
  }

  async function getClan(clanId: number): Promise<Clan | null> {
    const { data, error } = await db.from('clans').select('*').eq('id', clanId).maybeSingle()
    if (error) throw error
    return (data as Clan | null) ?? null
  }

  // Crea clan con nome + invite_code random 6 char. Trigger DB aggiunge owner come member.
  async function createClan(name: string): Promise<Clan> {
    if (!user.value) throw new Error('Non autenticato')
    const inviteCode = randomCode(6)
    const { data, error } = await db
      .from('clans')
      .insert({ name, owner_id: user.value.id, invite_code: inviteCode })
      .select()
      .single()
    if (error) throw error
    return data as Clan
  }

  async function renameClan(clanId: number, name: string): Promise<void> {
    const { error } = await db.from('clans').update({ name }).eq('id', clanId)
    if (error) throw error
  }

  async function deleteClan(clanId: number): Promise<void> {
    const { error } = await db.from('clans').delete().eq('id', clanId)
    if (error) throw error
  }

  // =====================================================
  // CLAN MEMBERS
  // =====================================================

  async function getClanMembers(clanId: number): Promise<ClanMember[]> {
    const { data, error } = await db
      .from('clan_members')
      .select('*')
      .eq('clan_id', clanId)
    if (error) throw error
    return (data as ClanMember[]) ?? []
  }

  async function leaveClan(clanId: number): Promise<void> {
    if (!user.value) throw new Error('Non autenticato')
    const { error } = await db
      .from('clan_members')
      .delete()
      .eq('clan_id', clanId)
      .eq('user_id', user.value.id)
    if (error) throw error
  }

  async function kickMember(clanId: number, userId: string): Promise<void> {
    const { error } = await db
      .from('clan_members')
      .delete()
      .eq('clan_id', clanId)
      .eq('user_id', userId)
    if (error) throw error
  }

  // RPC: join via codice. Idempotente.
  async function joinByCode(code: string): Promise<Clan> {
    const { data, error } = await db.rpc('join_clan_by_code', { code })
    if (error) throw error
    return data as Clan
  }

  // RPC: trasferisci ownership (owner only)
  async function transferOwnership(clanId: number, newOwnerId: string): Promise<void> {
    const { error } = await db.rpc('transfer_ownership', {
      _clan_id: clanId,
      _new_owner: newOwnerId,
    })
    if (error) throw error
  }

  // RPC: rigenera codice invito (owner only)
  async function regenerateInviteCode(clanId: number): Promise<string> {
    const { data, error } = await db.rpc('regenerate_invite_code', { _clan_id: clanId })
    if (error) throw error
    return data as string
  }

  // =====================================================
  // PLAYERS (scoped al clan)
  // =====================================================

  async function getPlayers(clanId: number): Promise<Player[]> {
    const { data, error } = await db
      .from('players')
      .select('*')
      .eq('clan_id', clanId)
      .order('username')
    if (error) throw error
    return (data as Player[]) ?? []
  }

  async function addPlayer(clanId: number, username: string, crTag: string): Promise<Player> {
    const { data, error } = await db
      .from('players')
      .insert({ clan_id: clanId, username, cr_tag: crTag })
      .select()
      .single()
    if (error) throw error
    return data as Player
  }

  async function removePlayer(playerId: number): Promise<void> {
    const { error } = await db.from('players').delete().eq('id', playerId)
    if (error) throw error
  }

  // =====================================================
  // TOURNAMENTS (scoped al clan)
  // =====================================================

  async function getActiveTournament(clanId: number): Promise<Tournament | null> {
    const { data, error } = await db
      .from('tournaments')
      .select(`*, tournament_players ( player_id, players (*) )`)
      .eq('clan_id', clanId)
      .in('status', ['active', 'paused'])
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
    if (!user.value) throw new Error('Non autenticato')
    const { data: tournament, error: tErr } = await db
      .from('tournaments')
      .insert({
        clan_id: clanId,
        match_type: matchType,
        status: 'active',
        created_by: user.value.id,
      })
      .select()
      .single()
    if (tErr) throw tErr

    const rows = playerIds.map(pid => ({ tournament_id: tournament.id, player_id: pid }))
    const { error: tpErr } = await db.from('tournament_players').insert(rows)
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
    const { error } = await db.from('tournaments').update(update).eq('id', tournamentId)
    if (error) throw error
  }

  async function getTournamentMatches(tournamentId: number): Promise<TournamentMatch[]> {
    const { data, error } = await db
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

  // Ritorna true se salvata, false se duplicato (cr_battle_id già esistente per quel torneo)
  async function saveTournamentMatch(payload: SaveMatchPayload): Promise<boolean> {
    const { tournament_id, player1_id, player2_id, winner_id,
      crowns_p1, crowns_p2, played_at, cr_battle_id } = payload

    const { error } = await db.from('tournament_matches').insert({
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
  // STANDINGS (scoped al clan)
  // =====================================================

  async function getStandings(clanId: number): Promise<Standing[]> {
    const { data, error } = await db
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
      const { data } = await db
        .from('standings').select('points')
        .eq('clan_id', clanId).eq('player_id', player_id).maybeSingle()
      const current = (data as { points: number } | null)?.points ?? 0
      await db.from('standings').upsert({ clan_id: clanId, player_id, points: current + points })
    }
  }

  async function getTournamentsHistory(clanId: number): Promise<Tournament[]> {
    const { data, error } = await db
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
    getMyClans, getClan, createClan, renameClan, deleteClan,
    // members
    getClanMembers, leaveClan, kickMember, joinByCode, transferOwnership, regenerateInviteCode,
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

// Codice invito alfanumerico uppercase
function randomCode(len: number): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O/1/I/L per leggibilità
  let s = ''
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}
