<script setup lang="ts">
definePageMeta({ middleware: ['clan-member'] })

const { clan, clanId, members, isOwner, refresh } = useActiveClan()
const clanStore = useClanStore()
const api = useApi()
const { showToast, showError } = useToast()

useHead(() => ({ title: clan.value ? `${clan.value.name} — Settings` : 'Settings' }))

const renaming = ref(false)
const newName = ref('')
watchEffect(() => {
  if (clan.value && !renaming.value) newName.value = clan.value.name
})

async function saveRename() {
  if (!clanId.value || !newName.value.trim()) return
  try {
    await api.renameClan(clanId.value, newName.value.trim())
    await refresh()
    await clanStore.loadMyClans(true)
    renaming.value = false
    showToast('Nome aggiornato')
  } catch (err: any) {
    showError(err?.message ?? 'Errore rename')
  }
}

async function regen() {
  if (!clanId.value) return
  if (!confirm('Generare nuovo codice? Il precedente diventa invalido.')) return
  try {
    await api.regenerateInviteCode(clanId.value)
    await refresh()
    showToast('Nuovo codice generato')
  } catch (err: any) {
    showError(err?.message ?? 'Errore regen')
  }
}

async function copyCode() {
  if (!clan.value) return
  try {
    await navigator.clipboard.writeText(clan.value.invite_code)
    showToast('Codice copiato')
  } catch {
    showToast('Copia non riuscita')
  }
}

const showKick = ref<string | null>(null)
async function doKick() {
  if (!clanId.value || !showKick.value) return
  try {
    await api.kickMember(clanId.value, showKick.value)
    await refresh()
    showKick.value = null
    showToast('Membro rimosso')
  } catch (err: any) {
    showError(err?.message ?? 'Errore kick')
  }
}

const showTransfer = ref(false)
async function doTransfer(newOwnerId: string) {
  if (!clanId.value) return
  try {
    await api.transferOwnership(clanId.value, newOwnerId)
    await refresh()
    await clanStore.loadMyClans(true)
    showTransfer.value = false
    showToast('Ownership trasferita')
  } catch (err: any) {
    showError(err?.message ?? 'Errore trasferimento')
  }
}

const showDelete = ref(false)
async function doDelete() {
  if (!clanId.value) return
  try {
    await api.deleteClan(clanId.value)
    clanStore.reset()
    await navigateTo('/clans', { replace: true })
  } catch (err: any) {
    showError(err?.message ?? 'Errore delete')
  }
}

const showLeave = ref(false)
async function doLeave() {
  if (!clanId.value) return
  try {
    await api.leaveClan(clanId.value)
    clanStore.reset()
    await navigateTo('/clans', { replace: true })
  } catch (err: any) {
    showError(err?.message ?? 'Errore uscita')
  }
}
</script>

<template>
  <div>
    <header class="header-with-actions">
      <NuxtLink v-if="clanId" :to="`/clans/${clanId}/torneo`" class="header-action">←</NuxtLink>
      <div class="logo">Settings</div>
      <span class="header-action" style="visibility:hidden">x</span>
    </header>

    <main v-if="clan">
      <!-- Nome clan -->
      <section class="settings-block">
        <h3 class="settings-h">Nome clan</h3>
        <template v-if="renaming && isOwner">
          <input v-model="newName" type="text" maxlength="40" />
          <div class="settings-row-actions">
            <button class="btn-cancel" @click="renaming = false">Annulla</button>
            <button class="btn-gold" @click="saveRename">Salva</button>
          </div>
        </template>
        <template v-else>
          <div class="settings-row">
            <span>{{ clan.name }}</span>
            <button v-if="isOwner" class="btn-link" @click="renaming = true">Modifica</button>
          </div>
        </template>
      </section>

      <!-- Codice invito -->
      <section class="settings-block">
        <h3 class="settings-h">Codice invito</h3>
        <div class="settings-row">
          <span class="invite-code">{{ clan.invite_code }}</span>
          <button class="btn-link" @click="copyCode">Copia</button>
        </div>
        <button v-if="isOwner" class="btn-link" @click="regen">Genera nuovo</button>
      </section>

      <!-- Membri -->
      <section class="settings-block">
        <h3 class="settings-h">Membri ({{ members.length }})</h3>
        <ul class="members-list">
          <li v-for="m in members" :key="m.user_id" class="members-row">
            <span class="members-id">{{ m.user_id.slice(0, 8) }}…</span>
            <span v-if="m.user_id === clan.owner_id" class="badge-owner">OWNER</span>
            <button
              v-else-if="isOwner"
              class="btn-cancel btn-mini"
              @click="showKick = m.user_id"
            >Espelli</button>
          </li>
        </ul>
      </section>

      <!-- Azioni owner -->
      <section v-if="isOwner" class="settings-block">
        <h3 class="settings-h">Owner</h3>
        <button class="btn-gold" @click="showTransfer = true">Trasferisci ownership</button>
        <button class="btn-cancel btn-danger" @click="showDelete = true">Elimina clan</button>
      </section>

      <!-- Azioni member non-owner -->
      <section v-else class="settings-block">
        <h3 class="settings-h">Membro</h3>
        <button class="btn-cancel btn-danger" @click="showLeave = true">Esci dal clan</button>
      </section>
    </main>

    <ConfirmDialog
      v-if="showKick"
      title="Espelli membro"
      :message="`Espellere ${showKick.slice(0, 8)}… dal clan?`"
      confirm-label="Espelli"
      danger
      @close="showKick = null"
      @confirm="doKick"
    />
    <TransferOwnershipDialog
      v-if="showTransfer && clan"
      :members="members"
      :current-owner-id="clan.owner_id"
      @close="showTransfer = false"
      @confirm="doTransfer"
    />
    <ConfirmDialog
      v-if="showDelete"
      title="Elimina clan"
      message="Tutto il contenuto del clan (giocatori, tornei, storico) verrà cancellato. Operazione irreversibile."
      confirm-label="Elimina"
      danger
      @close="showDelete = false"
      @confirm="doDelete"
    />
    <ConfirmDialog
      v-if="showLeave"
      title="Esci dal clan"
      message="Non vedrai più i tornei di questo clan."
      confirm-label="Esci"
      danger
      @close="showLeave = false"
      @confirm="doLeave"
    />
  </div>
</template>
