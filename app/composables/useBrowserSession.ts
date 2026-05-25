// Gestione lista clan salvati nel browser (localStorage).
// Nessuna identità utente — solo lista accessi per UX dashboard.

export interface SavedClan {
  clan_id: number
  code: string
  name: string
  joined_at: string
}

const STORAGE_KEY = 'royal-arena:saved-clans'

function load(): SavedClan[] {
  if (import.meta.server) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.saved_clans) ? parsed.saved_clans : []
  } catch {
    return []
  }
}

function persist(list: SavedClan[]) {
  if (import.meta.server) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ saved_clans: list }))
  } catch {
    // quota piena o storage disabilitato — best effort
  }
}

export function useBrowserSession() {
  const savedClans = useState<SavedClan[]>('saved-clans', () => load())

  function addClan(c: SavedClan) {
    const existing = savedClans.value.find(s => s.clan_id === c.clan_id)
    if (existing) {
      // Aggiorna code/name se cambiati
      existing.code = c.code
      existing.name = c.name
    } else {
      savedClans.value = [c, ...savedClans.value]
    }
    persist(savedClans.value)
  }

  function removeClan(clanId: number) {
    savedClans.value = savedClans.value.filter(s => s.clan_id !== clanId)
    persist(savedClans.value)
  }

  function hasClan(clanId: number): boolean {
    return savedClans.value.some(s => s.clan_id === clanId)
  }

  // Aggiorna code per un clan salvato (post regen)
  function updateCode(clanId: number, newCode: string) {
    const found = savedClans.value.find(s => s.clan_id === clanId)
    if (found) {
      found.code = newCode
      persist(savedClans.value)
    }
  }

  return { savedClans, addClan, removeClan, hasClan, updateCode }
}
