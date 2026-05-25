import { defineStore } from 'pinia'
import type { Player } from '~~/shared/types/domain'

// Store giocatori + standings + trofei CR (cache lato client).
export const usePlayerStore = defineStore('player', () => {
  const allPlayers = ref<Player[]>([])
  const standingsMap = ref<Record<number, number>>({})  // player_id → points
  const trophiesMap = ref<Record<number, number>>({})   // player_id → CR trophies

  const loaded = ref(false)

  async function loadAll() {
    const api = useApi()
    const [players, standings] = await Promise.all([
      api.getPlayers(),
      api.getStandings().catch(() => []),
    ])
    allPlayers.value = players
    standingsMap.value = {}
    standings.forEach((s) => { standingsMap.value[s.player_id] = s.points })

    // Trofei CR best-effort, parallel
    const results = await Promise.allSettled(
      players.map(p => api.getPlayerProfile(p.cr_tag)),
    )
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        trophiesMap.value[players[i]!.id] = r.value.trophies ?? 0
      }
    })

    loaded.value = true
  }

  function reset() {
    allPlayers.value = []
    standingsMap.value = {}
    trophiesMap.value = {}
    loaded.value = false
  }

  return { allPlayers, standingsMap, trophiesMap, loaded, loadAll, reset }
})
