<script setup lang="ts">
import type { TournamentMatch } from '~~/shared/types/domain'

// One detected match: player 1 (blue) vs player 2 (red) with crowns.
// Props: match; index — position in the list (unused in the layout, kept for callers).
const props = defineProps<{ match: TournamentMatch; index: number }>()

// Compare on the raw ids: history queries embed players without their id.
const p1Winner = computed(() => props.match.winner_id === props.match.player1_id)
const p2Winner = computed(() => props.match.winner_id === props.match.player2_id)
</script>

<template>
  <div class="ra-match">
    <div class="ra-match__side" :class="{ 'is-winner': p1Winner }">
      <span class="ra-match__name">{{ match.player1?.username }}</span>
    </div>
    <div class="ra-match__score">
      <img class="ra-match__crown" src="/images/ui/blue-crown.png" alt="">
      {{ match.crowns_p1 }}-{{ match.crowns_p2 }}
      <img class="ra-match__crown" src="/images/ui/red-crown.png" alt="">
    </div>
    <div class="ra-match__side ra-match__side--right" :class="{ 'is-winner': p2Winner }">
      <span class="ra-match__name">{{ match.player2?.username }}</span>
    </div>
  </div>
</template>
