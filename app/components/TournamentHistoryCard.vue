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
const players = computed(() => (props.tournament.tournament_players ?? []).map(tp => tp.players))
const matches = computed(() => props.tournament.tournament_matches ?? [])
</script>

<template>
  <article class="ra-panel ra-history" :class="{ 'is-invalid': isInvalid }">
    <header class="ra-history__head">
      <div>
        <p class="ra-history__date">{{ dateLabel }}</p>
        <p class="ra-history__time">{{ timeLabel }}</p>
      </div>
      <span v-if="isInvalid" class="ra-badge ra-badge--red">ANNULLATO</span>
      <span v-else class="ra-badge">{{ typeLabel }}</span>
    </header>
    <div class="ra-history__players ra-strip">
      <span v-for="p in players" :key="p.id" class="ra-pill">
        <span class="ra-avatar ra-avatar--sm">{{ p.username.charAt(0).toUpperCase() }}</span>
        {{ p.username }}
      </span>
    </div>
    <div v-if="matches.length" class="ra-history__matches">
      <MatchRow v-for="(m, i) in matches" :key="m.id" :match="m" :index="i" />
    </div>
    <p v-else class="ra-waiting">Nessuna partita registrata</p>
  </article>
</template>
