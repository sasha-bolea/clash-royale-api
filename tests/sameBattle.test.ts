import { describe, expect, it } from 'vitest'
import { isSameBattle, isBattleUsed } from '~/utils/sameBattle'

// Battle ids are `${battleTime}_${sorted tags}` (useBracket.makeBattleId).
// User story: "una partita deve contare una volta sola, anche se Clash Royale
// la riporta con un secondo di differenza nello storico dei due giocatori"
describe('isSameBattle', () => {
  it('stessi giocatori, orari a 1 secondo: stessa partita', () => {
    expect(isSameBattle('20261023T044639.000Z_LLRCP2U2L_LV8LYP88', '20261023T044640.000Z_LLRCP2U2L_LV8LYP88')).toBe(true)
  })
  it('stessi giocatori, partite a 2 minuti: diverse', () => {
    expect(isSameBattle('20261023T044639.000Z_LLRCP2U2L_LV8LYP88', '20261023T044839.000Z_LLRCP2U2L_LV8LYP88')).toBe(false)
  })
  it('giocatori diversi, stesso orario: diverse', () => {
    expect(isSameBattle('20261023T044639.000Z_LLRCP2U2L_LV8LYP88', '20261023T044639.000Z_CL0VV9JU_LLRCP2U2L')).toBe(false)
  })
})

// User story: "un torneo nuovo non deve prendere partite di un torneo precedente"
describe('isBattleUsed', () => {
  const used = new Set(['20261023T045108.000Z_CL0VV9JU_LLRCP2U2L'])
  it('la finale del torneo precedente è già usata, anche con orario spostato di 1s', () => {
    expect(isBattleUsed('20261023T045108.000Z_CL0VV9JU_LLRCP2U2L', used)).toBe(true)
    expect(isBattleUsed('20261023T045109.000Z_CL0VV9JU_LLRCP2U2L', used)).toBe(true)
  })
  it('una partita nuova non è usata', () => {
    expect(isBattleUsed('20261023T050000.000Z_CL0VV9JU_LLRCP2U2L', used)).toBe(false)
  })
})
