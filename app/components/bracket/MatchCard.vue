<script setup lang="ts">
import type { BracketNode } from '~~/shared/types/domain'
import Slot from './Slot.vue'

const props = defineProps<{ node: BracketNode }>()

const aWin = computed(() => props.node.winnerId != null && props.node.winnerId === props.node.slotA.playerId)
const bWin = computed(() => props.node.winnerId != null && props.node.winnerId === props.node.slotB.playerId)
const decided = computed(() => props.node.winnerId != null)
</script>

<template>
  <div class="bk-match" :class="{ 'bk-suggested': node.suggested }">
    <span v-if="node.suggested" class="bk-match-label bk-suggested-tag">🎲 consigliato</span>
    <span v-else-if="node.label" class="bk-match-label">{{ node.label }}</span>
    <div class="bk-match-box">
      <Slot :slot="node.slotA" :winner="aWin" :loser="decided && !aWin" />
      <div class="bk-match-vs">vs</div>
      <Slot :slot="node.slotB" :winner="bWin" :loser="decided && !bWin" />
    </div>
  </div>
</template>
