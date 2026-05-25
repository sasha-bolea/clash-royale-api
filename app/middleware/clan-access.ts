// Named middleware: verifica che route.params.code corrisponda a un clan esistente.
// Auto-aggiunge il clan ai savedClans del browser (entrare = aprire URL).
// Usage: definePageMeta({ middleware: ['clan-access'] })
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return // pagine client-only, skip SSR

  const code = to.params.code as string | undefined
  if (!code) return navigateTo('/')

  const api = useApi()
  const store = useClanStore()
  const session = useBrowserSession()

  // Se cambio clan rispetto a quello attivo, ricarica
  if (!store.activeClan || store.activeClan.code !== code) {
    let clan
    try {
      clan = await api.getClanByCode(code)
    } catch {
      return navigateTo('/')
    }
    if (!clan) return navigateTo('/')
    store.activeClan = clan
  }

  // Aggiungi a savedClans se non presente
  const active = store.activeClan!
  if (!session.hasClan(active.id)) {
    session.addClan({
      clan_id: active.id,
      code: active.code,
      name: active.name,
      joined_at: new Date().toISOString(),
    })
  } else {
    // sync nel caso il code fosse stato rigenerato
    session.updateCode(active.id, active.code)
  }
})
