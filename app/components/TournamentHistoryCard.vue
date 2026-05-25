<script setup lang="ts">
import type { Tournament } from '~~/shared/types/domain'

const props = defineProps<{ tournament: Tournament }>()

const dateLabel = computed(() =>
  new Date(props.tournament.started_at).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  }),
)
const timeLabel = computed(() =>
  new Date(props.tournament.started_at).toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit',
  }),
)
const typeLabel = computed(() => props.tournament.match_type.toUpperCase())
const isInvalid = computed(() => props.tournament.status === 'invalid')
const playersLabel = computed(() =>
  (props.tournament.tournament_players ?? [])
    .map(tp => tp.players.username)
    .join(', '),
)
const matches = computed(() => props.tournament.tournament_matches ?? [])
</script>

<template>
  <div class="tournament-card" :class="{ invalid: isInvalid }">
    <div class="card-header">
      <span class="card-date">{{ dateLabel }} {{ timeLabel }}</span>
      <span class="card-badge">
        {{ typeLabel }}
        <template v-if="isInvalid"> &mdash; <span class="badge-invalid">annullato</span></template>
      </span>
    </div>
    <div class="card-players">{{ playersLabel }}</div>
    <div class="card-matches">
      <template v-if="matches.length">
        <div v-for="m in matches" :key="m.id" class="hist-match">
          {{ m.player1?.username }} vs {{ m.player2?.username }}
          &mdash; <strong>{{ m.winner?.username }}</strong> vince
        </div>
      </template>
      <div v-else class="hist-match empty-msg">Nessuna partita registrata</div>
    </div>
  </div>
</template>
