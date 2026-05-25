// Named middleware: verifica che l'utente sia membro del clan in route.params.id.
// Usage: definePageMeta({ middleware: ['clan-member'] })
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  if (!user.value) return navigateTo('/login')

  const id = Number(to.params.id)
  if (!id) return navigateTo('/clans')

  const store = useClanStore()
  // Carica clan attivo se non gia' settato per quell'id
  if (!store.activeClan || store.activeClan.id !== id) {
    try {
      await store.loadActiveClan(id)
    } catch {
      return navigateTo('/clans')
    }
  }
  if (!store.activeClan) return navigateTo('/clans')
  if (!store.activeMembers.some(m => m.user_id === user.value!.id)) {
    return navigateTo('/clans')
  }
})
