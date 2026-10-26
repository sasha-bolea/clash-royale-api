import { describe, expect, it } from 'vitest'
import type { Player, TournamentMatch } from '~~/shared/types/domain'
import { splitAtCompletion } from '~/utils/completion'

const P = (id: number): Player => ({ id, clan_id: 1, username: `P${id}`, cr_tag: `#T${id}`, created_at: '' })

let seq = 0
// Match between a and b won by w, played at minute `min`.
const M = (a: number, b: number, w: number, min: number): TournamentMatch => ({
  id: ++seq, tournament_id: 0, player1_id: a, player2_id: b, winner_id: w,
  crowns_p1: w === a ? 1 : 0, crowns_p2: w === b ? 1 : 0,
  played_at: new Date(Date.UTC(2026, 9, 25, 18, min)).toISOString(), cr_battle_id: `b${seq}`,
})

const three = [P(1), P(2), P(3)]

// User story: "se riapro l'app dopo aver giocato più tornei di fila, ogni torneo
// deve avere solo le sue partite" (bug torneo 91: 6 partite in un torneo a 3).
describe('splitAtCompletion', () => {
  it('stops at the match that completes the tournament, in played order', () => {
    const final = M(1, 2, 1, 10)
    const later = [M(3, 1, 3, 20), M(2, 1, 2, 30)]
    // Read out of order, as when several battlelogs are merged.
    const incoming = [later[1]!, final, M(2, 3, 2, 5), later[0]!, M(1, 3, 1, 1)]
    const { take, result } = splitAtCompletion([], incoming, three, false)
    expect(take.map(m => m.played_at)).toEqual([1, 5, 10].map(min => new Date(Date.UTC(2026, 9, 25, 18, min)).toISOString()))
    expect(result?.positions[0]?.player_id).toBe(1)
  })

  it('takes everything when the tournament is not complete yet', () => {
    const incoming = [M(1, 3, 1, 1), M(2, 3, 2, 5)]
    const { take, result } = splitAtCompletion([], incoming, three, false)
    expect(take).toHaveLength(2)
    expect(result).toBeNull()
  })

  it('continues from the matches already saved', () => {
    const existing = [M(1, 3, 1, 1), M(2, 3, 2, 5)]
    const { take, result } = splitAtCompletion(existing, [M(3, 1, 3, 20), M(1, 2, 2, 10)], three, false)
    expect(take).toHaveLength(1)
    expect(result?.positions[0]?.player_id).toBe(2)
  })

  it('2 players: only the first match counts', () => {
    const { take } = splitAtCompletion([], [M(1, 2, 2, 9), M(1, 2, 1, 3)], [P(1), P(2)], false)
    expect(take.map(m => m.winner_id)).toEqual([1])
  })
})
