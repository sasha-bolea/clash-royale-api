<script setup lang="ts">
import type { PodiumEntry } from '~~/shared/types/domain'

const props = defineProps<{
  positions: PodiumEntry[]
  // Partite vinte per player_id nel torneo.
  wins: Record<number, number>
}>()

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
      <NuxtLink to="/storico" class="btn-link">Vedi storico →</NuxtLink>
    </div>
  </div>
</template>
