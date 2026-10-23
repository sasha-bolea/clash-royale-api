import type { Clan } from '~~/shared/types/domain'
import type { SavedClan } from '~/composables/useBrowserSession'

// Clan codes are always 6 uppercase letters/digits (createClan and the
// regenerate_code SQL function both generate this format).
const CODE_RE = /^[A-Z0-9]{6}$/

/**
 * Cleans what the user typed (spaces, leading #, lowercase) and checks the format.
 * @returns the code in canonical form, or null if it can't be a clan code
 */
export function normalizeClanCode(input: string): string | null {
  const code = input.trim().replace(/^#/, '').toUpperCase()
  return CODE_RE.test(code) ? code : null
}

/**
 * True only for a real clan row. For an unknown code the get_clan_by_code RPC
 * (RETURNS clans) answers with a row whose fields are all null, not with null.
 */
export function isClanFound(clan: Partial<Record<keyof Clan, unknown>> | null | undefined): clan is Clan {
  return !!clan && typeof clan.id === 'number' && typeof clan.code === 'string' && CODE_RE.test(clan.code)
}

/**
 * Keeps only well-formed saved clans (drops entries saved by the old bug or corrupted).
 * @param list raw value read from localStorage
 */
export function sanitizeSavedClans(list: unknown[]): SavedClan[] {
  return list.filter((c): c is SavedClan => {
    if (!c || typeof c !== 'object') return false
    const s = c as Record<string, unknown>
    return typeof s.clan_id === 'number'
      && typeof s.code === 'string' && CODE_RE.test(s.code)
      && typeof s.name === 'string' && s.name.length > 0
  })
}
