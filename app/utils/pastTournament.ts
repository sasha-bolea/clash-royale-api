import type { CRBattle, Player, PodiumEntry, TournamentMatch } from '~~/shared/types/domain'
import { greedyMatching, loserId, sortByPlayed, useBracket } from '~/composables/useBracket'

// ====================================================================
// Recupero di un torneo passato: partite candidate + validazione rigorosa.
// A differenza dell'analisi "tollerante" del torneo dal vivo (useBracket),
// qui ogni partita selezionata deve avere un posto preciso nel tabellone,
// tra i giocatori giusti e DOPO le partite da cui dipende.
// ====================================================================

export type PastValidation =
  | { ok: true; size: number; fullRanking: boolean; playerIds: number[]; positions: PodiumEntry[] }
  | { ok: false; error: string }

const VALID_SIZES = [2, 3, 4, 6, 8]
// Partite necessarie per dimensione: [senza classifica completa, con classifica completa].
const MATCH_COUNTS: Record<number, [number, number]> = { 2: [1, 1], 3: [3, 3], 4: [3, 4], 6: [7, 9], 8: [7, 12] }

class InvalidBracket extends Error {}

// Stops the validation with a message for the user.
function fail(message: string): never {
  throw new InvalidBracket(message)
}

const time = (m: TournamentMatch) => new Date(m.played_at).getTime()
const isPair = (m: TournamentMatch, a: number, b: number) =>
  (m.player1_id === a && m.player2_id === b) || (m.player1_id === b && m.player2_id === a)
const hasPlayer = (m: TournamentMatch, id: number) => m.player1_id === id || m.player2_id === id

/**
 * Checks that the selected matches form one complete, valid tournament.
 * @param matches selected matches (any order); chronology is read from played_at
 * @param players clan players, used for names in messages and in the ranking
 * @returns ok + size, inferred full ranking and final positions, or a user-facing error
 */
export function validatePastTournament(matches: TournamentMatch[], players: Player[]): PastValidation {
  if (!matches.length) return { ok: false, error: 'Seleziona le partite del torneo.' }

  const sorted = sortByPlayed(matches)
  const ids = [...new Set(sorted.flatMap(m => [m.player1_id, m.player2_id]))]
  const n = ids.length
  if (!VALID_SIZES.includes(n)) {
    return { ok: false, error: `Le partite selezionate coinvolgono ${n} giocatori: un torneo ne ha 2, 3, 4, 6 o 8.` }
  }

  const [countOff, countOn] = MATCH_COUNTS[n]!
  if (sorted.length !== countOff && sorted.length !== countOn) {
    const needed = countOff === countOn
      ? `servono ${countOff} partite`
      : `servono ${countOff} partite (${countOn} con la classifica completa)`
    return { ok: false, error: `Con ${n} giocatori ${needed}: ne hai selezionate ${sorted.length}.` }
  }
  const fullRanking = sorted.length === countOn && countOn !== countOff

  const byId: Record<number, Player> = {}
  players.forEach((p) => { byId[p.id] = p })
  const name = (id: number) => byId[id]?.username ?? `#${id}`
  const entry = (id: number, place: number): PodiumEntry => ({ player_id: id, username: byId[id]?.username, place })

  try {
    let positions: PodiumEntry[]
    switch (n) {
      case 2: positions = check2(sorted, entry); break
      case 3: positions = ladder3(sorted, ids, name).map((id, i) => entry(id, i + 1)); break
      case 4: positions = check4(sorted, fullRanking, name, entry); break
      case 6: positions = check6(sorted, ids, fullRanking, name, entry); break
      default: positions = check8(sorted, fullRanking, name, entry)
    }
    return { ok: true, size: n, fullRanking, playerIds: ids, positions }
  } catch (err) {
    if (err instanceof InvalidBracket) return { ok: false, error: err.message }
    throw err
  }
}

// 2 giocatori: una partita secca.
function check2(sorted: TournamentMatch[], entry: (id: number, place: number) => PodiumEntry) {
  const m = sorted[0]!
  return [entry(m.winner_id, 1), entry(loserId(m), 2)]
}

/**
 * Scaletta a 3 (anche girone del torneo a 6): partita 1, recupero del perdente
 * contro il terzo, finale tra il vincitore della 1 e il vincitore del recupero.
 * @returns player ids in final order [1°, 2°, 3°]
 */
function ladder3(sorted: TournamentMatch[], ids: number[], name: (id: number) => string, prefix = ''): number[] {
  const [m1, m2, m3] = sorted as [TournamentMatch, TournamentMatch, TournamentMatch]
  const w1 = m1.winner_id
  const l1 = loserId(m1)
  const third = ids.find(id => !hasPlayer(m1, id))!
  if (!isPair(m2, l1, third)) {
    fail(`${prefix}La seconda partita deve essere il recupero tra ${name(l1)} (perdente della prima) e ${name(third)}.`)
  }
  const w2 = m2.winner_id
  if (!isPair(m3, w1, w2)) {
    fail(`${prefix}La finale deve essere tra ${name(w1)} e ${name(w2)}, dopo il recupero.`)
  }
  return [m3.winner_id, loserId(m3), loserId(m2)]
}

