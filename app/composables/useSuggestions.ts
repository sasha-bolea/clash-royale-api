import type {
  Player,
  TournamentMatch,
  BracketFormat,
  BracketView,
  BracketNode,
} from '~~/shared/types/domain'
import { sortByPlayed, greedyMatching, detectTriangles } from '~/composables/useBracket'

// Un accoppiamento consigliato per il primo round del bracket.
// group (solo format 6) indica a quale girone appartiene la coppia.
export interface SuggestedPair {
  a: number
  b: number
  group?: 0 | 1
}

// Mescola un array (Fisher-Yates) restituendo una nuova copia.
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

// Accoppia casualmente gli id a due a due (l'eventuale dispari resta fuori).
function randomPairs(ids: number[]): SuggestedPair[] {
  const s = shuffle(ids)
  const out: SuggestedPair[] = []
  for (let i = 0; i + 1 < s.length; i += 2) out.push({ a: s[i]!, b: s[i + 1]! })
  return out
}

// Ri-accoppia un pool di giocatori preservando le coppie esistenti ancora valide
// (entrambi i giocatori non "rubati" da una partita reale). Solo i giocatori
// rimasti scoperti vengono accoppiati di nuovo casualmente. Così l'arrivo di una
// partita reale aggiorna il consiglio senza rimescolare le coppie ancora buone.
function repair(
  poolIds: number[],
  committed: Set<number>,
  existing: SuggestedPair[],
  group?: 0 | 1,
): SuggestedPair[] {
  const uncommitted = poolIds.filter(id => !committed.has(id))
  const uncSet = new Set(uncommitted)
  const kept = existing.filter(p =>
    p.group === group && uncSet.has(p.a) && uncSet.has(p.b))
  const usedInKept = new Set(kept.flatMap(p => [p.a, p.b]))
  const leftover = uncommitted.filter(id => !usedInKept.has(id))
  const fresh = randomPairs(leftover).map(p => ({ ...p, group }))
  return [...kept, ...fresh]
}

// Calcola gli accoppiamenti consigliati per il primo round, dato lo stato attuale
// delle partite reali. Le coppie già "fissate" da partite reali non vengono
// suggerite; i giocatori restanti riempiono gli slot vuoti del primo round.
// - 4: tutte le semifinali (2 coppie)
// - 8: tutti i quarti (4 coppie)
// - 3: la prima partita (1 coppia)
// - 6: la prima partita di ciascun girone (1 coppia per girone)
// - 2: nessun suggerimento (i 2 finalisti sono già noti)
export function computeSuggestions(
  matches: TournamentMatch[],
  participants: Player[],
  format: BracketFormat,
  existing: SuggestedPair[],
): SuggestedPair[] {
  const sorted = sortByPlayed(matches)
  const ids = participants.map(p => p.id)

  switch (format) {
    case 2:
      return []

    case 3: {
      // La prima partita è la più vecchia in assoluto: se già giocata, niente consiglio.
      const m1 = sorted[0]
      if (m1) return []
      return repair(ids, new Set(), existing).slice(0, 1)
    }

    case 4: {
      const semis = greedyMatching(sorted, { limit: 2 })
      const committed = new Set(semis.flatMap(m => [m.player1_id, m.player2_id]))
      return repair(ids, committed, existing)
    }

    case 8: {
      const qf = greedyMatching(sorted, { limit: 4 })
      const committed = new Set(qf.flatMap(m => [m.player1_id, m.player2_id]))
      return repair(ids, committed, existing)
    }

    case 6: {
      // Gironi reali appena i triangoli sono formati, altrimenti split provvisorio
      // (coerente con build6): il consiglio si riassesta quando i gironi emergono.
      const tris = detectTriangles(sorted, ids)
      const [gA, gB] = tris ?? [ids.slice(0, 3), ids.slice(3, 6)]
      const out: SuggestedPair[] = []
      ;([gA, gB] as number[][]).forEach((g, gi) => {
        const setG = new Set(g)
        const first = sorted.find(m => setG.has(m.player1_id) && setG.has(m.player2_id))
        if (first) return // prima partita del girone già giocata
        out.push(...repair(g, new Set(), existing, gi as 0 | 1).slice(0, 1))
      })
      return out
    }
  }
}

// True se entrambi gli slot del nodo sono vuoti (nessuna partita reale).
function isEmpty(node: BracketNode): boolean {
  return node.slotA.playerId == null && node.slotB.playerId == null
}

// Riempie un nodo vuoto con una coppia consigliata, marcandolo come tale.
function fill(node: BracketNode, pair: SuggestedPair, byId: Record<number, Player>): void {
  node.slotA = { playerId: pair.a, username: byId[pair.a]?.username }
  node.slotB = { playerId: pair.b, username: byId[pair.b]?.username }
  node.suggested = true
}

// Sovrappone le coppie consigliate ai soli nodi vuoti del primo round della view
// già costruita. Non tocca le partite reali né i round successivi (nessuna
// propagazione): sicuro per ogni formato. Muta i nodi (creati ex-novo a ogni build).
export function applySuggestions(
  view: BracketView,
  pairs: SuggestedPair[],
  participants: Player[],
): void {
  if (!pairs.length) return
  const byId: Record<number, Player> = {}
  participants.forEach(p => { byId[p.id] = p })

  if (view.format === 6 && view.groups && view.groupIds) {
    // Prima partita di ciascun girone (catena scaletta → primo round = matches[0]).
    ;[0, 1].forEach((gi) => {
      const node = view.groups![gi]?.[0]?.matches?.[0]
      if (!node || !isEmpty(node)) return
      const pair = pairs.find(p => p.group === gi)
      if (pair) fill(node, pair, byId)
    })
    return
  }

  // 3/4/8: il primo round è rounds[0]; riempi i nodi vuoti con le coppie disponibili.
  const firstRound = view.rounds[0]
  if (!firstRound) return
  const queue = [...pairs]
  firstRound.matches.forEach((node) => {
    if (!isEmpty(node)) return
    const pair = queue.shift()
    if (pair) fill(node, pair, byId)
  })
}
