import type {
  Player,
  TournamentMatch,
  BracketFormat,
  BracketSlot,
  BracketNode,
  BracketRound,
  BracketView,
} from '~~/shared/types/domain'
import {
  loserId,
  findMatch,
  sortByPlayed,
  greedyMatching,
  detectQuarters,
  detectTriangles,
} from '~/composables/useBracket'

// Costruisce la struttura bracket PARZIALE dallo stream di partite corrente.
// Gli slot non ancora noti restano vuoti (verranno mostrati come "?").
// Riusa le primitive di detection di useBracket (nessun euristico duplicato).
export function buildBracketView(
  matches: TournamentMatch[],
  players: Player[],
  format: BracketFormat,
  fullRanking: boolean,
): BracketView {
  const byId: Record<number, Player> = {}
  players.forEach(p => { byId[p.id] = p })
  const slot = (id?: number): BracketSlot =>
    id == null ? {} : { playerId: id, username: byId[id]?.username }

  const sorted = sortByPlayed(matches)

  // Nodo da una partita reale (slot pieni + vincitore).
  const fromMatch = (id: string, m: TournamentMatch, label?: string): BracketNode =>
    ({ id, label, slotA: slot(m.player1_id), slotB: slot(m.player2_id), winnerId: m.winner_id })
  // Nodo vuoto/parziale (slot eventualmente noti, nessun vincitore).
  const node = (id: string, a?: number, b?: number, label?: string): BracketNode =>
    ({ id, label, slotA: slot(a), slotB: slot(b) })

  switch (format) {
    case 2: return build2(sorted, players, fullRanking, fromMatch, node)
    case 3: return build3(sorted, players, fullRanking, fromMatch, node)
    case 4: return build4(sorted, fullRanking, fromMatch, node)
    case 6: return build6(sorted, players, fullRanking, byId, slot, fromMatch, node)
    case 8: return build8(sorted, fullRanking, fromMatch, node)
  }
}

type MkFromMatch = (id: string, m: TournamentMatch, label?: string) => BracketNode
type MkNode = (id: string, a?: number, b?: number, label?: string) => BracketNode

// 2 giocatori: partita secca. Entrambi gli slot noti dai partecipanti.
function build2(
  sorted: TournamentMatch[], players: Player[], fullRanking: boolean,
  fromMatch: MkFromMatch, node: MkNode,
): BracketView {
  const m = sorted[0]
  const ids = players.map(p => p.id)
  const finale = m ? fromMatch('f', m, 'Finale') : node('f', ids[0], ids[1], 'Finale')
  return { format: 2, fullRanking, rounds: [{ id: 'r1', label: 'Finale', matches: [finale] }] }
}

// 3 giocatori (scaletta): M1 A vs B → M2 perdente vs C → M3 finale tra i vincitori.
function build3(
  sorted: TournamentMatch[], players: Player[], fullRanking: boolean,
  fromMatch: MkFromMatch, node: MkNode,
): BracketView {
  const m1 = sorted[0]
  let m1Node: BracketNode
  let m2Node: BracketNode
  let m3Node: BracketNode

  if (!m1) {
    m1Node = node('m1', undefined, undefined, 'Partita 1')
    m2Node = node('m2', undefined, undefined, 'Recupero')
    m3Node = node('m3', undefined, undefined, 'Finale')
  } else {
    m1Node = fromMatch('m1', m1, 'Partita 1')
    const w1 = m1.winner_id
    const l1 = loserId(m1)
    const third = players.map(p => p.id).find(id => id !== m1.player1_id && id !== m1.player2_id)
    const m2 = sorted.find(m =>
      m.id !== m1.id && (m.player1_id === l1 || m.player2_id === l1))
    m2Node = m2 ? fromMatch('m2', m2, 'Recupero') : node('m2', l1, third, 'Recupero')
    const w2 = m2?.winner_id
    const m3 = sorted.find(m => m.id !== m1.id && (!m2 || m.id !== m2.id))
    m3Node = m3 ? fromMatch('m3', m3, 'Finale') : node('m3', w1, w2, 'Finale')
  }

  return {
    format: 3,
    fullRanking,
    rounds: [
      { id: 'r1', label: 'Partita 1', matches: [m1Node] },
      { id: 'r2', label: 'Recupero', matches: [m2Node] },
      { id: 'r3', label: 'Finale', matches: [m3Node] },
    ],
  }
}

