<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { BracketFormat } from '~~/shared/types/domain'
import TournamentBracket from '~/components/bracket/TournamentBracket.vue'
import { computeSuggestions, countSuggestionChoices, type SuggestedPair } from '~/composables/useSuggestions'

definePageMeta({ middleware: ['clan-access'] })

const { clan, clanId } = useActiveClan()
const api = useApi()
const { showToast, showError } = useToast()
const { askConfirm } = useConfirm()
const session = useBrowserSession()

const playerStore = usePlayerStore()
const { allPlayers, trophiesMap } = storeToRefs(playerStore)

const showWelcome = ref(false)
const showAddFromWelcome = ref(false)
const showInfo = ref(false)
const showActiveInfo = ref(false)

const tournamentStore = useTournamentStore()
const {
  activeTournament,
  tournamentMatches,
  knownBattleIds,
  selectedPlayerIds,
  completedPositions,
} = storeToRefs(tournamentStore)

const loading = ref(true)
const starting = ref(false)

const view = computed<'loading' | 'idle' | 'active' | 'complete'>(() => {
  if (loading.value) return 'loading'
  if (completedPositions.value) return 'complete'
  if (!activeTournament.value) return 'idle'
  return 'active'
})

useHead(() => ({ title: clan.value ? `${clan.value.name} — Torneo` : 'Torneo' }))

const participants = computed(() =>
  (activeTournament.value?.tournament_players ?? []).map(tp => tp.players),
)

// ---- Suggerimento accoppiamenti per il primo round ----
// Stato puramente visivo (nessuna scrittura su DB): riempie gli slot vuoti del
// primo round del bracket con coppie casuali tra i partecipanti non ancora
// impegnati in una partita reale.
const suggestActive = ref(false)
const suggestedPairs = ref<SuggestedPair[]>([])
const activeFormat = computed(() => participants.value.length as BracketFormat)
// Il 2 mostra già entrambi i finalisti: niente da consigliare.
const canSuggest = computed(() => activeFormat.value !== 2)
// Suggerire ha senso solo se restano almeno 2 combinazioni possibili: con una
// sola il tabellone è già obbligato e il pulsante resta disattivato.
const suggestUseful = computed(() =>
  countSuggestionChoices(tournamentMatches.value, participants.value, activeFormat.value) > 1)

// Attiva/azzera il consiglio. All'attivazione genera coppie casuali fresche.
function toggleSuggest() {
  if (suggestActive.value) {
    suggestActive.value = false
    suggestedPairs.value = []
  } else {
    suggestActive.value = true
    suggestedPairs.value = computeSuggestions(
      tournamentMatches.value, participants.value, activeFormat.value, [],
    )
  }
}

// Quando arrivano partite reali, aggiorna il consiglio: le coppie ancora valide
// restano, solo i giocatori "rubati" da una partita reale vengono ri-accoppiati.
watch(tournamentMatches, () => {
  if (!suggestActive.value) return
  suggestedPairs.value = computeSuggestions(
    tournamentMatches.value, participants.value, activeFormat.value, suggestedPairs.value,
  )
})

let polling: ReturnType<typeof useTournamentPolling> | null = null
const timerLabel = ref('0:00')

// Taglie torneo valide.
const VALID_SIZES = [2, 3, 4, 6, 8]

