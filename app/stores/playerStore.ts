import { defineStore } from 'pinia'
import type { Player } from '~~/shared/types/domain'

// Store giocatori scoped al clan corrente. Reset su cambio clan.
export const usePlayerStore = defineStore('player', () => {
  const clanId = ref<number | null>(null)
  const allPlayers = ref<Player[]>([])
  const standingsMap = ref<Record<number, number>>({})
  const trophiesMap = ref<Record<number, number>>({})
  const loaded = ref(false)

  async function loadAll(forClanId: number, force = false) {
    if (loaded.value && clanId.value === forClanId && !force) return
    const api = useApi()
    clanId.value = forClanId
    const [players, standings] = await Promise.all([
      api.getPlayers(forClanId),
      api.getStandings(forClanId).catch(() => []),
    ])
    allPlayers.value = players
    standingsMap.value = {}
    standings.forEach((s) => { standingsMap.value[s.player_id] = s.wins })
    loaded.value = true

    // Trofei CR caricati in background, non blocca UI.
    players.forEach((p) => {
      api.getPlayerProfile(p.cr_tag)
        .then((profile) => { trophiesMap.value[p.id] = profile.trophies ?? 0 })
        .catch(() => {})
    })
  }

  function reset() {
    clanId.value = null
    allPlayers.value = []
    standingsMap.value = {}
    trophiesMap.value = {}
    loaded.value = false
  }

  return { clanId, allPlayers, standingsMap, trophiesMap, loaded, loadAll, reset }
})
