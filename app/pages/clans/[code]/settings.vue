<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ middleware: ['clan-access'] })

const { clan, clanId } = useActiveClan()
const clanStore = useClanStore()
const session = useBrowserSession()
const api = useApi()
const { showToast, showError } = useToast()

const playerStore = usePlayerStore()
const { allPlayers } = storeToRefs(playerStore)

useHead(() => ({ title: clan.value ? `${clan.value.name} — Impostazioni` : 'Impostazioni' }))

const regenerating = ref(false)
const loadingPlayers = ref(true)

onMounted(async () => {
  if (clanId.value && playerStore.clanId !== clanId.value) {
    playerStore.reset()
  }
  if (clanId.value) {
    try {
      await playerStore.loadAll(clanId.value)
    } catch (err: any) {
      showError(err?.message ?? 'Errore caricamento giocatori')
    }
  }
  loadingPlayers.value = false
})

async function copyCode() {
  if (!clan.value) return
  try {
    await navigator.clipboard.writeText(clan.value.code)
    showToast('Codice copiato')
  } catch {
    showToast('Copia non riuscita')
  }
}

async function regen() {
  if (!clanId.value) return
  if (!confirm('Generare nuovo codice? Il precedente diventa invalido.')) return
  regenerating.value = true
  try {
    const newCode = await api.regenerateCode(clanId.value)
    if (clan.value) {
      const updated = { ...clan.value, code: newCode }
      clanStore.activeClan = updated
      session.updateCode(updated.id, newCode)
    }
    showToast('Nuovo codice generato')
    await navigateTo(`/clans/${newCode}/settings`, { replace: true })
  } catch (err: any) {
    showError(err?.message ?? 'Errore regen')
  } finally {
    regenerating.value = false
  }
}

async function removePlayer(playerId: number) {
  if (!confirm('Rimuovere il giocatore? Se è l\'ultimo, anche il clan viene eliminato.')) return
  try {
    await api.removePlayer(playerId)
    allPlayers.value = allPlayers.value.filter(p => p.id !== playerId)
    if (allPlayers.value.length === 0 && clanId.value) {
      session.removeClan(clanId.value)
      clanStore.reset()
      await navigateTo('/', { replace: true })
    }
  } catch (err: any) {
    showError(err?.message ?? 'Errore rimozione')
  }
}

const showLeave = ref(false)

async function confirmLeave(removePlayerId: number | null) {
  if (!clanId.value) return
  showLeave.value = false
  try {
    if (removePlayerId != null) {
      await api.removePlayer(removePlayerId)
      allPlayers.value = allPlayers.value.filter(p => p.id !== removePlayerId)
    }
    session.removeClan(clanId.value)
    clanStore.reset()
    await navigateTo('/', { replace: true })
  } catch (err: any) {
    showError(err?.message ?? 'Errore uscita')
  }
}
</script>

<template>
  <div class="clan-page">
    <PageHeader title="Impostazioni" :back-to="clan ? `/clans/${clan.code}/torneo` : '/'" />

    <main v-if="clan" class="ra-settings">
      <section class="ra-panel ra-settings__block">
        <p class="ra-label">Clan</p>
        <p class="ra-display ra-display--md">{{ clan.name }}</p>
      </section>

      <section class="ra-panel ra-settings__block">
        <p class="ra-label">Codice di invito</p>
        <div class="ra-settings__code-row">
          <span class="ra-settings__code">{{ clan.code }}</span>
          <button class="ra-btn ra-btn--sm" @click="copyCode">Copia</button>
        </div>
        <button class="ra-btn ra-btn--ghost ra-btn--sm ra-btn--block" :disabled="regenerating" @click="regen">
          {{ regenerating ? '...' : 'Rigenera codice' }}
        </button>
        <p class="ra-settings__help">
          Il codice precedente diventa invalido. Condividi il nuovo con chi vuoi.
        </p>
      </section>

      <section class="ra-panel ra-settings__block">
        <div class="ra-arena__label-row">
          <p class="ra-label">Giocatori</p>
          <span class="ra-badge">{{ allPlayers.length }}</span>
        </div>
        <p v-if="loadingPlayers" class="loading">Caricamento...</p>
        <p v-else-if="!allPlayers.length" class="empty-msg">
          Nessun giocatore. Aggiungi il primo dalla pagina Arena.
        </p>
        <ul v-else class="ra-settings__players">
          <li v-for="p in allPlayers" :key="p.id" class="ra-settings__player">
            <span class="ra-avatar ra-avatar--sm">{{ p.username.charAt(0).toUpperCase() }}</span>
            <span class="ra-settings__player-name">{{ p.username }}</span>
            <span class="ra-chip__tag">{{ p.cr_tag }}</span>
            <button class="ra-btn ra-btn--red ra-btn--round ra-btn--sm" :aria-label="`Rimuovi ${p.username}`" @click="removePlayer(p.id)">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
            </button>
          </li>
        </ul>
      </section>

      <section class="ra-panel ra-settings__block">
        <p class="ra-label">Esci dal clan</p>
        <p class="ra-settings__help">
          Rimuove il clan dai tuoi clan salvati sul telefono. Il clan resta attivo per gli altri.
        </p>
        <button class="ra-btn ra-btn--red ra-btn--block" @click="showLeave = true">Esci dal clan</button>
      </section>

      <p class="ra-settings__help ra-settings__note">
        Il clan viene eliminato automaticamente quando l'ultimo giocatore viene rimosso, o se resta vuoto per più di 24 ore senza tornei.
      </p>

      <AppFooter />
    </main>

    <LeaveClanDialog
      v-if="showLeave"
      :players="allPlayers"
      @close="showLeave = false"
      @confirm="confirmLeave"
    />
  </div>
</template>