// Steps shown in the "Come funziona" dialogs (setup and live bracket).
const SETUP_STEPS = [
  { title: 'Seleziona i giocatori', text: 'Tocca i giocatori del clan che parteciperanno al torneo. Puoi scegliere 2, 3, 4, 6 o 8 partecipanti.' },
  { title: 'Avvia il torneo', text: 'Premi AVVIA TORNEO. Il torneo parte immediatamente e il rilevamento delle battaglie è attivo.' },
  { title: 'Gioca su Clash Royale', text: 'I partecipanti giocano le loro partite normalmente, senza fare nulla di speciale.' },
  { title: 'Risultati automatici', text: "L'app monitora le battaglie in tempo reale e aggiorna la classifica in automatico, non serve inserire i punteggi a mano." },
]
const BRACKET_STEPS = [
  { title: 'Giocate liberamente', text: "Il tabellone parte vuoto. Ogni partecipante sfida chi vuole, nell'ordine che preferisce: non c'è un calendario imposto." },
  { title: 'Le prime partite definiscono il tabellone', text: "Appena due partecipanti si scontrano, l'app rileva la battaglia e la inserisce al posto giusto. Sono i primi incontri a determinare chi affronta chi nei turni successivi." },
  { title: 'Aggiornamento in tempo reale', text: 'Ogni nuova partita compare automaticamente nel tabellone entro pochi secondi, con vincitore e corone. Non devi inserire nulla a mano.' },
  { title: 'Chiusura automatica', text: 'Quando tutti gli incontri necessari sono stati giocati, il torneo si conclude da solo e mostra la classifica finale.' },
]
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
    // Ri-carica le partite: quelle extra sono già salvate dal poll anche quando
    // full_ranking era OFF, ma potrebbero non essere ancora nel client.
    tournamentMatches.value = await api.getTournamentMatches(activeTournament.value.id)
    await polling?.recheck()
  } catch (err: any) {
    showError('Errore cambio modalità: ' + (err?.message ?? err))
  }
}

// Tornei consecutivi: a fine torneo ne parte subito un altro con gli stessi
// giocatori. Salvato sul torneo (vale per tutto il clan), il successivo lo eredita.
async function toggleAutoRestart(e: Event) {
  const input = e.target as HTMLInputElement
  if (!activeTournament.value) return
  try {
    await api.setTournamentAutoRestart(activeTournament.value.id, input.checked)
    activeTournament.value = { ...activeTournament.value, auto_restart: input.checked }
  } catch (err: any) {
    input.checked = !input.checked
    showError('Errore tornei consecutivi: ' + (err?.message ?? err))
  }
}

// A new tournament (consecutive mode) starts with a clean suggestion overlay.
watch(() => activeTournament.value?.id, () => {
  suggestActive.value = false
  suggestedPairs.value = []
})

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

// Leave the podium and go back to player selection, keeping the last
// tournament's players pre-selected for a quick rematch.
function startNewTournament() {
  const lastPlayerIds = participants.value.map(p => p.id)
  tournamentStore.reset()
  tournamentStore.clanId = clanId.value
  selectedPlayerIds.value = new Set(lastPlayerIds)
}

