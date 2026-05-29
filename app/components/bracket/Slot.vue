<script setup lang="ts">
import type { BracketSlot } from '~~/shared/types/domain'

defineProps<{
  slot: BracketSlot
  winner?: boolean
  loser?: boolean
}>()
</script>

<template>
  <div class="bk-slot" :class="{ 'bk-slot-win': winner, 'bk-slot-lose': loser, 'bk-slot-empty': slot.playerId == null }">
    <span class="bk-slot-name">{{ slot.username ?? '?' }}</span>
    <span v-if="winner" class="bk-slot-check">👑</span>
  </div>
</template>
