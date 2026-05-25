<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Clan } from '~~/shared/types/domain'

useHead({ title: 'I miei clan — Royal Arena' })
definePageMeta({ layout: false })

const clanStore = useClanStore()
const { myClans } = storeToRefs(clanStore)

const { signOut } = useAuth()
const loading = ref(true)
const error = ref<string | null>(null)

const showCreate = ref(false)
const showJoin = ref(false)

onMounted(async () => {
  try {
    await clanStore.loadMyClans(true)
  } catch (err: any) {
    error.value = err?.message ?? String(err)
  } finally {
    loading.value = false
  }
})

function onCreated(clan: Clan) {
  showCreate.value = false
  myClans.value = [clan, ...myClans.value]
  navigateTo(`/clans/${clan.id}/torneo`)
}

function onJoined(clan: Clan) {
  showJoin.value = false
  if (!myClans.value.find(c => c.id === clan.id)) {
    myClans.value = [clan, ...myClans.value]
  }
  navigateTo(`/clans/${clan.id}/torneo`)
}

async function logout() {
  await signOut()
  clanStore.reset()
  await navigateTo('/login', { replace: true })
}
</script>

<template>
  <div>
    <header class="header-with-actions">
      <div class="logo">I miei clan</div>
      <button class="btn-link header-action" @click="logout">Esci</button>
    </header>

    <main>
      <p v-if="loading" class="loading">Caricamento...</p>
      <p v-else-if="error" class="error-msg">Errore: {{ error }}</p>
      <template v-else>
        <div class="clans-actions">
          <button class="btn-gold" @click="showCreate = true">+ Nuovo clan</button>
          <button class="btn-link" @click="showJoin = true">Entra con codice</button>
        </div>

        <p v-if="!myClans.length" class="empty-msg">
          Non sei in nessun clan. Creane uno o entra con un codice invito.
        </p>
        <div v-else class="clans-list">
          <ClanCard v-for="c in myClans" :key="c.id" :clan="c" />
        </div>
      </template>
    </main>

    <CreateClanModal
      v-if="showCreate"
      @close="showCreate = false"
      @created="onCreated"
    />
    <JoinByCodeModal
      v-if="showJoin"
      @close="showJoin = false"
      @joined="onJoined"
    />
  </div>
</template>
