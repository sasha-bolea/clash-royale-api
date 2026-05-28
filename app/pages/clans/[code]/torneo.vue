<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ middleware: ['clan-access'] })

const { clan, clanId } = useActiveClan()
const api = useApi()
const { showToast, showError } = useToast()
const session = useBrowserSession()

const playerStore = usePlayerStore()
const { allPlayers, trophiesMap } = storeToRefs(playerStore)

const showWelcome = ref(false)
const showAddFromWelcome = ref(false)

const tournamentStore = useTournamentStore()
const {
  activeTournament,
  tournamentMatches,
  knownBattleIds,
  selectedPlayerIds,
  completedPositions,
} = storeToRefs(tournamentStore)

useHead(() => ({ title: clan.value ? `${clan.value.name} — Torneo` : 'Torneo' }))

const loading = ref(true)
const starting = ref(false)

const view = computed<'loading' | 'idle' | 'active' | 'complete'>(() => {
  if (loading.value) return 'loading'
  if (completedPositions.value) return 'complete'
  if (!activeTournament.value) return 'idle'
  return 'active'
})

const participants = computed(() =>
  (activeTournament.value?.tournament_players ?? []).map(tp => tp.players),
)

let polling: ReturnType<typeof useTournamentPolling> | null = null
const timerLabel = ref('0:00')
const POINTS_BY_PLACE: Record<number, number> = { 1: 3, 2: 2, 3: 1, 4: 0 }

function ensurePolling() {
  if (!polling && clanId.value) {
    polling = useTournamentPolling(clanId.value)
    watch(() => polling!.timerLabel.value, v => { timerLabel.value = v })
  }
  return polling
}

onMounted(async () => {
  try {
    if (!clanId.value) throw new Error('Clan non valido')

    if (tournamentStore.clanId !== clanId.value) {
      tournamentStore.reset()
      tournamentStore.clanId = clanId.value
    }
    if (playerStore.clanId !== clanId.value) playerStore.reset()
    await playerStore.loadAll(clanId.value)

    const active = await api.getActiveTournament(clanId.value)
    if (active) {
      activeTournament.value = active
      tournamentMatches.value = await api.getTournamentMatches(active.id)
      knownBattleIds.value = new Set(tournamentMatches.value.map(m => m.cr_battle_id))
      if (active.status === 'active') ensurePolling()?.startPolling()
    }

    // Welcome dialog primo accesso al clan
    if (clanId.value && !session.isWelcomed(clanId.value)) {
      showWelcome.value = true
    }
  } catch (err: any) {
    showError('Errore: ' + (err?.message ?? err))
  } finally {
    loading.value = false
  }
})

function closeWelcome() {
  showWelcome.value = false
  if (clanId.value) session.markWelcomed(clanId.value)
}

function welcomeAddPlayer() {
  closeWelcome()
  showAddFromWelcome.value = true
}

function onAddedFromWelcome(player: import('~~/shared/types/domain').Player) {
  allPlayers.value = [...allPlayers.value, player].sort((a, b) =>
    a.username.localeCompare(b.username),
  )
}

onBeforeUnmount(() => polling?.stopPolling())

function togglePlayer(id: number) {
  const set = new Set(selectedPlayerIds.value)
  if (set.has(id)) {
    set.delete(id)
  } else {
    if (set.size >= 4) {
      showToast('Massimo 4 giocatori per torneo')
      return
    }
    set.add(id)
  }
  selectedPlayerIds.value = set
}

async function startTournament() {
  if (!clanId.value) return
  const ids = [...selectedPlayerIds.value]
  if (ids.length < 3 || ids.length > 4) {
    showToast('Seleziona 3 o 4 giocatori')
    return
  }
  starting.value = true
  try {
    await api.createTournament(clanId.value, ids, 'amichevole')
    activeTournament.value = await api.getActiveTournament(clanId.value)
    tournamentMatches.value = []
    knownBattleIds.value = new Set()
    ensurePolling()?.startPolling()
  } catch (err: any) {
    showError('Errore avvio torneo: ' + (err?.message ?? err))
  } finally {
    starting.value = false
  }
}

async function cancelTournament() {
  if (!activeTournament.value) return
  if (!confirm('Annullare il torneo in corso?')) return
  polling?.stopPolling()
  try {
    await api.updateTournamentStatus(activeTournament.value.id, 'invalid')
    tournamentStore.reset()
    tournamentStore.clanId = clanId.value
  } catch (err: any) {
    showError('Errore annullamento: ' + (err?.message ?? err))
  }
}

</script>

<template>
  <div>
    <header class="header-with-actions">
      <NuxtLink to="/" class="header-action" aria-label="home">←</NuxtLink>
      <div class="logo">{{ clan?.name ?? 'Torneo' }}</div>
      <NuxtLink
        v-if="clan"
        :to="`/clans/${clan.code}/settings`"
        class="header-action"
        aria-label="settings"
      >⚙</NuxtLink>
    </header>

    <main>
      <div id="app">
        <p v-if="view === 'loading'" class="loading">Caricamento...</p>

        <div v-else-if="view === 'idle'" class="idle-view">
          <PlayersManager v-if="clanId" :clan-id="clanId" />

          <div class="section-label">SELEZIONA PARTECIPANTI</div>
          <div class="player-list-card">
            <div class="player-list">
              <p v-if="!allPlayers.length" class="empty-msg">
                Aggiungi giocatori per avviare un torneo
              </p>
              <PlayerChip
                v-for="p in allPlayers"
                :key="p.id"
                :player="p"
                :trophies="trophiesMap[p.id] ?? '—'"
                :selected="selectedPlayerIds.has(p.id)"
                @toggle="togglePlayer(p.id)"
              />
            </div>
          </div>
          <div class="start-wrap">
            <button
              class="btn-start"
              :disabled="starting || allPlayers.length < 3"
              @click="startTournament"
            >
              {{ starting ? '...' : 'AVVIA' }}
            </button>
          </div>
        </div>

        <div v-else-if="view === 'active'" class="active-view">
          <div class="status-bar">
            <span class="dot-live"></span>
            <span class="status-text">Rilevamento</span>
            <span class="timer">{{ timerLabel }}</span>
          </div>
          <div class="participants-bar">
            <span v-for="p in participants" :key="p.id" class="pchip">{{ p.username }}</span>
          </div>
          <div class="matches-list">
            <p v-if="!tournamentMatches.length" class="empty-msg">In attesa della prima partita...</p>
            <MatchRow
              v-for="(m, i) in tournamentMatches"
              :key="m.id"
              :match="m"
              :index="i"
            />
          </div>
          <div class="active-footer">
            <button class="btn-cancel" @click="cancelTournament">Annulla torneo</button>
          </div>
        </div>

        <Podium
          v-else-if="view === 'complete' && completedPositions"
          :positions="completedPositions"
          :points-by-place="POINTS_BY_PLACE"
        />
      </div>
    </main>

    <WelcomeClanDialog
      v-if="showWelcome && clan"
      :clan-name="clan.name"
      :players="allPlayers"
      @close="closeWelcome"
      @add="welcomeAddPlayer"
    />

    <AddPlayerModal
      v-if="showAddFromWelcome && clanId"
      :clan-id="clanId"
      @close="showAddFromWelcome = false"
      @added="onAddedFromWelcome"
    />
  </div>
</template>
