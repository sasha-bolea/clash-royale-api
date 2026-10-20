<script setup lang="ts">
import type { PlayerTournamentStats } from '~/composables/useTournamentStats'

// Props: stats — aggregated results; rank — position in the clan ranking (1-based).
const props = defineProps<{ stats: PlayerTournamentStats; rank: number }>()
const expanded = ref(false)

const pct = (v: number) => {
  const n = props.stats.tournamentsPlayed
  return n > 0 ? Math.round((v / n) * 100) : 0
}

const sortedHistory = computed(() =>
  [...props.stats.tournamentHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
)

function dateLabel(d: string) {
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
</script>

<template>
  <div class="ra-panel ra-collapse" :class="{ 'is-open': expanded }">
    <button class="ra-collapse__head" :aria-expanded="expanded" @click="expanded = !expanded">
      <span class="ra-place" :class="`ra-place--${rank}`">{{ rank }}</span>
      <span class="ra-collapse__title">{{ stats.username }}</span>
      <span class="ra-collapse__meta">{{ stats.totalWins }} vinte</span>
      <span class="ra-collapse__chev" aria-hidden="true">▾</span>
    </button>
    <div v-if="expanded" class="ra-collapse__body">
      <div class="ra-tstats__places">
        <div v-for="n in [1, 2, 3]" :key="n" class="ra-tstats__place">
          <span class="ra-place" :class="`ra-place--${n}`">{{ n }}</span>
          <span class="ra-stat__value">{{ n === 1 ? stats.firstPlaces : n === 2 ? stats.secondPlaces : stats.thirdPlaces }}</span>
          <span class="ra-stat__label">{{ pct(n === 1 ? stats.firstPlaces : n === 2 ? stats.secondPlaces : stats.thirdPlaces) }}%</span>
        </div>
      </div>

      <dl class="ra-rows">
        <div class="ra-rows__row">
          <dt>Partite vinte</dt>
          <dd class="ra-rows__green">{{ stats.wins }}</dd>
        </div>
        <div class="ra-rows__row">
          <dt>Partite perse</dt>
          <dd class="ra-rows__red">{{ stats.losses }}</dd>
        </div>
        <div class="ra-rows__row">
          <dt>Totale partite vinte</dt>
          <dd class="ra-rows__gold">{{ stats.totalWins }}</dd>
        </div>
      </dl>

      <details class="ra-details">
        <summary class="ra-details__summary">Tornei disputati ({{ stats.tournamentsPlayed }})</summary>
        <div class="ra-details__body">
          <div v-for="h in sortedHistory" :key="h.date" class="ra-rows__row">
            <span>{{ dateLabel(h.date) }}</span>
            <span class="ra-place ra-place--sm" :class="`ra-place--${h.position}`">{{ h.position }}</span>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>
