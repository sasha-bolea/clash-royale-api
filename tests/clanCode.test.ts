import { describe, expect, it } from 'vitest'
import { isClanFound, normalizeClanCode, sanitizeSavedClans } from '~/utils/clanCode'

// User story: "non deve essere possibile salvare un clan con un codice non valido"
describe('normalizeClanCode', () => {
  it('accetta 6 lettere/numeri, con # e spazi, in maiuscolo', () => {
    expect(normalizeClanCode(' #mthv83 ')).toBe('MTHV83')
  })
  it('rifiuta lunghezze sbagliate e caratteri non ammessi', () => {
    expect(normalizeClanCode('MTHV8')).toBeNull()
    expect(normalizeClanCode('MTHV834')).toBeNull()
    expect(normalizeClanCode('MTH-83')).toBeNull()
    expect(normalizeClanCode('')).toBeNull()
  })
})

describe('isClanFound', () => {
  it('la riga vuota restituita dal database per un codice inesistente non è un clan', () => {
    expect(isClanFound({ id: null, name: null, code: null, created_at: null })).toBe(false)
    expect(isClanFound(null)).toBe(false)
    expect(isClanFound({ id: 3, name: 'torneo fioi', code: 'MTHV83', created_at: '' })).toBe(true)
  })
})

describe('sanitizeSavedClans', () => {
  it('scarta le voci salvate senza id, codice o nome', () => {
    const list = [
      { clan_id: 3, code: 'MTHV83', name: 'torneo fioi', joined_at: '' },
      { clan_id: null, code: null, name: null, joined_at: '' },
      { clan_id: 4, code: '', name: 'x', joined_at: '' },
      'spazzatura',
    ]
    expect(sanitizeSavedClans(list).map(c => c.code)).toEqual(['MTHV83'])
  })
})