// 4 giocatori: 2 semifinali → finale (+ finalina 3°/4° se fullRanking).
function build4(
  sorted: TournamentMatch[], fullRanking: boolean,
  fromMatch: MkFromMatch, node: MkNode,
): BracketView {
  const sem = greedyMatching(sorted, { limit: 2 })
  const semi1 = sem[0]
  const semi2 = sem[1]
  const semiNodes: BracketNode[] = [
    semi1 ? fromMatch('s1', semi1) : node('s1'),
    semi2 ? fromMatch('s2', semi2) : node('s2'),
  ]

  const rest = sorted.filter(m => m.id !== semi1?.id && m.id !== semi2?.id)
  let finalNode: BracketNode
  const extras: BracketRound[] = []

  if (semi1 && semi2) {
    const w1 = semi1.winner_id
    const w2 = semi2.winner_id
    const l1 = loserId(semi1)
    const l2 = loserId(semi2)
    const finalM = findMatch(rest, w1, w2)
    finalNode = finalM ? fromMatch('f', finalM, 'Finale') : node('f', w1, w2, 'Finale')

    if (fullRanking) {
      const thirdM = findMatch(rest, l1, l2)
      extras.push({
        id: 'third',
        label: 'Finalina 3°/4°',
        matches: [thirdM ? fromMatch('t', thirdM, '3°/4°') : node('t', l1, l2, '3°/4°')],
      })
    }
    // OFF: nessuna finalina, perdenti semifinali pari merito 3° (no card extra).
  } else {
    finalNode = node('f', undefined, undefined, 'Finale')
  }

  return {
    format: 4,
    fullRanking,
    rounds: [
      { id: 'r1', label: 'Semifinali', matches: semiNodes },
      { id: 'r2', label: 'Finale', matches: [finalNode] },
    ],
    extras,
  }
}

// 6 giocatori: 2 gironi da 3 (scaletta) + incrocio per posizione.
function build6(
  sorted: TournamentMatch[], players: Player[], fullRanking: boolean,
  byId: Record<number, Player>,
  slot: (id?: number) => BracketSlot,
  fromMatch: MkFromMatch, node: MkNode,
): BracketView {
  const ids = players.map(p => p.id)
  const tris = detectTriangles(sorted, ids)
  if (!tris) {
    return { format: 6, fullRanking, rounds: [], groups: null, groupsPending: true }
  }
  const [gA, gB] = tris

  // Costruisce le 3 partite scaletta di un girone + ranking interno.
  const groupRounds = (gIds: number[], prefix: string): { rounds: BracketRound[]; rank: number[] } => {
    const setG = new Set(gIds)
    const gm = sorted.filter(m => setG.has(m.player1_id) && setG.has(m.player2_id))
    const view = build3(gm, gIds.map(id => byId[id]!), false,
      (id, m, label) => ({ id: `${prefix}-${id}`, label, slotA: slot(m.player1_id), slotB: slot(m.player2_id), winnerId: m.winner_id }),
      (id, a, b, label) => ({ id: `${prefix}-${id}`, label, slotA: slot(a), slotB: slot(b) }),
    )
    // ranking interno: usa le partite scaletta (winner finale=1°, perdente=2°, perdente recupero=3°)
    const m1 = gm[0]
    let rank: number[] = []
    if (m1) {
      const l1 = loserId(m1)
      const m2 = gm.find(m => m.id !== m1.id && (m.player1_id === l1 || m.player2_id === l1))
      const m3 = gm.find(m => m.id !== m1.id && (!m2 || m.id !== m2.id))
      if (m2 && m3) rank = [m3.winner_id, loserId(m3), loserId(m2)]
    }
    return { rounds: view.rounds, rank }
  }

  const a = groupRounds(gA, 'A')
  const b = groupRounds(gB, 'B')

  // Incrocio per posizione (richiede ranking interni completi).
  const extras: BracketRound[] = []
  if (a.rank.length === 3 && b.rank.length === 3) {
    const pairs = fullRanking
      ? [[0, '1°A vs 1°B'], [1, '2°A vs 2°B'], [2, '3°A vs 3°B']] as const
      : [[0, '1°A vs 1°B']] as const
    const crossNodes: BracketNode[] = pairs.map(([i, label]) => {
      const aId = a.rank[i]!
      const bId = b.rank[i]!
      const m = findMatch(sorted, aId, bId)
      return m ? fromMatch(`x${i}`, m, label) : node(`x${i}`, aId, bId, label)
    })
    extras.push({ id: 'cross', label: 'Incrocio', matches: crossNodes })
  }

  return {
    format: 6,
    fullRanking,
    rounds: [],
    groups: [a.rounds, b.rounds],
    extras,
  }
}