async function cancelTournament() {
  if (!activeTournament.value) return
  const ok = await askConfirm({
    title: 'Annullare il torneo?',
    message: 'Il torneo in corso viene chiuso come annullato e le partite rilevate non contano.',
    confirmLabel: 'Annulla torneo',
    danger: true,
  })
  if (!ok || !activeTournament.value) return
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
    <PageHeader :title="clan?.name ?? 'Torneo'" back-to="/">
      <template #action>
        <NuxtLink
          v-if="clan"
          :to="`/clans/${clan.code}/settings`"
          class="ra-btn ra-btn--round ra-btn--sm"
          aria-label="Impostazioni"
        ><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg></NuxtLink>
      </template>
    </PageHeader>

    <main>
      <div id="app">
        <SkeletonList v-if="view === 'loading'" :count="5" :height="60" />

        <div v-else-if="view === 'idle'" class="idle-view">
          <PlayersManager v-if="clanId" :clan-id="clanId" />

          <div class="ra-arena__label-row">
            <p class="ra-label">Seleziona partecipanti</p>
            <button class="ra-btn ra-btn--round ra-btn--xs" aria-label="Come funziona" @click="showInfo = true">?</button>
          </div>
          <div class="player-list-card">
            <div class="player-list">
              <EmptyState
                v-if="!allPlayers.length"
                icon="/images/ui/crown-shield.png"
                title="Nessun giocatore"
                text="Aggiungi i giocatori del clan con il loro tag di Clash Royale per avviare un torneo."
              />
              <PlayerChip
                v-for="(p, i) in allPlayers"
                :key="p.id"
                class="ra-pop-in"
                :style="{ animationDelay: `${i * 40}ms` }"
                :player="p"
                :trophies="trophiesMap[p.id] ?? '—'"
                :selected="selectedPlayerIds.has(p.id)"
                @toggle="togglePlayer(p.id)"
              />
            </div>
          </div>

          <NuxtLink
            v-if="clan && allPlayers.length >= 2"
            :to="`/clans/${clan.code}/recupera`"
            class="ra-btn ra-btn--ghost ra-btn--sm ra-btn--block ra-arena__past"
          >↺ Registra un torneo passato</NuxtLink>

          <InfoDialog v-if="showInfo" title="Come funziona" :steps="SETUP_STEPS" @close="showInfo = false" />
        </div>

        <div v-else-if="view === 'active'" class="active-view">
          <div class="ra-panel ra-live">
            <span class="ra-badge ra-badge--live">LIVE</span>
            <span class="ra-live__text">Rilevamento partite</span>
            <span class="ra-live__timer">{{ timerLabel }}</span>
          </div>
          <div class="ra-live__players ra-strip">
            <span v-for="p in participants" :key="p.id" class="ra-pill">
              <span class="ra-avatar ra-avatar--sm">{{ p.username.charAt(0).toUpperCase() }}</span>
              {{ p.username }}
            </span>
          </div>

          <div class="ra-live__tools">
            <button class="ra-btn ra-btn--ghost ra-btn--sm" @click="showActiveInfo = true">ⓘ Come funziona</button>
            <button
              v-if="canSuggest"
              class="ra-btn ra-btn--sm"
              :class="{ 'ra-btn--red': suggestActive }"
              :disabled="!suggestActive && !suggestUseful"
              :title="!suggestActive && !suggestUseful ? 'Resta una sola combinazione possibile' : undefined"
              @click="toggleSuggest"
            >
              {{ suggestActive ? '✕ Pulisci' : '🎲 Suggerisci' }}
            </button>
          </div>

          <InfoDialog v-if="showActiveInfo" title="Tabellone automatico" :steps="BRACKET_STEPS" @close="showActiveInfo = false" />

          <label v-if="activeSupportsFull" class="ra-toggle">
            <input
              type="checkbox"
              :checked="activeTournament?.full_ranking"
              @change="toggleFullRanking"
            >
            <span class="ra-toggle__track" aria-hidden="true" />
            <span>Classifica completa (scontri per tutte le posizioni)</span>
          </label>
          <label class="ra-toggle">
            <input
              type="checkbox"
              :checked="activeTournament?.auto_restart"
              @change="toggleAutoRestart"
            >
            <span class="ra-toggle__track" aria-hidden="true" />
            <span>Tornei consecutivi (a fine torneo ne riparte uno con gli stessi giocatori)</span>
          </label>
          <TournamentBracket
            v-if="activeTournament"
            :key="`bracket-${activeTournament.id}-${activeTournament.full_ranking}`"
            :matches="tournamentMatches"
            :tournament="activeTournament"
            :participants="participants"
            :full-ranking="activeTournament.full_ranking ?? false"
            :suggestions="suggestActive ? suggestedPairs : []"
          />
          <details class="ra-details">
            <summary class="ra-details__summary">Partite rilevate ({{ tournamentMatches.length }})</summary>
            <div class="ra-details__body">
              <p v-if="!tournamentMatches.length" class="ra-waiting">In attesa della prima partita…</p>
              <MatchRow
                v-for="(m, i) in tournamentMatches"
                :key="m.id"
                :match="m"
                :index="i"
              />
            </div>
          </details>
          <div class="active-footer">
            <button class="ra-btn ra-btn--red ra-btn--block" @click="cancelTournament">Annulla torneo</button>
          </div>
        </div>

        <Podium
          v-else-if="view === 'complete' && completedPositions"
          :positions="completedPositions"
          :wins="podiumWins"
          @new-tournament="startNewTournament"
        />
      </div>
    </main>

    <!-- Barra azione fissa sopra la tab bar: AVVIA sempre raggiungibile -->
    <div v-if="view === 'idle'" class="ra-actionbar">
      <p class="ra-actionbar__hint">
        <span class="ra-badge" :class="{ 'ra-badge--gold': VALID_SIZES.includes(selectedCount) }">{{ selectedCount }}</span>
        Scegli 2, 3, 4, 6 o 8 giocatori
      </p>
      <button
        class="ra-btn ra-btn--gold ra-btn--lg ra-btn--block"
        :disabled="starting || !VALID_SIZES.includes(selectedCount)"
        @click="startTournament"
      >
        {{ starting ? '...' : 'AVVIA TORNEO' }}
      </button>
    </div>

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
