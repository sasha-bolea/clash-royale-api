// A Clash Royale battle is identified by `${battleTime}_${sorted tags}` (useBracket.makeBattleId).
// The two players' battlelogs can report the same battle with battleTime 1-2s apart,
// so identity is "same players and times within a few seconds", not string equality.

const TOLERANCE_MS = 10_000

// Splits an id into its time (ms) and its players part; null if malformed.
function parse(id: string): { time: number; tags: string } | null {
  const i = id.indexOf('_')
  if (i < 0) return null
  const m = id.slice(0, i).match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
  if (!m) return null
  const time = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +m[6]!)
  return { time, tags: id.slice(i + 1) }
}

/**
 * True if two battle ids describe the same battle (same players, times within 10s).
 */
export function isSameBattle(a: string, b: string): boolean {
  if (a === b) return true
  const pa = parse(a)
  const pb = parse(b)
  if (!pa || !pb) return false
  return pa.tags === pb.tags && Math.abs(pa.time - pb.time) <= TOLERANCE_MS
}

/**
 * True if the battle is already in `used` (exact id or the same battle reported 1-2s apart).
 */
export function isBattleUsed(id: string, used: Iterable<string>): boolean {
  for (const u of used) if (isSameBattle(id, u)) return true
  return false
}
