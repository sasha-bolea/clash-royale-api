import { defineStore } from 'pinia'
import type { Clan } from '~~/shared/types/domain'

// Store clan attivo (settato dal middleware clan-access).
// Lista clan dell'utente vive in localStorage via useBrowserSession.
export const useClanStore = defineStore('clan', () => {
  const activeClan = ref<Clan | null>(null)

  function clearActive() {
    activeClan.value = null
  }

  function reset() {
    clearActive()
  }

  return { activeClan, clearActive, reset }
})
