<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Tournament } from '~~/shared/types/domain'

definePageMeta({ middleware: ['clan-access'] })

const { clan, clanId } = useActiveClan()
const api = useApi()
const tournaments = ref<Tournament[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const hideInvalid = ref(true)

useHead(() => ({ title: clan.value ? `${clan.value.name} — Storico` : 'Storico' }))

const visibleList = computed(() =>
  hideInvalid.value
    ? tournaments.value.filter(t => t.status !== 'invalid')
    : tournaments.value,
)

onMounted(async () => {
  try {
    if (clanId.value) tournaments.value = await api.getTournamentsHistory(clanId.value)
  } catch (err: any) {
    error.value = err?.message ?? String(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <header><div class="logo">Storico</div></header>
    <main>
      <div id="tab-content">
        <p v-if="loading" class="loading">Caricamento...</p>
        <p v-else-if="error" class="error-msg">Errore: {{ error }}</p>
        <template v-else>
          <div class="storico-toolbar">
            <button
              class="toggle-invalid"
              :class="{ active: hideInvalid }"
              @click="hideInvalid = !hideInvalid"
            >
              {{ hideInvalid ? 'Mostra annullati' : 'Nascondi annullati' }}
            </button>
          </div>
          <p v-if="!visibleList.length" class="empty-msg">Nessun torneo concluso.</p>
          <div v-else class="storico-list">
            <TournamentHistoryCard
              v-for="t in visibleList"
              :key="t.id"
              :tournament="t"
            />
          </div>
        </template>
      </div>
    </main>
  </div>
</template>
