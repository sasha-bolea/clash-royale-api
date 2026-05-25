import { defineStore } from 'pinia'
import type { Tournament, TournamentMatch, PodiumEntry } from '~~/shared/types/domain'

// Store torneo del clan corrente. Reset su cambio clan o nuovo torneo.
export const useTournamentStore = defineStore('tournament', () => {
  const clanId = ref<number | null>(null)
  const activeTournament = ref<Tournament | null>(null)
  const tournamentMatches = ref<TournamentMatch[]>([])
  const knownBattleIds = ref<Set<string>>(new Set())
  const selectedPlayerIds = ref<Set<number>>(new Set())
  const completedPositions = ref<PodiumEntry[] | null>(null)

  function reset() {
    clanId.value = null
    activeTournament.value = null
    tournamentMatches.value = []
    knownBattleIds.value = new Set()
    selectedPlayerIds.value = new Set()
    completedPositions.value = null
  }

  return {
    clanId,
    activeTournament,
    tournamentMatches,
    knownBattleIds,
    selectedPlayerIds,
    completedPositions,
    reset,
  }
})
