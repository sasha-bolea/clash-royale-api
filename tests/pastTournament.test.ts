import { describe, expect, it } from 'vitest'
import type { CRBattle, Player, TournamentMatch } from '~~/shared/types/domain'
import { findCandidateBattles, validatePastTournament } from '~/utils/pastTournament'

// ---------- helpers ----------
const P = (id: number, name = `P${id}`): Player =>
  ({ id, clan_id: 1, username: name, cr_tag: `#T${id}`, created_at: '' })

let seq = 0
// Match between a and b won by w, played at minute `min` (chronological order matters).
const M = (a: number, b: number, w: number, min: number): TournamentMatch => ({
  id: ++seq,
  tournament_id: 0,
  player1_id: a,
  player2_id: b,
  winner_id: w,
  crowns_p1: w === a ? 1 : 0,
  crowns_p2: w === b ? 1 : 0,
  played_at: new Date(Date.UTC(2026, 9, 20, 15, min)).toISOString(),
  cr_battle_id: `b${seq}`,
})

const players = (n: number) => Array.from({ length: n }, (_, i) => P(i + 1))
const winnerOf = (r: ReturnType<typeof validatePastTournament>) =>
  r.ok ? r.positions.find((p, i) => (p.place ?? i + 1) === 1)?.player_id : undefined

// ---------- user story: "ho giocato un torneo ma ho dimenticato di avviarlo" ----------
describe('validatePastTournament — tornei validi', () => {
  it('2 giocatori: una partita secca', () => {
    const r = validatePastTournament([M(1, 2, 2, 0)], players(2))
    expect(r.ok).toBe(true)
    expect(winnerOf(r)).toBe(2)
  })

  it('3 giocatori: partita 1, recupero del perdente contro il terzo, finale', () => {
    const r = validatePastTournament([
      M(1, 2, 1, 0), // P1 batte P2
      M(2, 3, 3, 5), // recupero: P2 (perdente) vs P3, vince P3
      M(1, 3, 3, 9), // finale: P1 vs P3, vince P3
    ], players(3))
    expect(r.ok).toBe(true)
    expect(r.ok && r.size).toBe(3)
    expect(winnerOf(r)).toBe(3)
  })

  it('4 giocatori senza finalina (3 partite) e con finalina (4 partite)', () => {
    const base = [M(1, 2, 1, 0), M(3, 4, 4, 1), M(1, 4, 4, 5)]
    const r3 = validatePastTournament(base, players(4))
    expect(r3.ok && r3.fullRanking).toBe(false)
    expect(winnerOf(r3)).toBe(4)

    const r4 = validatePastTournament([...base, M(2, 3, 2, 6)], players(4))
    expect(r4.ok && r4.fullRanking).toBe(true)
  })

  it('6 giocatori: due gironi a scaletta + incrocio dei primi', () => {
    const r = validatePastTournament([
      M(1, 2, 1, 0), M(2, 3, 2, 1), M(1, 2, 1, 2), // girone A: finale rivincita, vince P1
      M(4, 5, 4, 0), M(5, 6, 6, 1), M(4, 6, 6, 3), // girone B: vince P6
      M(1, 6, 1, 10), // incrocio 1°A vs 1°B
    ], players(6))
    expect(r.ok).toBe(true)
    expect(r.ok && r.fullRanking).toBe(false)
    expect(winnerOf(r)).toBe(1)
  })

  it('6 giocatori con classifica completa: 3 incroci per posizione', () => {
    const r = validatePastTournament([
      M(1, 2, 1, 0), M(2, 3, 3, 1), M(1, 3, 1, 2), // A: 1° P1, 2° P3, 3° P2
      M(4, 5, 4, 0), M(5, 6, 6, 1), M(4, 6, 6, 3), // B: 1° P6, 2° P4, 3° P5
      M(1, 6, 6, 10), M(3, 4, 3, 11), M(2, 5, 5, 12),
    ], players(6))
    expect(r.ok && r.fullRanking).toBe(true)
    expect(winnerOf(r)).toBe(6)
  })

  it('8 giocatori: quarti, semifinali, finale (una semifinale può precedere un quarto non suo)', () => {
    const r = validatePastTournament([
      M(1, 2, 1, 0), M(3, 4, 3, 1),
      M(1, 3, 1, 2), // semifinale tra vincitori dei primi due quarti, prima degli altri quarti
      M(5, 6, 5, 3), M(7, 8, 8, 4),
      M(5, 8, 8, 6),
      M(1, 8, 8, 9), // finale
    ], players(8))
    expect(r.ok && r.fullRanking).toBe(false)
    expect(winnerOf(r)).toBe(8)
  })

  it('8 giocatori con classifica completa: finalina e consolazione 5°-8°', () => {
    const r = validatePastTournament([
      M(1, 2, 1, 0), M(3, 4, 3, 1), M(5, 6, 5, 2), M(7, 8, 7, 3), // quarti
      M(1, 3, 1, 5), M(5, 7, 7, 6), // semifinali
      M(2, 4, 2, 7), M(6, 8, 8, 8), // consolazione
      M(1, 7, 1, 10), M(3, 5, 5, 11), // finale, finalina
      M(2, 8, 2, 12), M(4, 6, 6, 13), // 5°/6°, 7°/8°
    ], players(8))
    expect(r.ok && r.fullRanking).toBe(true)
    expect(winnerOf(r)).toBe(1)
  })
})