// 4 giocatori: le prime due partite sono le semifinali, poi finale (e finalina).
function check4(
  sorted: TournamentMatch[],
  fullRanking: boolean,
  name: (id: number) => string,
  entry: (id: number, place: number) => PodiumEntry,
) {
  const [s1, s2] = sorted as [TournamentMatch, TournamentMatch]
  if ([s2.player1_id, s2.player2_id].some(id => hasPlayer(s1, id))) {
    fail('Le prime due partite devono essere le semifinali, tra 4 giocatori diversi: una finale non può precedere una semifinale.')
  }
  const rest = sorted.slice(2)
  const [w1, w2, l1, l2] = [s1.winner_id, s2.winner_id, loserId(s1), loserId(s2)]
  const final = rest.find(m => isPair(m, w1, w2))
  if (!final) fail(`La finale deve essere tra ${name(w1)} e ${name(w2)}, i vincitori delle semifinali.`)
  if (!fullRanking) {
    return [entry(final.winner_id, 1), entry(loserId(final), 2), entry(l1, 3), entry(l2, 3)]
  }
  const thirdM = rest.find(m => isPair(m, l1, l2))
  if (!thirdM) fail(`La finalina 3°/4° deve essere tra ${name(l1)} e ${name(l2)}, i perdenti delle semifinali.`)
  return [entry(final.winner_id, 1), entry(loserId(final), 2), entry(thirdM.winner_id, 3), entry(loserId(thirdM), 4)]
}

// 6 giocatori: due gironi a scaletta da 3, poi incroci per posizione (solo 1° vs 1°
// senza classifica completa). Prova ogni divisione in due gironi: le rivincite
// (finale del girone tra gli stessi due della partita 1) non formano un triangolo.
function check6(
  sorted: TournamentMatch[],
  ids: number[],
  fullRanking: boolean,
  name: (id: number) => string,
  entry: (id: number, place: number) => PodiumEntry,
) {
  let firstError: string | null = null
  const [first, ...others] = ids as [number, ...number[]]

  for (let i = 0; i < others.length; i++) {
    for (let j = i + 1; j < others.length; j++) {
      const gA = [first, others[i]!, others[j]!]
      const gB = ids.filter(id => !gA.includes(id))
      const inGroup = (g: number[]) => sorted.filter(m => g.includes(m.player1_id) && g.includes(m.player2_id))
      const mA = inGroup(gA)
      const mB = inGroup(gB)
      if (mA.length !== 3 || mB.length !== 3) continue
      try {
        const a = ladder3(mA, gA, name, 'Girone A: ')
        const b = ladder3(mB, gB, name, 'Girone B: ')
        const groupsEnd = Math.max(time(mA[2]!), time(mB[2]!))
        const crosses = sorted.filter(m => !mA.includes(m) && !mB.includes(m))
        if (crosses.some(m => time(m) <= groupsEnd)) {
          fail('Gli incroci vanno giocati dopo la fine di entrambi i gironi.')
        }
        const ranks = fullRanking ? [0, 1, 2] : [0]
        const crossOf = ranks.map((r) => {
          const m = crosses.find(c => isPair(c, a[r]!, b[r]!))
          if (!m) fail(`Manca l'incrocio tra ${name(a[r]!)} e ${name(b[r]!)} (${r + 1}° di ogni girone).`)
          return m
        })
        if (!fullRanking) {
          const x = crossOf[0]!
          return [
            entry(x.winner_id, 1), entry(loserId(x), 2),
            entry(a[1]!, 3), entry(b[1]!, 3), entry(a[2]!, 5), entry(b[2]!, 5),
          ]
        }
        return crossOf.flatMap((x, r) => [entry(x.winner_id, r * 2 + 1), entry(loserId(x), r * 2 + 2)])
      } catch (err) {
        if (!(err instanceof InvalidBracket)) throw err
        firstError ??= err.message
      }
    }
  }
  fail(firstError ?? 'Con 6 giocatori servono due gironi da 3 giocatori (3 partite ciascuno), seguiti dagli incroci.')
}

