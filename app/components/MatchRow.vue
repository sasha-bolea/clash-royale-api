<script setup lang="ts">
import type { TournamentMatch } from '~~/shared/types/domain'

const props = defineProps<{ match: TournamentMatch; index: number }>()

const p1Winner = computed(() => props.match.winner_id === props.match.player1?.id)
const p2Winner = computed(() => props.match.winner_id === props.match.player2?.id)
</script>

<template>
  <div class="match-row">
    <span class="match-num">{{ index + 1 }}</span>
    <span class="match-players">
      <span :class="p1Winner ? 'winner' : 'loser'">{{ match.player1?.username }}</span>
      <span class="vs">vs</span>
      <span :class="p2Winner ? 'winner' : 'loser'">{{ match.player2?.username }}</span>
      <span class="crowns">{{ match.crowns_p1 }}-{{ match.crowns_p2 }} &#x1F451;</span>
    </span>
  </div>
</template>