// 8 giocatori: quarti → semi → finale (+ finalina 3°/4°, + consolazione se fullRanking).
function build8(
  sorted: TournamentMatch[], fullRanking: boolean,
  fromMatch: MkFromMatch, node: MkNode,
): BracketView {
  // Quarti (fino a 4, padding vuoto).
  const qf = detectQuarters(sorted)
  const extras: BracketRound[] = []

  const semiNodes: BracketNode[] = [node('s0'), node('s1')]
  let finalNode: BracketNode = node('f', undefined, undefined, 'Finale')
  let qfOrdered = qf

  if (qf.length === 4) {
    const qfIds = new Set(qf.map(m => m.id))
    const qfWinners = qf.map(m => m.winner_id)
    const qfLosers = qf.map(m => loserId(m))
    const winSet = new Set(qfWinners)
    const semis = greedyMatching(sorted, { pool: winSet, exclude: qfIds, limit: 2 })

    semis.forEach((m, i) => { semiNodes[i] = fromMatch(`s${i}`, m) })

    // Riordina i quarti perché le coppie feeder siano adiacenti (connettori corretti):
    // i 2 quarti i cui vincitori giocano la semi 0 vanno per primi.
    if (semis.length === 2) {
      const semiOf = (winnerId: number) =>
        semis.findIndex(s => s.player1_id === winnerId || s.player2_id === winnerId)
      qfOrdered = [...qf].sort((a, b) => semiOf(a.winner_id) - semiOf(b.winner_id))
    }

    if (semis.length === 2) {
      const sw = semis.map(m => m.winner_id)
      const sl = semis.map(m => loserId(m))
      const semiIds = new Set(semis.map(m => m.id))
      const rest = sorted.filter(m => !qfIds.has(m.id) && !semiIds.has(m.id))
      const finalM = findMatch(rest, sw[0]!, sw[1]!)
      finalNode = finalM ? fromMatch('f', finalM, 'Finale') : node('f', sw[0], sw[1], 'Finale')

      if (fullRanking) {
        const thirdM = findMatch(rest, sl[0]!, sl[1]!)
        extras.push({
          id: 'third',
          label: 'Finalina 3°/4°',
          matches: [thirdM ? fromMatch('t', thirdM, '3°/4°') : node('t', sl[0], sl[1], '3°/4°')],
        })
      }
      // OFF: nessuna finalina (perdenti semi pari 3°, no card extra).
    }

    // Consolazione 5°-8° (solo fullRanking): bracket a 4 tra i perdenti dei quarti.
    if (fullRanking) {
      const loserSet = new Set(qfLosers)
      const consMatches = sorted.filter(m =>
        loserSet.has(m.player1_id) && loserSet.has(m.player2_id))
      const consSemis = greedyMatching(consMatches, { limit: 2 })
      const consSemiNodes: BracketNode[] = [
        consSemis[0] ? fromMatch('cs0', consSemis[0]) : node('cs0'),
        consSemis[1] ? fromMatch('cs1', consSemis[1]) : node('cs1'),
      ]
      extras.push({ id: 'cons-semi', label: 'Consolazione', matches: consSemiNodes })
      if (consSemis.length === 2) {
        const cw = consSemis.map(m => m.winner_id)
        const cl = consSemis.map(m => loserId(m))
        const consIds = new Set(consSemis.map(m => m.id))
        const consRest = consMatches.filter(m => !consIds.has(m.id))
        const cFinal = findMatch(consRest, cw[0]!, cw[1]!)
        const cThird = findMatch(consRest, cl[0]!, cl[1]!)
        extras.push({
          id: 'cons-final',
          label: '5°/6° — 7°/8°',
          matches: [
            cFinal ? fromMatch('cf', cFinal, '5°/6°') : node('cf', cw[0], cw[1], '5°/6°'),
            cThird ? fromMatch('ct', cThird, '7°/8°') : node('ct', cl[0], cl[1], '7°/8°'),
          ],
        })
      }
    }
  }

  const qfNodes: BracketNode[] = []
  for (let i = 0; i < 4; i++) {
    const m = qfOrdered[i]
    qfNodes.push(m ? fromMatch(`q${i}`, m) : node(`q${i}`))
  }

  const rounds: BracketRound[] = [
    { id: 'r1', label: 'Quarti', matches: qfNodes },
    { id: 'r2', label: 'Semifinali', matches: semiNodes },
    { id: 'r3', label: 'Finale', matches: [finalNode] },
  ]

  return { format: 8, fullRanking, rounds, extras }
}
