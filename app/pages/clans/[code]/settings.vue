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

useHead(() => ({ title: clan.value ? `${clan.value.name} — Settings` : 'Settings' }))

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

    <main v-if="clan">
      <section class="settings-block">
        <h3 class="settings-h">Nome clan</h3>
        <div class="settings-row">
          <span>{{ clan.name }}</span>
        </div>
      </section>

      <section class="settings-block">
        <h3 class="settings-h">Codice clan</h3>
        <div class="settings-row">
          <span class="invite-code">{{ clan.code }}</span>
          <button class="ra-btn ra-btn--ghost" @click="copyCode">Copia</button>
        </div>
        <button class="ra-btn ra-btn--ghost" :disabled="regenerating" @click="regen">
          {{ regenerating ? '...' : 'Rigenera codice' }}
        </button>
        <p class="settings-help">
          Il codice precedente diventa invalido. Condividi il nuovo con chi vuoi.
        </p>
      </section>

      <section class="settings-block">
        <h3 class="settings-h">Giocatori ({{ allPlayers.length }})</h3>
        <p v-if="loadingPlayers" class="loading">Caricamento...</p>
        <p v-else-if="!allPlayers.length" class="empty-msg">
          Nessun giocatore. Aggiungi il primo dalla pagina Torneo.
        </p>
        <ul v-else class="players-list-admin">
          <li v-for="p in allPlayers" :key="p.id" class="players-list-row">
            <span class="players-name">{{ p.username }}</span>
            <span class="players-tag">{{ p.cr_tag }}</span>
            <button class="ra-btn ra-btn--red ra-btn--round ra-btn--sm" @click="removePlayer(p.id)">×</button>
          </li>
        </ul>
      </section>

      <section class="settings-block">
        <h3 class="settings-h">Esci dal clan</h3>
        <p class="settings-help">
          Rimuove il clan dai tuoi clan salvati nel browser. Il clan resta operativo per gli altri.
        </p>
        <button class="ra-btn ra-btn--red ra-btn--block" @click="showLeave = true">Esci dal clan</button>
      </section>

      <section class="settings-block">
        <h3 class="settings-h">Eliminazione automatica</h3>
        <p class="settings-help">
          Il clan viene eliminato automaticamente quando l'ultimo giocatore viene rimosso, o se resta vuoto per più di 24 ore senza tornei.
        </p>
      </section>

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
