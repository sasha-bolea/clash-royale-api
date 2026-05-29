<script setup lang="ts">
import { storeToRefs } from 'pinia'
import TournamentBracket from '~/components/bracket/TournamentBracket.vue'

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

// Taglie torneo valide.
const VALID_SIZES = [2, 3, 4, 6, 8]
const selectedCount = computed(() => selectedPlayerIds.value.size)

// Modalità classifica completa (4, 6, 8): toggle nel torneo in corso, cambiabile
// in ogni momento. Le partite extra vengono comunque sempre rilevate e salvate.
const activeSupportsFull = computed(() =>
  [4, 6, 8].includes(activeTournament.value?.tournament_players?.length ?? 0))

async function toggleFullRanking(e: Event) {
  const val = (e.target as HTMLInputElement).checked
  if (!activeTournament.value) return
  try {
    await api.setTournamentFullRanking(activeTournament.value.id, val)
    activeTournament.value = { ...activeTournament.value, full_ranking: val }
    // Ricontrolla il completamento con la nuova modalità.
    await polling?.recheck()
  } catch (err: any) {
    showError('Errore cambio modalità: ' + (err?.message ?? err))
  }
}

// Partite vinte per giocatore nel torneo corrente (per il podio).
const podiumWins = computed<Record<number, number>>(() => {
  const w: Record<number, number> = {}
  tournamentMatches.value.forEach((m) => {
    if (m.winner_id) w[m.winner_id] = (w[m.winner_id] ?? 0) + 1
  })
  return w
})

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
    if (set.size >= 8) {
      showToast('Massimo 8 giocatori per torneo')
      return
    }
    set.add(id)
  }
  selectedPlayerIds.value = set
}

async function startTournament() {
  if (!clanId.value) return
  const ids = [...selectedPlayerIds.value]
  if (!VALID_SIZES.includes(ids.length)) {
    showToast('Seleziona 2, 3, 4, 6 o 8 giocatori')
    return
  }
  starting.value = true
  try {
    // Default OFF: la modalità si attiva poi dal torneo in corso.
    await api.createTournament(clanId.value, ids, 'amichevole', false)
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
  <div class="tournament-page">
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
            <p class="select-hint">Selezionati: {{ selectedCount }} (validi: 2, 3, 4, 6, 8)</p>
            <button
              class="btn-start"
              :disabled="starting || !VALID_SIZES.includes(selectedCount)"
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
          <div v-if="activeSupportsFull" class="fullrank-toggle">
            <label class="fullrank-label">
              <input
                type="checkbox"
                :checked="activeTournament?.full_ranking"
                @change="toggleFullRanking"
              >
              <span>Classifica completa (scontri per tutte le posizioni)</span>
            </label>
          </div>
          <TournamentBracket
            v-if="activeTournament"
            :matches="tournamentMatches"
            :tournament="activeTournament"
            :participants="participants"
          />
          <details class="matches-detail">
            <summary>Partite rilevate ({{ tournamentMatches.length }})</summary>
            <div class="matches-list">
              <p v-if="!tournamentMatches.length" class="empty-msg">In attesa della prima partita...</p>
              <MatchRow
                v-for="(m, i) in tournamentMatches"
                :key="m.id"
                :match="m"
                :index="i"
              />
            </div>
          </details>
          <div class="active-footer">
            <button class="btn-cancel" @click="cancelTournament">Annulla torneo</button>
          </div>
        </div>

        <Podium
          v-else-if="view === 'complete' && completedPositions"
          :positions="completedPositions"
          :wins="podiumWins"
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
