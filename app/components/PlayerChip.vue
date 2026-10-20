<script setup lang="ts">
import type { Player } from '~~/shared/types/domain'

// Selectable player row for the tournament setup.
// Props: player; trophies — current trophies (or '—' while loading); selected.
// Emits: toggle — user tapped the row.
defineProps<{
  player: Player
  trophies: number | string
  selected: boolean
}>()
defineEmits<{ (e: 'toggle'): void }>()
</script>

<template>
  <button
    class="ra-chip"
    :class="{ 'is-selected': selected }"
    :data-id="player.id"
    :aria-pressed="selected"
    @click="$emit('toggle')"
  >
    <span class="ra-avatar" :class="{ 'ra-avatar--gold': selected }">{{ player.username.charAt(0).toUpperCase() }}</span>
    <span class="ra-chip__body">
      <span class="ra-chip__name">{{ player.username }}</span>
      <span class="ra-chip__tag">{{ player.cr_tag }}</span>
    </span>
    <span class="ra-chip__trophies">
      <img src="/images/ui/trophy.png" alt="" width="18" height="17">
      {{ trophies }}
    </span>
    <span class="ra-chip__check" aria-hidden="true">✓</span>
  </button>
</template>
