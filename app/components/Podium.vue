<script setup lang="ts">
import type { PodiumEntry } from '~~/shared/types/domain'

const props = defineProps<{
  positions: PodiumEntry[]
  pointsByPlace: Record<number, number>
}>()

const medals = ['🥇', '🥈', '🥉', '4°']
function medal(i: number) {
  return medals[i] ?? `${i + 1}°`
}
function points(i: number) {
  return props.pointsByPlace[i + 1] ?? 0
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
        :class="`rank-${i + 1}`"
      >
        <span class="medal">{{ medal(i) }}</span>
        <span class="podio-name">{{ pos.username }}</span>
        <span class="podio-pts">+{{ points(i) }} pt</span>
      </div>
    </div>
    <div class="complete-footer">
      <NuxtLink to="/storico" class="btn-link">Vedi storico →</NuxtLink>
    </div>
  </div>
</template>
