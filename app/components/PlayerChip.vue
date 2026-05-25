<script setup lang="ts">
import type { Player } from '~~/shared/types/domain'

defineProps<{
  player: Player
  trophies: number | string
  selected: boolean
}>()
defineEmits<{ (e: 'toggle'): void }>()
</script>

<template>
  <button
    class="player-card"
    :class="{ selected }"
    :data-id="player.id"
    @click="$emit('toggle')"
  >
    <div class="player-info">
      <div class="player-name">{{ player.username }}</div>
      <div class="player-subtag">{{ player.cr_tag }}</div>
    </div>
    <div class="player-pts">&#x1F3C6; {{ trophies }}</div>
  </button>
</template>
