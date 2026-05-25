import { storeToRefs } from 'pinia'

// Helper per pagine /clans/[id]/*: espone clan corrente + ruolo dell'utente.
export function useActiveClan() {
  const route = useRoute()
  const user = useSupabaseUser()
  const store = useClanStore()
  const { activeClan, activeMembers } = storeToRefs(store)

  const clanId = computed(() => {
    const raw = route.params.id
    return raw ? Number(raw) : null
  })

  const isOwner = computed(() =>
    !!user.value && !!activeClan.value && activeClan.value.owner_id === user.value.id,
  )

  const isMember = computed(() =>
    !!user.value && activeMembers.value.some(m => m.user_id === user.value!.id),
  )

  async function refresh() {
    if (clanId.value) await store.loadActiveClan(clanId.value)
  }

  return { clanId, clan: activeClan, members: activeMembers, isOwner, isMember, refresh }
}
