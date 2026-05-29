import { storeToRefs } from 'pinia'
import type { Player, BracketResult } from '~~/shared/types/domain'

const POLL_INTERVAL = 30_000 // 30s

// Polling battlelog + timer + check completamento bracket.
// Punti = partite vinte: ogni match vinto assegna +1 alla classifica del clan.
// Tornei senza partite da >2h vengono chiusi dal cron server-side (vedi docs/schema.sql).
// Richiede clanId (per assegnare le vittorie alla classifica del clan).
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
            // 1 vittoria = +1 partita vinta in classifica
            await api.addWins(clanId, [{ player_id: winnerId, wins: 1 }])
            playerStore.standingsMap[winnerId] = (playerStore.standingsMap[winnerId] ?? 0) + 1
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
    const fr = t.full_ranking
    const matches = tournamentMatches.value
    const allPlayers = t.tournament_players.map(tp => tp.players)

    // Conteggio partite atteso + analyzer per dimensione torneo.
    let needed: number
    let result: BracketResult | null
    switch (n) {
      case 2: needed = 1; break
      case 3: needed = 3; break
      case 4: needed = fr ? 4 : 3; break
      case 6: needed = 6 + (fr ? 3 : 1); break
      case 8: needed = fr ? 12 : 7; break
      default: return
    }
    if (matches.length < needed) return

    switch (n) {
      case 2: result = bracket.analyzeBracket2(matches, allPlayers); break
      case 3: result = bracket.analyzeBracket3(matches, allPlayers); break
      case 4: result = bracket.analyzeBracket4(matches, allPlayers, fr); break
      case 6: result = bracket.analyzeBracket6(matches, allPlayers, fr); break
      case 8: result = bracket.analyzeBracket8(matches, allPlayers, fr); break
      default: return
    }
    if (!result) return

    // Le vittorie sono già state assegnate per-match in poll().
    stopPolling()
    await api.updateTournamentStatus(t.id, 'finished')
    store.completedPositions = result.positions
    activeTournament.value = { ...t, status: 'finished' }
  }

  return {
    timerLabel,
    startPolling,
    stopPolling,
  }
}
