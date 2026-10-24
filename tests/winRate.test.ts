import { describe, it, expect } from 'vitest'
import { winRateSeries } from '~/utils/winRate'
import type { Tournament, TournamentMatch } from '~~/shared/types/domain'

// Builds a minimal match between two player ids.
function m(p1: number, p2: number, winner: number): TournamentMatch {
  return { id: 0, tournament_id: 0, player1_id: p1, player2_id: p2, winner_id: winner, crowns_p1: 0, crowns_p2: 0, played_at: '', cr_battle_id: '' }
}

// Builds a minimal tournament with the given matches.
function t(id: number, matches: TournamentMatch[]): Tournament {
  return { id, clan_id: 1, match_type: 'amichevole', status: 'finished', full_ranking: false, started_at: '', finished_at: null, tournament_matches: matches }
}

describe('winRateSeries', () => {
  it('gives the percentage of matches won in each tournament', () => {
    const s = winRateSeries([t(1, [m(1, 2, 1), m(1, 3, 3), m(2, 3, 2)])], [1, 2, 3])
    expect(s[1]).toEqual([50])
    expect(s[2]).toEqual([50])
    expect(s[3]).toEqual([50])
  })

  it('rounds to whole percentages', () => {
    const s = winRateSeries([t(1, [m(1, 2, 1), m(1, 3, 1), m(1, 4, 4)])], [1])
    expect(s[1]).toEqual([67])
  })

  it('leaves a gap (null) when the player did not play', () => {
    const s = winRateSeries([t(1, [m(1, 2, 1)]), t(2, [m(2, 3, 3)])], [1, 3])
    expect(s[1]).toEqual([100, null])
    expect(s[3]).toEqual([null, 100])
  })

  it('handles a tournament with no matches', () => {
    expect(winRateSeries([t(1, [])], [1])[1]).toEqual([null])
  })
})