// 8 giocatori: quarti, semifinali, finale (+ finalina e consolazione 5°-8°).
// Ogni partita dopo i quarti va giocata dopo il quarto di entrambi i giocatori.
function check8(
  sorted: TournamentMatch[],
  fullRanking: boolean,
  name: (id: number) => string,
  entry: (id: number, place: number) => PodiumEntry,
) {
  const qf = greedyMatching(sorted, { limit: 4 })
  if (qf.length < 4) fail('I quarti devono essere 4 partite tra 8 giocatori diversi.')
  const qfTime: Record<number, number> = {}
  qf.forEach((m) => { qfTime[m.player1_id] = time(m); qfTime[m.player2_id] = time(m) })
  const qfIds = new Set(qf.map(m => m.id))

  for (const m of sorted) {
    if (qfIds.has(m.id)) continue
    const early = [m.player1_id, m.player2_id].find(id => time(m) <= qfTime[id]!)
    if (early != null) {
      fail(`${name(m.player1_id)} e ${name(m.player2_id)} si sono affrontati prima che ${name(early)} giocasse il suo quarto di finale.`)
    }
  }

  const used = new Set(qfIds)
  // Mini-tabellone a 4 (semifinali + finale [+ finalina]) tra i giocatori di `pool`.
  const bracket4 = (pool: number[], withThird: boolean, label: string) => {
    const semis = greedyMatching(sorted, { pool: new Set(pool), exclude: used, limit: 2 })
    if (semis.length < 2) fail(`${label}: servono 2 semifinali tra ${pool.map(name).join(', ')}.`)
    semis.forEach(s => used.add(s.id))
    const semisEnd = Math.max(time(semis[0]!), time(semis[1]!))
    const [w1, w2] = semis.map(s => s.winner_id) as [number, number]
    const [l1, l2] = semis.map(s => loserId(s)) as [number, number]
    const final = sorted.find(m => !used.has(m.id) && isPair(m, w1, w2))
    if (!final || time(final) <= semisEnd) fail(`${label}: la finale tra ${name(w1)} e ${name(w2)} va giocata dopo entrambe le semifinali.`)
    used.add(final.id)
    if (!withThird) return { final, l1, l2 }
    const third = sorted.find(m => !used.has(m.id) && isPair(m, l1, l2))
    if (!third || time(third) <= semisEnd) fail(`${label}: la finale tra ${name(l1)} e ${name(l2)} va giocata dopo entrambe le semifinali.`)
    used.add(third.id)
    return { final, third, l1, l2 }
  }

  const main = bracket4(qf.map(m => m.winner_id), fullRanking, 'Tabellone principale')
  const qfLosers = qf.map(m => loserId(m))
  let positions: PodiumEntry[]
  if (!fullRanking) {
    positions = [
      entry(main.final.winner_id, 1), entry(loserId(main.final), 2),
      entry(main.l1, 3), entry(main.l2, 3), ...qfLosers.map(id => entry(id, 5)),
    ]
  } else {
    const cons = bracket4(qfLosers, true, 'Consolazione 5°-8°')
    positions = [
      entry(main.final.winner_id, 1), entry(loserId(main.final), 2),
      entry(main.third!.winner_id, 3), entry(loserId(main.third!), 4),
      entry(cons.final.winner_id, 5), entry(loserId(cons.final), 6),
      entry(cons.third!.winner_id, 7), entry(loserId(cons.third!), 8),
    ]
  }
  if (used.size !== sorted.length) fail('Alcune partite selezionate non fanno parte del tabellone del torneo.')
  return positions
}

/**
 * Builds the list of past 1v1 battles between clan members that can be picked.
 * @param battlelogs one Clash Royale battlelog per clan player (same battle may appear twice)
 * @param clanPlayers players of the clan (tags identify who played)
 * @param usedBattleIds cr_battle_id already belonging to a non-annulled tournament
 * @returns candidate matches (temporary ids), most recent first
 */
export function findCandidateBattles(
  battlelogs: CRBattle[][],
  clanPlayers: Player[],
  usedBattleIds: Set<string>,
): TournamentMatch[] {
  const bracket = useBracket()
  const byTag: Record<string, Player> = {}
  clanPlayers.forEach((p) => { byTag[p.cr_tag.replace('#', '').toUpperCase()] = p })
  const tagOf = (t: string) => t.replace('#', '').toUpperCase()

  const seen = new Set<string>()
  const out: TournamentMatch[] = []
  for (const log of battlelogs) {
    for (const b of log) {
      if (b.team.length !== 1 || b.opponent.length !== 1) continue
      const p1 = byTag[tagOf(b.team[0]!.tag)]
      const p2 = byTag[tagOf(b.opponent[0]!.tag)]
      if (!p1 || !p2 || p1.id === p2.id) continue
      const crId = bracket.makeBattleId(b.battleTime, [b.team[0]!.tag], [b.opponent[0]!.tag])
      if (seen.has(crId) || usedBattleIds.has(crId)) continue
      seen.add(crId)
      const c1 = b.team[0]!.crowns ?? 0
      const c2 = b.opponent[0]!.crowns ?? 0
      out.push({
        id: out.length + 1,
        tournament_id: 0,
        player1_id: p1.id,
        player2_id: p2.id,
        // Stessa regola del torneo dal vivo: in parità di corone vince player1.
        winner_id: c1 >= c2 ? p1.id : p2.id,
        crowns_p1: c1,
        crowns_p2: c2,
        played_at: bracket.parseCRDate(b.battleTime).toISOString(),
        cr_battle_id: crId,
        player1: { id: p1.id, username: p1.username, cr_tag: p1.cr_tag },
        player2: { id: p2.id, username: p2.username, cr_tag: p2.cr_tag },
      })
    }
  }
  return out.sort((a, b) => time(b) - time(a))
}
