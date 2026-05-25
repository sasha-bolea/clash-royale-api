<script setup lang="ts">
import { storeToRefs } from 'pinia'

useHead({ title: 'Torneo — Royal Arena' })

const api = useApi()
const { showToast, showError } = useToast()

const playerStore = usePlayerStore()
const { allPlayers, trophiesMap } = storeToRefs(playerStore)

const tournamentStore = useTournamentStore()
const {
  activeTournament,
  tournamentMatches,
  knownBattleIds,
  selectedPlayerIds,
  completedPositions,
} = storeToRefs(tournamentStore)

const polling = useTournamentPolling()
const { timerLabel, POINTS_BY_PLACE } = polling

const loading = ref(true)
const starting = ref(false)

// Stato derivato per scegliere quale view renderizzare.
const view = computed<'loading' | 'idle' | 'active' | 'paused' | 'complete'>(() => {
  if (loading.value) return 'loading'
  if (completedPositions.value) return 'complete'
  if (!activeTournament.value) return 'idle'
  if (activeTournament.value.status === 'paused') return 'paused'
  return 'active'
})

const participants = computed(() =>
  (activeTournament.value?.tournament_players ?? []).map(tp => tp.players),
)

onMounted(async () => {
  try {
    if (!playerStore.loaded) await playerStore.loadAll()

    const active = await api.getActiveTournament()
    if (active) {
      activeTournament.value = active
      tournamentMatches.value = await api.getTournamentMatches(active.id)
      knownBattleIds.value = new Set(tournamentMatches.value.map(m => m.cr_battle_id))
      if (active.status === 'active') polling.startPolling()
    }
  } catch (err: any) {
    showError('Errore di connessione: ' + (err?.message ?? err))
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => polling.stopPolling())

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
  const ids = [...selectedPlayerIds.value]
  if (ids.length < 3 || ids.length > 4) {
    showToast('Seleziona 3 o 4 giocatori')
    return
  }
  starting.value = true
  try {
    await api.createTournament(ids, 'amichevole')
    // Ricarica con join giocatori
    activeTournament.value = await api.getActiveTournament()
    tournamentMatches.value = []
    knownBattleIds.value = new Set()
    polling.startPolling()
  } catch (err: any) {
    showError('Errore avvio torneo: ' + (err?.message ?? err))
  } finally {
    starting.value = false
  }
}

async function cancelTournament() {
  if (!activeTournament.value) return
  if (!confirm('Annullare il torneo in corso?')) return
  polling.stopPolling()
  try {
    await api.updateTournamentStatus(activeTournament.value.id, 'invalid')
    tournamentStore.reset()
  } catch (err: any) {
    showError('Errore annullamento: ' + (err?.message ?? err))
  }
}

async function resumeTournament() {
  if (!activeTournament.value) return
  try {
    await api.updateTournamentStatus(activeTournament.value.id, 'active')
    activeTournament.value = { ...activeTournament.value, status: 'active' }
    polling.startPolling()
  } catch (err: any) {
    showError('Errore ripresa: ' + (err?.message ?? err))
  }
}
</script>

<template>
  <div>
    <header>
      <div class="logo">Torneo</div>
    </header>

    <main>
      <div id="app">
        <p v-if="view === 'loading'" class="loading">Caricamento...</p>

        <!-- IDLE -->
        <div v-else-if="view === 'idle'" class="idle-view">
          <div class="section-label">GIOCATORI</div>
          <div class="player-list-card">
            <div class="player-list">
              <p v-if="!allPlayers.length" class="empty-msg">Nessun giocatore registrato</p>
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
            <button class="btn-start" :disabled="starting" @click="startTournament">
              {{ starting ? '...' : 'AVVIA' }}
            </button>
          </div>
        </div>

        <!-- ACTIVE -->
        <div v-else-if="view === 'active'" class="active-view">
          <div class="status-bar">
            <span class="dot-live"></span>
            <span class="status-text">Rilevamento</span>
            <span class="timer" id="timer">{{ timerLabel }}</span>
          </div>
          <div class="participants-bar">
            <span v-for="p in participants" :key="p.id" class="pchip">{{ p.username }}</span>
          </div>
          <div class="matches-list" id="matches-list">
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

        <!-- PAUSED -->
        <div v-else-if="view === 'paused'" class="active-view">
          <div class="status-bar paused">
            <span class="dot-paused"></span>
            <span class="status-text">In pausa</span>
          </div>
          <div class="matches-list">
            <p v-if="!tournamentMatches.length" class="empty-msg">Nessuna partita rilevata</p>
            <MatchRow
              v-for="(m, i) in tournamentMatches"
              :key="m.id"
              :match="m"
              :index="i"
            />
          </div>
          <p class="pause-msg">
            Nessuna partita rilevata da 10 minuti.<br>Il torneo è in pausa.
          </p>
          <div class="active-footer">
            <button class="btn-gold" @click="resumeTournament">Riprendi polling</button>
            <button class="btn-cancel" @click="cancelTournament">Annulla torneo</button>
          </div>
        </div>

        <!-- COMPLETE -->
        <Podium
          v-else-if="view === 'complete' && completedPositions"
          :positions="completedPositions"
          :points-by-place="POINTS_BY_PLACE"
        />
      </div>
    </main>
  </div>
</template>
