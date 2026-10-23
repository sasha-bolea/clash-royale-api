import type { Tournament } from '~~/shared/types/domain'

/**
 * Win percentage of each player in each tournament, for the stats chart.
 * Shows improvement or decline independently of how much someone plays.
 * @param tournaments tournaments in chart order (oldest first), with matches
 * @param playerIds players to compute
 * @returns map player id → one value per tournament: 0–100 (rounded), or null
 *          when the player played no match in that tournament
 */
export function winRateSeries(tournaments: Tournament[], playerIds: number[]): Record<number, (number | null)[]> {
  const series: Record<number, (number | null)[]> = {}
  for (const id of playerIds) series[id] = []
  for (const t of tournaments) {
    const played = new Map<number, number>()
    const won = new Map<number, number>()
    for (const m of t.tournament_matches ?? []) {
      for (const p of [m.player1_id, m.player2_id]) played.set(p, (played.get(p) ?? 0) + 1)
      won.set(m.winner_id, (won.get(m.winner_id) ?? 0) + 1)
    }
    for (const id of playerIds) {
      const n = played.get(id)
      series[id]!.push(n ? Math.round(((won.get(id) ?? 0) / n) * 100) : null)
    }
  }
  return series
}
