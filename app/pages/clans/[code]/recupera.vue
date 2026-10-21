<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Tournament, TournamentMatch } from '~~/shared/types/domain'
import TournamentBracket from '~/components/bracket/TournamentBracket.vue'

// Registra un torneo giocato senza averlo avviato: si scelgono le partite 1v1
// recenti tra membri del clan (non già in un torneo valido); la selezione è
// valida solo se forma un tabellone completo nell'ordine in cui è stata giocata.
definePageMeta({ middleware: ['clan-access'] })

const { clan, clanId } = useActiveClan()
const api = useApi()
const { showToast, showError } = useToast()
const playerStore = usePlayerStore()
const { allPlayers } = storeToRefs(playerStore)

useHead(() => ({ title: clan.value ? `${clan.value.name} — Torneo passato` : 'Torneo passato' }))

const loading = ref(true)
const saving = ref(false)
const blockedByActive = ref(false)
const candidates = ref<TournamentMatch[]>([])
const failedPlayers = ref<string[]>([])
const selectedIds = ref<Set<number>>(new Set())

const selected = computed(() => candidates.value.filter(c => selectedIds.value.has(c.id)))
const validation = computed(() =>
  selected.value.length ? validatePastTournament(selected.value, allPlayers.value) : null,
)
const winnerName = computed(() => {
  const v = validation.value
  if (!v?.ok) return ''
  return v.positions.filter((p, i) => (p.place ?? i + 1) === 1).map(p => p.username).join(' · ')
})

// Bracket preview of the valid selection (same component as the live tournament).
const preview = computed(() => {
  const v = validation.value
  if (!v?.ok) return null
  const participants = allPlayers.value.filter(p => v.playerIds.includes(p.id))
  return {
    participants,
    tournament: { id: 0, clan_id: clanId.value ?? 0, match_type: 'amichevole', status: 'finished', full_ranking: v.fullRanking, started_at: '' } as Tournament,
  }
})

// Candidates grouped by day for the list (most recent day first).
const days = computed(() => {
  const groups: { label: string; items: TournamentMatch[] }[] = []
  for (const c of candidates.value) {
    const label = new Date(c.played_at).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
    const g = groups[groups.length - 1]
    if (g?.label === label) g.items.push(c)
    else groups.push({ label, items: [c] })
  }
  return groups
})

// Time of a match, e.g. "16:42".
function timeLabel(m: TournamentMatch) {
  return new Date(m.played_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

// Adds or removes a match from the selection.
function toggle(id: number) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedIds.value = s
}

// Loads clan players, the battlelog of each one and the battles already used.
async function load() {
  if (!clanId.value) return
  loading.value = true
  try {
    await playerStore.loadAll(clanId.value)
    if (await api.getActiveTournament(clanId.value)) {
      blockedByActive.value = true
      return
    }
    const [used, logs] = await Promise.all([
      api.getUsedBattleIds(clanId.value),
      Promise.allSettled(allPlayers.value.map(p => api.getBattlelog(p.cr_tag))),
    ])
    failedPlayers.value = allPlayers.value.filter((_, i) => logs[i]!.status === 'rejected').map(p => p.username)
    const ok = logs.flatMap(r => (r.status === 'fulfilled' ? [r.value] : []))
    candidates.value = findCandidateBattles(ok, allPlayers.value, used)
  } catch (err: any) {
    showError('Errore caricamento partite: ' + (err?.message ?? err))
  } finally {
    loading.value = false
  }
}

// Stores the tournament and opens the history.
async function save() {
  const v = validation.value
  if (!v?.ok || !clanId.value || !clan.value) return
  saving.value = true
  try {
    await api.savePastTournament(clanId.value, v.playerIds, v.fullRanking, selected.value)
    await playerStore.loadAll(clanId.value, true)
    showToast('Torneo registrato')
    await navigateTo(`/clans/${clan.value.code}/storico`)
  } catch (err: any) {
    showError('Errore salvataggio: ' + (err?.message ?? err))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="clan-page">
    <PageHeader title="Torneo passato" :back-to="clan ? `/clans/${clan.code}/torneo` : '/'" />

    <main>
      <SkeletonList v-if="loading" :count="5" :height="56" />

      <EmptyState
        v-else-if="blockedByActive"
        icon="/images/ui/tournament.png"
        title="C'è un torneo in corso"
        text="Puoi registrare un torneo passato solo quando non ce n'è uno in corso."
      >
        <NuxtLink v-if="clan" :to="`/clans/${clan.code}/torneo`" class="ra-btn ra-btn--gold">Vai all'Arena</NuxtLink>
      </EmptyState>

      <template v-else>
        <p class="ra-settings__help ra-past__intro">
          Seleziona le partite del torneo che avete giocato senza avviarlo. Clash Royale conserva solo
          le ultime 25 battaglie di ogni giocatore: i tornei troppo vecchi non si possono più recuperare.
        </p>
        <p v-if="failedPlayers.length" class="ra-past__warn">
          Non sono riuscito a leggere le partite di: {{ failedPlayers.join(', ') }}.
        </p>

        <EmptyState
          v-if="!candidates.length"
          icon="/images/ui/battle.png"
          title="Nessuna partita disponibile"
          text="Non ci sono partite recenti tra giocatori del clan che non facciano già parte di un torneo."
        />

        <section v-for="d in days" :key="d.label" class="ra-past__day">
          <p class="ra-label">{{ d.label }}</p>
          <button
            v-for="c in d.items"
            :key="c.id"
            class="ra-pick"
            :class="{ 'is-selected': selectedIds.has(c.id) }"
            :aria-pressed="selectedIds.has(c.id)"
            @click="toggle(c.id)"
          >
            <span class="ra-pick__time">{{ timeLabel(c) }}</span>
            <MatchRow :match="c" :index="0" class="ra-pick__match" />
            <span class="ra-chip__check" aria-hidden="true">✓</span>
          </button>
        </section>

        <!-- Sotto la lista: comparendo non sposta le partite mentre le selezioni -->
        <div v-if="preview" class="ra-past__preview ra-pop-in">
          <p class="ra-label">Anteprima tabellone</p>
          <TournamentBracket
            :matches="selected"
            :tournament="preview.tournament"
            :participants="preview.participants"
            :full-ranking="preview.tournament.full_ranking ?? false"
          />
        </div>
      </template>
    </main>

    <div v-if="!loading && !blockedByActive && candidates.length" class="ra-actionbar">
      <p v-if="!validation" class="ra-actionbar__hint">Tocca le partite del torneo</p>
      <p v-else-if="!validation.ok" class="ra-actionbar__hint ra-past__error">{{ validation.error }}</p>
      <p v-else class="ra-actionbar__hint">
        <span class="ra-badge ra-badge--gold">{{ validation.size }} giocatori</span>
        Vince <strong class="ra-past__winner">{{ winnerName }}</strong>
      </p>
      <button
        class="ra-btn ra-btn--gold ra-btn--lg ra-btn--block"
        :disabled="saving || !validation?.ok"
        @click="save"
      >
        {{ saving ? '...' : 'REGISTRA TORNEO' }}
      </button>
    </div>
  </div>
</template>
