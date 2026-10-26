import type { BracketResult, Player, TournamentMatch } from '~~/shared/types/domain'
import { useBracket } from '~/composables/useBracket'

/**
 * Minimum number of matches before a tournament can be complete.
 * @param size number of players
 * @param fullRanking whether all placings are played out
 * @returns the count, or null for an unsupported size
 */
export function neededMatches(size: number, fullRanking: boolean): number | null {
  switch (size) {
    case 2: return 1
    case 3: return 3
    case 4: return fullRanking ? 4 : 3
    case 6: return 6 + (fullRanking ? 3 : 1)
    case 8: return fullRanking ? 12 : 7
    default: return null
  }
}

/**
 * Final result of a tournament, if its matches complete it.
 * @returns the podium, or null while the tournament is still open
 */
export function completionResult(matches: TournamentMatch[], players: Player[], fullRanking: boolean): BracketResult | null {
  const needed = neededMatches(players.length, fullRanking)
  if (needed === null || matches.length < needed) return null
  return useBracket().analyzeTournament(matches, players, fullRanking)
}

/**
 * Adds new matches one at a time in played order and stops at the one that
 * completes the tournament: later matches belong to the next tournament.
 * @param existing matches already in the tournament
 * @param incoming new matches, in any order
 * @returns `take`: the new matches that belong to this tournament (played order);
 *          `result`: the podium if the tournament is now complete, else null
 */
export function splitAtCompletion(
  existing: TournamentMatch[],
  incoming: TournamentMatch[],
  players: Player[],
  fullRanking: boolean,
): { take: TournamentMatch[]; result: BracketResult | null } {
  const sorted = [...incoming].sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())
  const take: TournamentMatch[] = []
  for (const m of sorted) {
    take.push(m)
    const result = completionResult([...existing, ...take], players, fullRanking)
    if (result) return { take, result }
  }
  return { take, result: null }
}
