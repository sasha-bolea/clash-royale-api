import { describe, expect, it } from 'vitest'
import type { Player, TournamentMatch } from '~~/shared/types/domain'
import { countSuggestionChoices } from '~/composables/useSuggestions'

const P = (id: number): Player => ({ id, clan_id: 1, username: `P${id}`, cr_tag: `#T${id}`, created_at: '' })
const players = (n: number) => Array.from({ length: n }, (_, i) => P(i + 1))
let seq = 0
const M = (a: number, b: number, w: number, min: number): TournamentMatch => ({
  id: ++seq, tournament_id: 0, player1_id: a, player2_id: b, winner_id: w,
  crowns_p1: 1, crowns_p2: 0, played_at: new Date(Date.UTC(2026, 9, 22, 18, min)).toISOString(), cr_battle_id: `b${seq}`,
})

// User story: "Suggerisci non deve essere premibile se c'è una sola combinazione possibile"
describe('countSuggestionChoices', () => {
  it('2 giocatori: nessuna scelta', () => {
    expect(countSuggestionChoices([], players(2), 2)).toBe(0)
  })
  it('3 giocatori: 3 scelte prima della prima partita, nessuna dopo', () => {
    expect(countSuggestionChoices([], players(3), 3)).toBe(3)
    expect(countSuggestionChoices([M(1, 2, 1, 0)], players(3), 3)).toBe(0)
  })
  it('4 giocatori: 3 scelte all\'inizio, 1 sola dopo la prima semifinale, 0 dopo la seconda', () => {
    expect(countSuggestionChoices([], players(4), 4)).toBe(3)
    expect(countSuggestionChoices([M(1, 2, 1, 0)], players(4), 4)).toBe(1)
    expect(countSuggestionChoices([M(1, 2, 1, 0), M(3, 4, 3, 1)], players(4), 4)).toBe(0)
  })
  it('8 giocatori: 105, 15, 3, 1 man mano che si giocano i quarti', () => {
    const qf = [M(1, 2, 1, 0), M(3, 4, 3, 1), M(5, 6, 5, 2), M(7, 8, 7, 3)]
    expect([0, 1, 2, 3, 4].map(k => countSuggestionChoices(qf.slice(0, k), players(8), 8))).toEqual([105, 15, 3, 1, 0])
  })
  it('6 giocatori: 3 scelte per girone finché la sua prima partita non è giocata', () => {
    expect(countSuggestionChoices([], players(6), 6)).toBe(9)
    expect(countSuggestionChoices([M(1, 2, 1, 0)], players(6), 6)).toBe(3)
    expect(countSuggestionChoices([M(1, 2, 1, 0), M(4, 5, 4, 1)], players(6), 6)).toBe(0)
  })
})
