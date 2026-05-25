import { defineStore } from 'pinia'
import type { Tournament, TournamentMatch, PodiumEntry } from '~~/shared/types/domain'

// Store torneo attivo + partite rilevate + selezione giocatori.
export const useTournamentStore = defineStore('tournament', () => {
  const activeTournament = ref<Tournament | null>(null)
  const tournamentMatches = ref<TournamentMatch[]>([])
  const knownBattleIds = ref<Set<string>>(new Set())
  const selectedPlayerIds = ref<Set<number>>(new Set())
  const completedPositions = ref<PodiumEntry[] | null>(null)

  function reset() {
    activeTournament.value = null
    tournamentMatches.value = []
    knownBattleIds.value = new Set()
    selectedPlayerIds.value = new Set()
    completedPositions.value = null
  }

  return {
    activeTournament,
    tournamentMatches,
    knownBattleIds,
    selectedPlayerIds,
    completedPositions,
    reset,
  }
})
