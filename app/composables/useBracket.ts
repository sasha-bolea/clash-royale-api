import type {
  Player,
  Tournament,
  TournamentMatch,
  BracketResult,
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

  return {
    parseCRDate,
    makeBattleId,
    isBattleValid,
    analyzeBracket3,
    analyzeBracket4,
  }
}
