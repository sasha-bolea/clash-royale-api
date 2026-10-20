<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Tournament } from '~~/shared/types/domain'

definePageMeta({ middleware: ['clan-access'] })

const { clan, clanId } = useActiveClan()
const api = useApi()
const playerStore = usePlayerStore()
const { allPlayers, standingsMap } = storeToRefs(playerStore)

useHead(() => ({ title: clan.value ? `${clan.value.name} — Statistiche` : 'Statistiche' }))

type Tab = 'giocatori' | 'torneo'
type ChartFilter = '1m' | '3m' | 'sempre'

const activeTab = ref<Tab>('torneo')
const chartFilter = ref<ChartFilter>('sempre')

const tournaments = ref<Tournament[]>([])
const loadingPlayers = ref(true)
const loadingTournaments = ref(true)
const error = ref<string | null>(null)

const finishedTournaments = computed(() =>
  tournaments.value.filter(t => t.status === 'finished'),
)

const playerStats = computed(() => {
  if (!allPlayers.value.length) return []
  const list = computePlayerTournamentStats(
    allPlayers.value,
    finishedTournaments.value,
    standingsMap.value,
  )
  return list.sort((a, b) => b.firstPlaces - a.firstPlaces || b.wins - a.wins)
})


const totalMatches = computed(() =>
  finishedTournaments.value.reduce((sum, t) => sum + (t.tournament_matches?.length ?? 0), 0),
)

const lastDateLabel = computed(() => {
  if (!finishedTournaments.value.length) return ''
  const last = finishedTournaments.value.reduce((latest, t) =>
    new Date(t.started_at) > new Date(latest.started_at) ? t : latest,
  )
  return new Date(last.started_at).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short',
  })
})


async function ensurePlayers() {
  if (!clanId.value) return
  try {
    await playerStore.loadAll(clanId.value)
  } catch (err: any) {
    error.value = err?.message ?? String(err)
  } finally {
    loadingPlayers.value = false
  }
}

async function ensureTournaments() {
  if (!clanId.value) return
  if (tournaments.value.length === 0) {
    try {
      tournaments.value = await api.getTournamentsHistory(clanId.value)
    } catch (err: any) {
      error.value = err?.message ?? String(err)
    }
  }
  loadingTournaments.value = false
}

async function switchTab(t: Tab) {
  activeTab.value = t
  if (t === 'giocatori') await ensurePlayers()
  else await Promise.all([ensurePlayers(), ensureTournaments()])
}

onMounted(() => switchTab(activeTab.value))
</script>

<template>
  <div class="clan-page">
    <PageHeader title="Statistiche" />
    <main>
      <div class="ra-tabs">
        <button
          class="ra-tab"
          :class="{ 'is-active': activeTab === 'giocatori' }"
          @click="switchTab('giocatori')"
        >GIOCATORI</button>
        <button
          class="ra-tab"
          :class="{ 'is-active': activeTab === 'torneo' }"
          @click="switchTab('torneo')"
        >TORNEI</button>
      </div>

      <div id="tab-content">
        <p v-if="error" class="error-msg">Errore: {{ error }}</p>

        <template v-else-if="activeTab === 'giocatori'">
          <p v-if="loadingPlayers" class="loading">Caricamento giocatori...</p>
          <p v-else-if="!allPlayers.length" class="empty-msg">Nessun giocatore nel clan.</p>
          <div v-else class="ra-stack">
            <PlayerStatsCard v-for="p in allPlayers" :key="p.id" :player="p" />
          </div>
        </template>

        <template v-else>
          <p v-if="loadingTournaments" class="loading">Caricamento...</p>
          <p v-else-if="!finishedTournaments.length" class="empty-msg">Nessun torneo concluso.</p>
          <div v-else class="ra-stack">
            <div class="ra-stats-summary">
              <div class="ra-stat">
                <img class="ra-stat__icon" src="/images/ui/tournament.png" alt="">
                <span class="ra-stat__value">{{ finishedTournaments.length }}</span>
                <span class="ra-stat__label">Tornei</span>
              </div>
              <div class="ra-stat">
                <img class="ra-stat__icon" src="/images/ui/battle.png" alt="">
                <span class="ra-stat__value">{{ totalMatches }}</span>
                <span class="ra-stat__label">Partite</span>
              </div>
              <div class="ra-stat">
                <img class="ra-stat__icon" src="/images/ui/trophy.png" alt="">
                <span class="ra-stat__value ra-stat__value--sm">{{ lastDateLabel }}</span>
                <span class="ra-stat__label">Ultimo</span>
              </div>
            </div>

            <div class="ra-panel ra-chart">
              <div class="ra-chart__head">
                <p class="ra-label">Andamento vittorie</p>
                <div class="ra-tabs ra-tabs--sm">
                  <button class="ra-tab" :class="{ 'is-active': chartFilter === '1m' }" @click="chartFilter = '1m'">1M</button>
                  <button class="ra-tab" :class="{ 'is-active': chartFilter === '3m' }" @click="chartFilter = '3m'">3M</button>
                  <button class="ra-tab" :class="{ 'is-active': chartFilter === 'sempre' }" @click="chartFilter = 'sempre'">TUTTO</button>
                </div>
              </div>
              <PointsChart
                :tournaments="finishedTournaments"
                :players="allPlayers"
                :filter="chartFilter"
              />
            </div>

            <p class="ra-label">Classifica del clan</p>
            <TournamentStatsCard
              v-for="(s, i) in playerStats"
              :key="s.username"
              :stats="s"
              class="ra-pop-in"
              :style="{ animationDelay: `${Math.min(i, 8) * 50}ms` }"
              :rank="i + 1"
            />
          </div>
        </template>
      </div>
    </main>
  </div>
</template>
