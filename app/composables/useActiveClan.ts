import { storeToRefs } from 'pinia'

// Espone clan attivo (settato dal middleware clan-access). Modello flat: no isOwner.
export function useActiveClan() {
  const route = useRoute()
  const store = useClanStore()
  const { activeClan } = storeToRefs(store)

  const code = computed(() => (route.params.code as string | undefined) ?? null)
  const clanId = computed(() => activeClan.value?.id ?? null)

  return { code, clanId, clan: activeClan }
}
