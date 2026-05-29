<script setup lang="ts">
import type { PlayerTournamentStats } from '~/composables/useTournamentStats'

const props = defineProps<{ stats: PlayerTournamentStats; medal?: string }>()
const expanded = ref(false)
const historyOpen = ref(false)

const pct = (v: number) => {
  const n = props.stats.tournamentsPlayed
  return n > 0 ? Math.round((v / n) * 100) : 0
}

const sortedHistory = computed(() =>
  [...props.stats.tournamentHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
)

function positionIcon(pos: number): string {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return `${pos}°`
}
function dateLabel(d: string) {
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
</script>

<template>
  <div class="ts-card" :class="{ expanded }">
    <div class="ts-name" @click="expanded = !expanded">
      <span class="ts-name-left">
        <span v-if="medal" class="ts-medal">{{ medal }}</span>
        <span>{{ stats.username }}</span>
      </span>
      <span class="ts-name-right">
        <span class="ts-pts-preview">{{ stats.totalWins }} vinte</span>
        <span class="card-chevron">▾</span>
      </span>
    </div>
    <div class="ts-body">
      <div class="ts-podium">
        <div class="ts-place">
          <span class="ts-place-icon">🥇</span>
          <span class="ts-place-val">{{ stats.firstPlaces }}</span>
          <span class="ts-place-pct">{{ pct(stats.firstPlaces) }}%</span>
        </div>
        <div class="ts-place">
          <span class="ts-place-icon">🥈</span>
          <span class="ts-place-val">{{ stats.secondPlaces }}</span>
          <span class="ts-place-pct">{{ pct(stats.secondPlaces) }}%</span>
        </div>
        <div class="ts-place">
          <span class="ts-place-icon">🥉</span>
          <span class="ts-place-val">{{ stats.thirdPlaces }}</span>
          <span class="ts-place-pct">{{ pct(stats.thirdPlaces) }}%</span>
        </div>
      </div>
      <div class="ts-matches">
        <div class="ts-match-row">
          <span class="ts-match-lbl">Partite vinte</span>
          <span class="ts-match-val win">{{ stats.wins }}</span>
        </div>
        <div class="ts-match-row">
          <span class="ts-match-lbl">Partite perse</span>
          <span class="ts-match-val loss">{{ stats.losses }}</span>
        </div>
        <div class="ts-match-row highlight">
          <span class="ts-match-lbl">Totale partite vinte</span>
          <span class="ts-match-val gold">{{ stats.totalWins }}</span>
        </div>
        <div
          class="ts-match-row muted ts-trn-toggle"
          :class="{ open: historyOpen }"
          @click="historyOpen = !historyOpen"
        >
          <span class="ts-match-lbl">Tornei disputati</span>
          <span class="ts-match-val ts-trn-toggle-right">
            {{ stats.tournamentsPlayed }}<span class="ts-trn-chevron">▾</span>
          </span>
        </div>
        <div class="ts-trn-history" :class="{ open: historyOpen }">
          <div v-for="h in sortedHistory" :key="h.date" class="ts-trn-row">
            <span class="ts-trn-date">{{ dateLabel(h.date) }}</span>
            <span class="ts-trn-pos">{{ positionIcon(h.position) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
