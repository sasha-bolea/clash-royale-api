import type { Player, Tournament } from '~~/shared/types/domain'

export interface PlayerTournamentStats {
  username: string
  firstPlaces: number
  secondPlaces: number
  thirdPlaces: number
  wins: number
  losses: number
  tournamentsPlayed: number
  totalWins: number
  tournamentHistory: Array<{ date: string; position: number }>
}

// Calcola statistiche per giocatore aggregando tornei finished.
// Ranking per torneo = numero vittorie nelle partite (winCounts).
export function computePlayerTournamentStats(
  players: Player[],
  tournaments: Tournament[],
  standingsMap: Record<number, number> = {},
): PlayerTournamentStats[] {
  const stats: Record<string, PlayerTournamentStats> = {}
  players.forEach((p) => {
    stats[p.username] = {
      username: p.username,
      firstPlaces: 0,
      secondPlaces: 0,
      thirdPlaces: 0,
      wins: 0,
      losses: 0,
      tournamentsPlayed: 0,
      totalWins: standingsMap[p.id] ?? 0,
      tournamentHistory: [],
    }
  })

  tournaments.forEach((t) => {
    const participantUsernames = (t.tournament_players ?? []).map(tp => tp.players.username)
    const winCounts: Record<string, number> = {}
    participantUsernames.forEach((u) => { winCounts[u] = 0 })

    ;(t.tournament_matches ?? []).forEach((m) => {
      if (!m.winner) return
      const w = m.winner.username
      const p1 = m.player1?.username
      const p2 = m.player2?.username
      if (winCounts[w] !== undefined) winCounts[w]++
      if (p1 && stats[p1]) {
        if (w === p1) stats[p1].wins++
        else stats[p1].losses++
      }
      if (p2 && stats[p2]) {
        if (w === p2) stats[p2].wins++
        else stats[p2].losses++
      }
    })

    const ranked = participantUsernames
      .filter(u => stats[u])
      .sort((a, b) => (winCounts[b] ?? 0) - (winCounts[a] ?? 0))

    ranked.forEach((u, idx) => {
      const s = stats[u]!
      s.tournamentsPlayed++
      s.tournamentHistory.push({ date: t.started_at, position: idx + 1 })
      if (idx === 0) s.firstPlaces++
      else if (idx === 1) s.secondPlaces++
      else if (idx === 2) s.thirdPlaces++
    })
  })

  return Object.values(stats).filter(s => s.tournamentsPlayed > 0)
}

// Genera slug per nome arena per path immagine.
export function arenaImg(arenaName: string): string {
  const slug = arenaName.toLowerCase()
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  return `/images/arenas/${slug}.png`
}
