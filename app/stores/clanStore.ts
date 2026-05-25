import { defineStore } from 'pinia'
import type { Clan, ClanMember } from '~~/shared/types/domain'

// Store clan: lista clan dell'utente + clan attivo (su pagine /clans/[id]/*)
export const useClanStore = defineStore('clan', () => {
  const myClans = ref<Clan[]>([])
  const myClansLoaded = ref(false)
  const activeClan = ref<Clan | null>(null)
  const activeMembers = ref<ClanMember[]>([])

  async function loadMyClans(force = false) {
    if (myClansLoaded.value && !force) return
    const api = useApi()
    myClans.value = await api.getMyClans()
    myClansLoaded.value = true
  }

  async function loadActiveClan(clanId: number) {
    const api = useApi()
    const [clan, members] = await Promise.all([
      api.getClan(clanId),
      api.getClanMembers(clanId),
    ])
    activeClan.value = clan
    activeMembers.value = members
  }

  function clearActive() {
    activeClan.value = null
    activeMembers.value = []
  }

  function reset() {
    myClans.value = []
    myClansLoaded.value = false
    clearActive()
  }

  return {
    myClans, myClansLoaded, activeClan, activeMembers,
    loadMyClans, loadActiveClan, clearActive, reset,
  }
})
