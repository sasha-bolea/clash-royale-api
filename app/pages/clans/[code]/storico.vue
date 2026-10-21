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
  <div class="clan-page">
    <PageHeader title="Storico" />
    <main>
      <div id="tab-content">
        <SkeletonList v-if="loading" :count="3" :height="180" />
        <p v-else-if="error" class="error-msg">Errore: {{ error }}</p>
        <template v-else>
          <label class="ra-toggle">
            <input v-model="hideInvalid" type="checkbox" :true-value="false" :false-value="true">
            <span class="ra-toggle__track" aria-hidden="true" />
            <span>Mostra tornei annullati</span>
          </label>
          <EmptyState
            v-if="!visibleList.length"
            icon="/images/ui/tournament.png"
            title="Ancora nessun torneo"
            text="Quando un torneo finisce, lo trovi qui con tutte le partite."
          >
            <NuxtLink v-if="clan" :to="`/clans/${clan.code}/torneo`" class="ra-btn ra-btn--gold">Vai all'Arena</NuxtLink>
          </EmptyState>
          <div v-else class="storico-list">
            <TournamentHistoryCard
              v-for="(t, i) in visibleList"
              :key="t.id"
              class="ra-pop-in"
              :style="{ animationDelay: `${Math.min(i, 8) * 50}ms` }"
              :tournament="t"
            />
          </div>
        </template>
      </div>
    </main>
  </div>
</template>