// ---------- user story: "se le partite non formano un torneo, voglio sapere perché" ----------
describe('validatePastTournament — configurazioni non valide', () => {
  const expectError = (r: ReturnType<typeof validatePastTournament>, re: RegExp) => {
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(re)
  }

  it('nessuna partita', () => {
    expectError(validatePastTournament([], players(2)), /Seleziona/)
  })

  it('numero di giocatori non ammesso (5)', () => {
    expectError(validatePastTournament([
      M(1, 2, 1, 0), M(3, 4, 3, 1), M(1, 5, 1, 2), M(1, 3, 1, 3),
    ], players(5)), /5 giocatori/)
  })

  it('numero di partite sbagliato', () => {
    expectError(validatePastTournament([
      M(1, 2, 1, 0), M(3, 4, 3, 1), M(1, 3, 1, 2), M(2, 4, 2, 3), M(1, 4, 1, 4),
    ], players(4)), /servono 3 partite/)
  })

  it('3 giocatori: la finale giocata prima del recupero', () => {
    expectError(validatePastTournament([
      M(1, 2, 1, 0),
      M(1, 3, 3, 5), // finale anticipata
      M(2, 3, 3, 9), // recupero dopo
    ], players(3)), /recupero/i)
  })

  it('3 giocatori: la finale tra i giocatori sbagliati', () => {
    expectError(validatePastTournament([
      M(1, 2, 1, 0),
      M(2, 3, 2, 5), // recupero vinto da P2
      M(1, 3, 1, 9), // la finale doveva essere P1 vs P2
    ], players(3)), /finale/i)
  })

  it('4 giocatori: la finale prima della seconda semifinale', () => {
    expectError(validatePastTournament([
      M(1, 2, 1, 0), M(1, 3, 1, 1), M(3, 4, 3, 2),
    ], players(4)), /semifinal/i)
  })

  it('4 giocatori: la finale non tra i vincitori delle semifinali', () => {
    expectError(validatePastTournament([
      M(1, 2, 1, 0), M(3, 4, 3, 1), M(2, 3, 3, 2),
    ], players(4)), /finale/i)
  })

  it('6 giocatori: incrocio giocato prima della fine dei gironi', () => {
    expectError(validatePastTournament([
      M(1, 2, 1, 0), M(2, 3, 2, 1), M(1, 2, 1, 2),
      M(4, 5, 4, 0), M(5, 6, 6, 1),
      M(1, 6, 1, 2), // incrocio prima della finale del girone B
      M(4, 6, 6, 3),
    ], players(6)), /incroc/i)
  })

  it('8 giocatori: semifinale prima del quarto di uno dei due giocatori', () => {
    expectError(validatePastTournament([
      M(1, 2, 1, 0),
      M(1, 3, 1, 1), // P3 non ha ancora giocato il suo quarto
      M(3, 4, 3, 2), M(5, 6, 5, 3), M(7, 8, 8, 4), M(5, 8, 8, 6), M(1, 8, 8, 9),
    ], players(8)), /quart/i)
  })
})

// ---------- user story: "voglio scegliere solo partite tra membri, non già usate" ----------
describe('findCandidateBattles', () => {
  const clan = [P(1, 'Anna'), P(2, 'Bea'), P(3, 'Ciro')]
  const battle = (time: string, a: string, b: string, ca: number, cb: number, extraTeam = false): CRBattle => ({
    battleTime: time,
    type: 'friendly',
    team: [{ tag: a, crowns: ca }, ...(extraTeam ? [{ tag: '#X', crowns: ca }] : [])],
    opponent: [{ tag: b, crowns: cb }],
  } as CRBattle)

  it('tiene i 1v1 tra membri, toglie duplicati, esterni, 2v2 e partite già usate', () => {
    const logs = [
      [battle('20261020T150000.000Z', '#T1', '#T2', 1, 0), battle('20261020T151000.000Z', '#T1', '#ZZ', 3, 0)],
      [battle('20261020T150000.000Z', '#T2', '#T1', 0, 1), battle('20261020T152000.000Z', '#T2', '#T3', 2, 1)],
      [battle('20261020T153000.000Z', '#T3', '#T1', 1, 0, true), battle('20261020T152000.000Z', '#T3', '#T2', 1, 2)],
    ]
    const used = new Set<string>()
    const all = findCandidateBattles(logs, clan, used)
    expect(all.map(c => `${c.player1_id}-${c.player2_id}-${c.winner_id}`)).toEqual(['2-3-2', '1-2-1'])
    // ordinate dalla più recente
    expect(new Date(all[0]!.played_at) > new Date(all[1]!.played_at)).toBe(true)

    const withUsed = findCandidateBattles(logs, clan, new Set([all[1]!.cr_battle_id]))
    expect(withUsed.map(c => c.player1_id)).toEqual([2])
  })
})
