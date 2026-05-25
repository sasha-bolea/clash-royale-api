<script setup lang="ts">
definePageMeta({ middleware: ['clan-access'] })

const { clan, clanId } = useActiveClan()
const clanStore = useClanStore()
const session = useBrowserSession()
const api = useApi()
const { showToast, showError } = useToast()

useHead(() => ({ title: clan.value ? `${clan.value.name} — Settings` : 'Settings' }))

const regenerating = ref(false)

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

function leaveLocal() {
  if (!clanId.value) return
  if (!confirm('Uscire dal clan? Il clan resta su DB, puoi rientrare con il codice.')) return
  session.removeClan(clanId.value)
  clanStore.reset()
  navigateTo('/', { replace: true })
}
</script>

<template>
  <div>
    <header class="header-with-actions">
      <NuxtLink v-if="clan" :to="`/clans/${clan.code}/torneo`" class="header-action">←</NuxtLink>
      <div class="logo">Settings</div>
      <span class="header-action" style="visibility:hidden">x</span>
    </header>

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
          <button class="btn-link" @click="copyCode">Copia</button>
        </div>
        <button class="btn-link" :disabled="regenerating" @click="regen">
          {{ regenerating ? '...' : 'Rigenera codice' }}
        </button>
        <p class="settings-help">
          Il codice precedente diventa invalido. Condividi il nuovo con chi vuoi.
        </p>
      </section>

      <section class="settings-block">
        <h3 class="settings-h">Esci dal clan</h3>
        <p class="settings-help">
          Rimuove il clan dai tuoi clan salvati nel browser. Il clan resta operativo per gli altri.
        </p>
        <button class="btn-cancel btn-danger" @click="leaveLocal">Esci dal clan</button>
      </section>

      <section class="settings-block">
        <h3 class="settings-h">Eliminazione automatica</h3>
        <p class="settings-help">
          Il clan viene eliminato automaticamente quando l'ultimo giocatore viene rimosso, o se resta vuoto per più di 24 ore senza tornei.
        </p>
      </section>
    </main>
  </div>
</template>
