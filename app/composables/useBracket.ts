import type {
  Player,
  Tournament,
  TournamentMatch,
  BracketResult,
  PodiumEntry,
  CRBattle,
} from '~~/shared/types/domain'

// Logica pura bracket + battle validation + parsing date CR.
// Estratta da js/home.js (analyzeBracket3/4, isBattleValid, parseCRDate, makeBattleId).
export function useBracket() {
  // Formato CR: "20241215T143022.000Z" → Date
  function parseCRDate(battleTime: string): Date {
    const m = battleTime.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
    if (!m) return new Date(battleTime)
    return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z`)
  }

  // ID deterministico per una partita CR (basato su tag e battleTime).
  function makeBattleId(battleTime: string, teamTags: string[], opponentTags: string[]): string {
    const allTags = [...teamTags, ...opponentTags]
      .map(t => t.replace('#', ''))
      .sort()
    return `${battleTime}_${allTags.join('_')}`
  }

  // True se la partita appartiene al torneo (post started_at, tra partecipanti).
  function isBattleValid(
    battle: CRBattle,
    tournament: Tournament,
    participantTagMap: Record<string, Player>,
  ): boolean {
    const battleDate = parseCRDate(battle.battleTime)
    const cutoff = new Date(new Date(tournament.started_at).getTime() - 2 * 60_000)
    if (battleDate < cutoff) return false

    const allTags = [
      ...battle.team.map(p => p.tag.replace('#', '').toUpperCase()),
      ...battle.opponent.map(p => p.tag.replace('#', '').toUpperCase()),
    ]
    return allTags.every(tag => participantTagMap[tag])
  }

  const loserId = (m: TournamentMatch): number =>
    m.player1_id === m.winner_id ? m.player2_id : m.player1_id

  // Trova la partita tra due specifici giocatori (in qualunque ordine).
  const findMatch = (matches: TournamentMatch[], aId: number, bId: number) =>
    matches.find(m =>
      (m.player1_id === aId && m.player2_id === bId)
      || (m.player1_id === bId && m.player2_id === aId),
    )

  const sortByPlayed = (matches: TournamentMatch[]) =>
    [...matches].sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())

  // Bracket 4 giocatori: 2 semifinali + finale + 3/4 posto.
  function analyzeBracket4(
    matches: TournamentMatch[],
    allPlayers: Player[],
  ): BracketResult | null {
    const sorted = [...matches].sort(
      (a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime(),
    )
    if (sorted.length < 4) return null

    const semi1 = sorted[0]!
    const semi1Ids = new Set([semi1.player1_id, semi1.player2_id])
    const semi2 = sorted.find(m =>
      m.id !== semi1.id
      && !semi1Ids.has(m.player1_id)
      && !semi1Ids.has(m.player2_id),
    )
    if (!semi2) return null

    const s1Winner = semi1.winner_id
    const s1Loser = loserId(semi1)
    const s2Winner = semi2.winner_id
    const s2Loser = loserId(semi2)

    const remaining = sorted.filter(m => m.id !== semi1.id && m.id !== semi2.id)

    const finalMatch = remaining.find(m => {
      const ids = new Set([m.player1_id, m.player2_id])
      return ids.has(s1Winner) && ids.has(s2Winner)
    })
    const thirdMatch = remaining.find(m => {
      const ids = new Set([m.player1_id, m.player2_id])
      return ids.has(s1Loser) && ids.has(s2Loser)
    })
    if (!finalMatch || !thirdMatch) return null

    const byId: Record<number, Player> = {}
    allPlayers.forEach(p => { byId[p.id] = p })

    return {
      positions: [
        { player_id: finalMatch.winner_id, username: byId[finalMatch.winner_id]?.username },
        { player_id: loserId(finalMatch), username: byId[loserId(finalMatch)]?.username },
        { player_id: thirdMatch.winner_id, username: byId[thirdMatch.winner_id]?.username },
        { player_id: loserId(thirdMatch), username: byId[loserId(thirdMatch)]?.username },
      ],
    }
  }

  // Bracket 3 giocatori (scaletta): P1 → perdente vs C → vincitori finale.
  function analyzeBracket3(
    matches: TournamentMatch[],
    allPlayers: Player[],
  ): BracketResult | null {
    const sorted = [...matches].sort(
      (a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime(),
    )
    if (sorted.length < 3) return null

    const p1 = sorted[0]!
    const p1Loser = loserId(p1)

    const p2 = sorted.find(m =>
      m.id !== p1.id
      && (m.player1_id === p1Loser || m.player2_id === p1Loser),
    )
    if (!p2) return null
    const p2Loser = loserId(p2)

    const p3 = sorted.find(m => m.id !== p1.id && m.id !== p2.id)
    if (!p3) return null
    const p3Winner = p3.winner_id
    const p3Loser = loserId(p3)

    const byId: Record<number, Player> = {}
    allPlayers.forEach(p => { byId[p.id] = p })

    return {
      positions: [
        { player_id: p3Winner, username: byId[p3Winner]?.username },
        { player_id: p3Loser, username: byId[p3Loser]?.username },
        { player_id: p2Loser, username: byId[p2Loser]?.username },
      ],
    }
  }

  // Bracket 2 giocatori: 1 partita secca.
  function analyzeBracket2(
    matches: TournamentMatch[],
    allPlayers: Player[],
  ): BracketResult | null {
    if (matches.length < 1) return null
    const m = sortByPlayed(matches)[0]!
    const byId: Record<number, Player> = {}
    allPlayers.forEach(p => { byId[p.id] = p })
    const entry = (id: number, place: number): PodiumEntry =>
      ({ player_id: id, username: byId[id]?.username, place })
    return { positions: [entry(m.winner_id, 1), entry(loserId(m), 2)] }
  }

  // Bracket 6: 2 gironi da 3 (rilevati come triangoli disgiunti) + incrocio.
  // fullRanking OFF: solo 1°A vs 1°B (2°/3° a pari merito). ON: anche 2vs2 e 3vs3.
  function analyzeBracket6(
    matches: TournamentMatch[],
    allPlayers: Player[],
    fullRanking: boolean,
  ): BracketResult | null {
    const sorted = sortByPlayed(matches)
    const ids = allPlayers.map(p => p.id)

    // Adiacenza tra giocatori che si sono affrontati.
    const adj: Record<number, Set<number>> = {}
    ids.forEach(id => { adj[id] = new Set() })
    sorted.forEach((m) => {
      adj[m.player1_id]?.add(m.player2_id)
      adj[m.player2_id]?.add(m.player1_id)
    })
    const isTriangle = (x: number, y: number, z: number) =>
      adj[x]!.has(y) && adj[y]!.has(z) && adj[x]!.has(z)

    // Trova 2 triangoli disgiunti che coprono tutti e 6 i giocatori = i gironi.
    let gA: number[] | null = null
    let gB: number[] | null = null
    for (let i = 0; i < ids.length && !gA; i++) {
      for (let j = i + 1; j < ids.length && !gA; j++) {
        for (let k = j + 1; k < ids.length && !gA; k++) {
          const t1 = [ids[i]!, ids[j]!, ids[k]!]
          if (!isTriangle(t1[0]!, t1[1]!, t1[2]!)) continue
          const rest = ids.filter(id => !t1.includes(id))
          if (rest.length === 3 && isTriangle(rest[0]!, rest[1]!, rest[2]!)) {
            gA = t1
            gB = rest
          }
        }
      }
    }
    if (!gA || !gB) return null

    const byId: Record<number, Player> = {}
    allPlayers.forEach(p => { byId[p.id] = p })
    const entry = (id: number, place: number): PodiumEntry =>
      ({ player_id: id, username: byId[id]?.username, place })

    // Classifica interna di ogni girone via scaletta a 3.
    const setA = new Set(gA)
    const setB = new Set(gB)
    const matchesA = sorted.filter(m => setA.has(m.player1_id) && setA.has(m.player2_id))
    const matchesB = sorted.filter(m => setB.has(m.player1_id) && setB.has(m.player2_id))
    const rankA = analyzeBracket3(matchesA, gA.map(id => byId[id]!))
    const rankB = analyzeBracket3(matchesB, gB.map(id => byId[id]!))
    if (!rankA || !rankB) return null
    const a = rankA.positions.map(p => p.player_id)
    const b = rankB.positions.map(p => p.player_id)

    // Incrocio tra primi di ogni girone.
    const cross1 = findMatch(sorted, a[0]!, b[0]!)
    if (!cross1) return null

    if (!fullRanking) {
      return {
        positions: [
          entry(cross1.winner_id, 1), entry(loserId(cross1), 2),
          entry(a[1]!, 3), entry(b[1]!, 3),
          entry(a[2]!, 5), entry(b[2]!, 5),
        ],
      }
    }

    const cross2 = findMatch(sorted, a[1]!, b[1]!)
    const cross3 = findMatch(sorted, a[2]!, b[2]!)
    if (!cross2 || !cross3) return null
    return {
      positions: [
        entry(cross1.winner_id, 1), entry(loserId(cross1), 2),
        entry(cross2.winner_id, 3), entry(loserId(cross2), 4),
        entry(cross3.winner_id, 5), entry(loserId(cross3), 6),
      ],
    }
  }

  // Bracket 8: eliminazione diretta (quarti→semi→finale+3°/4°).
  // fullRanking OFF: perdenti quarti a pari merito 5°. ON: bracket consolazione 5°-8°.
  function analyzeBracket8(
    matches: TournamentMatch[],
    allPlayers: Player[],
    fullRanking: boolean,
  ): BracketResult | null {
    const sorted = sortByPlayed(matches)
    const byId: Record<number, Player> = {}
    allPlayers.forEach(p => { byId[p.id] = p })
    const entry = (id: number, place: number): PodiumEntry =>
      ({ player_id: id, username: byId[id]?.username, place })

    // Quarti: prime 4 partite che accoppiano tutti gli 8 (matching perfetto).
    const used = new Set<number>()
    const qf: TournamentMatch[] = []
    for (const m of sorted) {
      if (used.has(m.player1_id) || used.has(m.player2_id)) continue
      qf.push(m)
      used.add(m.player1_id)
      used.add(m.player2_id)
      if (qf.length === 4) break
    }
    if (qf.length < 4) return null
    const qfIds = new Set(qf.map(m => m.id))
    const qfWinners = qf.map(m => m.winner_id)
    const qfLosers = qf.map(m => loserId(m))
    const winSet = new Set(qfWinners)

    // Semifinali: matching tra i 4 vincitori dei quarti.
    const usedS = new Set<number>()
    const semis: TournamentMatch[] = []
    for (const m of sorted) {
      if (qfIds.has(m.id)) continue
      if (!winSet.has(m.player1_id) || !winSet.has(m.player2_id)) continue
      if (usedS.has(m.player1_id) || usedS.has(m.player2_id)) continue
      semis.push(m)
      usedS.add(m.player1_id)
      usedS.add(m.player2_id)
      if (semis.length === 2) break
    }
    if (semis.length < 2) return null
    const semiWinners = semis.map(m => m.winner_id)
    const semiLosers = semis.map(m => loserId(m))

    const finalM = findMatch(sorted, semiWinners[0]!, semiWinners[1]!)
    const thirdM = findMatch(sorted, semiLosers[0]!, semiLosers[1]!)
    if (!finalM || !thirdM) return null

    const top: PodiumEntry[] = [
      entry(finalM.winner_id, 1), entry(loserId(finalM), 2),
      entry(thirdM.winner_id, 3), entry(loserId(thirdM), 4),
    ]

    if (!fullRanking) {
      return { positions: [...top, ...qfLosers.map(id => entry(id, 5))] }
    }

    // Consolazione: bracket a 4 tra i perdenti dei quarti → posizioni 5°-8°.
    const loserSet = new Set(qfLosers)
    const consMatches = sorted.filter(m =>
      loserSet.has(m.player1_id) && loserSet.has(m.player2_id))
    const cons = analyzeBracket4(consMatches, qfLosers.map(id => byId[id]!))
    if (!cons) return null
    const consPos = cons.positions.map((p, i) => entry(p.player_id, 5 + i))
    return { positions: [...top, ...consPos] }
  }

  return {
    parseCRDate,
    makeBattleId,
    isBattleValid,
    analyzeBracket2,
    analyzeBracket3,
    analyzeBracket4,
    analyzeBracket6,
    analyzeBracket8,
  }
}
