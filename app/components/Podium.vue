<script setup lang="ts">
import type { PodiumEntry } from '~~/shared/types/domain'

const props = defineProps<{
  positions: PodiumEntry[]
  // Partite vinte per player_id nel torneo.
  wins: Record<number, number>
}>()

const emit = defineEmits<{
  // User asked to go back to player selection for a new tournament.
  newTournament: []
}>()

// Clan code from the route, needed to build clan-scoped links.
const { code } = useActiveClan()

const medals = ['🥇', '🥈', '🥉']
// Posizione finale: usa place (pari merito condivisi) o indice.
function medal(pos: PodiumEntry, i: number) {
  const place = pos.place ?? i + 1
  return medals[place - 1] ?? `${place}°`
}
</script>

<template>
  <div class="complete-view">
    <div class="complete-title">TORNEO CONCLUSO</div>
    <div class="podio">
      <div
        v-for="(pos, i) in positions"
        :key="pos.player_id"
        class="podio-row"
        :class="`rank-${pos.place ?? i + 1}`"
      >
        <span class="medal">{{ medal(pos, i) }}</span>
        <span class="podio-name">{{ pos.username }}</span>
        <span class="podio-pts">{{ wins[pos.player_id] ?? 0 }} vinte</span>
      </div>
    </div>
    <div class="complete-footer">
      <button class="btn-start" @click="emit('newTournament')">NUOVO TORNEO</button>
      <NuxtLink :to="`/clans/${code}/storico`" class="btn-link">Vedi storico →</NuxtLink>
    </div>
  </div>
</template>
