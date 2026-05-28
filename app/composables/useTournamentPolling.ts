import { storeToRefs } from 'pinia'
import type { Player } from '~~/shared/types/domain'

const POLL_INTERVAL = 30_000 // 30s
const POINTS_BY_PLACE: Record<number, number> = { 1: 3, 2: 2, 3: 1, 4: 0 }

// Polling battlelog + timer + check completamento bracket.
// Tornei senza partite da >2h vengono chiusi dal cron server-side (vedi docs/schema.sql).
// Richiede clanId (per addPoints alla classifica del clan).
export function useTournamentPolling(clanId: number) {
  const api = useApi()
  const bracket = useBracket()
  const store = useTournamentStore()
  const { activeTournament, tournamentMatches, knownBattleIds } = storeToRefs(store)
  const playerStore = usePlayerStore()

  const timerLabel = ref('0:00')

  let pollingTimer: ReturnType<typeof setInterval> | null = null
  let timerInterval: ReturnType<typeof setInterval> | null = null

  function startPolling() {
    poll()
    pollingTimer = setInterval(poll, POLL_INTERVAL)
    startTimer()
  }

  function stopPolling() {
    if (pollingTimer) clearInterval(pollingTimer)
    if (timerInterval) clearInterval(timerInterval)
    pollingTimer = null
    timerInterval = null
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval)
    if (!activeTournament.value) return
    const startedAt = new Date(activeTournament.value.started_at)
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
      const m = Math.floor(elapsed / 60)
      const s = elapsed % 60
      timerLabel.value = `${m}:${String(s).padStart(2, '0')}`
    }
    tick()
    timerInterval = setInterval(tick, 1000)
  }

  async function poll() {
    const t = activeTournament.value
    if (!t || !t.tournament_players) return

    const participants: Player[] = t.tournament_players.map(tp => tp.players)
    const tagMap: Record<string, Player> = {}
    participants.forEach((p) => {
      tagMap[p.cr_tag.replace('#', '').toUpperCase()] = p
    })

    let newBattlesFound = false

    for (const player of participants) {
      try {
        const battles = await api.getBattlelog(player.cr_tag)
        for (const battle of battles) {
          if (!bracket.isBattleValid(battle, t, tagMap)) continue

          const teamTags = battle.team.map(p => p.tag)
          const oppTags = battle.opponent.map(p => p.tag)
          const crId = bracket.makeBattleId(battle.battleTime, teamTags, oppTags)
          if (knownBattleIds.value.has(crId)) continue

          const p1tag = teamTags[0]!.replace('#', '').toUpperCase()
          const p2tag = oppTags[0]!.replace('#', '').toUpperCase()
          const p1 = tagMap[p1tag]
          const p2 = tagMap[p2tag]
          if (!p1 || !p2) continue

          const crownsP1 = battle.team[0]!.crowns ?? 0
          const crownsP2 = battle.opponent[0]!.crowns ?? 0
          const winnerId = crownsP1 >= crownsP2 ? p1.id : p2.id

          const saved = await api.saveTournamentMatch({
            tournament_id: t.id,
            player1_id: p1.id,
            player2_id: p2.id,
            winner_id: winnerId,
            crowns_p1: crownsP1,
            crowns_p2: crownsP2,
            played_at: bracket.parseCRDate(battle.battleTime).toISOString(),
            cr_battle_id: crId,
            match_type: t.match_type,
          })
          if (saved) {
            knownBattleIds.value.add(crId)
            newBattlesFound = true
          }
        }
      } catch (err: any) {
        console.warn(`Poll fallito per ${player.username}:`, err?.message ?? err)
      }
    }

    if (newBattlesFound) {
      tournamentMatches.value = await api.getTournamentMatches(t.id)
      await checkCompletion()
    }
  }

  async function checkCompletion() {
    const t = activeTournament.value
    if (!t || !t.tournament_players) return

    const n = t.tournament_players.length
    const needed = n === 4 ? 4 : 3
    if (tournamentMatches.value.length < needed) return

    const allPlayers = t.tournament_players.map(tp => tp.players)
    const result = n === 4
      ? bracket.analyzeBracket4(tournamentMatches.value, allPlayers)
      : bracket.analyzeBracket3(tournamentMatches.value, allPlayers)
    if (!result) return

    stopPolling()
    await api.updateTournamentStatus(t.id, 'finished')

    const pointsEntries = result.positions.map((pos, i) => ({
      player_id: pos.player_id,
      points: POINTS_BY_PLACE[i + 1] ?? 0,
    }))
    await api.addPoints(clanId, pointsEntries)

    pointsEntries.forEach(({ player_id, points }) => {
      const current = playerStore.standingsMap[player_id] ?? 0
      playerStore.standingsMap[player_id] = current + points
    })

    store.completedPositions = result.positions
    activeTournament.value = { ...t, status: 'finished' }
  }

  return {
    timerLabel,
    startPolling,
    stopPolling,
    POINTS_BY_PLACE,
  }
}
