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

const medals = ['🥇', '🥈', '🥉']

const totalMatches = computed(() =>
  finishedTournaments.value.reduce((sum, t) => sum + (t.tournament_matches?.length ?? 0), 0),
)

const lastDateLabel = computed(() => {
  if (!finishedTournaments.value.length) return ''
  const last = finishedTournaments.value.reduce((latest, t) =>
    new Date(t.started_at) > new Date(latest.started_at) ? t : latest,
  )
  return new Date(last.started_at).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
})

const generaleExpanded = ref(false)

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
  <div>
    <header><div class="logo">Statistiche</div></header>
    <main>
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'giocatori' }"
          @click="switchTab('giocatori')"
        >GIOCATORI</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'torneo' }"
          @click="switchTab('torneo')"
        >TORNEO</button>
      </div>

      <div id="tab-content">
        <p v-if="error" class="error-msg">Errore: {{ error }}</p>

        <template v-else-if="activeTab === 'giocatori'">
          <p v-if="loadingPlayers" class="loading">Caricamento giocatori...</p>
          <p v-else-if="!allPlayers.length" class="empty-msg">Nessun giocatore nel clan.</p>
          <div v-else id="stats-grid">
            <PlayerStatsCard v-for="p in allPlayers" :key="p.id" :player="p" />
          </div>
        </template>

        <template v-else>
          <p v-if="loadingTournaments" class="loading">Caricamento...</p>
          <p v-else-if="!finishedTournaments.length" class="empty-msg">Nessun torneo concluso.</p>
          <div v-else class="ts-list">
            <div class="ts-card ts-card-generale" :class="{ expanded: generaleExpanded }">
              <div class="ts-name" @click="generaleExpanded = !generaleExpanded">
                <span>GENERALE</span>
                <span class="card-chevron">▾</span>
              </div>
              <div class="ts-body">
                <div class="ts-summary">
                  <div class="ts-summary-item">
                    <span class="ts-summary-val">{{ finishedTournaments.length }}</span>
                    <span class="ts-summary-lbl">Tornei</span>
                  </div>
                  <div class="ts-summary-item">
                    <span class="ts-summary-val">{{ totalMatches }}</span>
                    <span class="ts-summary-lbl">Partite</span>
                  </div>
                  <div class="ts-summary-item">
                    <span class="ts-summary-val ts-summary-date">{{ lastDateLabel }}</span>
                    <span class="ts-summary-lbl">Ultimo torneo</span>
                  </div>
                </div>
                <div class="ts-chart-header">
                  <span class="ts-chart-title">Andamento vittorie</span>
                  <div class="ts-filter-btns">
                    <button class="ts-filter-btn" :class="{ active: chartFilter === '1m' }" @click="chartFilter = '1m'">1M</button>
                    <button class="ts-filter-btn" :class="{ active: chartFilter === '3m' }" @click="chartFilter = '3m'">3M</button>
                    <button class="ts-filter-btn" :class="{ active: chartFilter === 'sempre' }" @click="chartFilter = 'sempre'">Sempre</button>
                  </div>
                </div>
                <PointsChart
                  :tournaments="finishedTournaments"
                  :players="allPlayers"
                  :filter="chartFilter"
                />
              </div>
            </div>

            <TournamentStatsCard
              v-for="(s, i) in playerStats"
              :key="s.username"
              :stats="s"
              :medal="medals[i]"
            />
          </div>
        </template>
      </div>
    </main>
  </div>
</template>
