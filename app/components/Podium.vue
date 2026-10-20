<script setup lang="ts">
import type { PodiumEntry } from '~~/shared/types/domain'

const props = defineProps<{
  positions: PodiumEntry[]
  // Partite vinte per player_id nel torneo.
  wins: Record<number, number>
}>()

const emit = defineEmits<{
  // User asked to go back to player selection for a new tournament.
  newTournament: []
}>()

// Clan code from the route, needed to build clan-scoped links.
const { code } = useActiveClan()

// Final place of an entry: shared place for ties, otherwise its index.
function placeOf(pos: PodiumEntry, i: number) {
  return pos.place ?? i + 1
}

// First three entries go on the steps (slot 1 = centre, 2 = left, 3 = right).
const onSteps = computed(() => props.positions.slice(0, 3).map((pos, i) => ({
  pos,
  slot: i + 1,
  place: placeOf(pos, i),
})))

// Everyone from the fourth entry on is listed below the podium.
const others = computed(() => props.positions.slice(3).map((pos, i) => ({
  pos,
  place: placeOf(pos, i + 3),
})))
</script>

<template>
  <div class="complete-view ra-final">
    <p class="ra-display ra-display--lg ra-final__title">TORNEO CONCLUSO</p>

    <div class="ra-panel ra-panel--gold ra-final__stage">
      <div class="ra-final__rays" aria-hidden="true" />
      <div class="ra-podium">
        <div
          v-for="s in onSteps"
          :key="s.pos.player_id"
          class="ra-podium__place"
          :class="`ra-podium__place--${s.slot}`"
        >
          <img v-if="s.slot === 1" class="ra-podium__crown" src="/images/ui/blue-crown.png" alt="">
          <span class="ra-podium__name">{{ s.pos.username }}</span>
          <span class="ra-podium__wins">{{ wins[s.pos.player_id] ?? 0 }} vinte</span>
          <div class="ra-podium__step">{{ s.place }}</div>
        </div>
      </div>
    </div>

    <div v-if="others.length" class="ra-final__others">
      <div v-for="o in others" :key="o.pos.player_id" class="ra-final__row">
        <span class="ra-final__place">{{ o.place }}°</span>
        <span class="ra-final__name">{{ o.pos.username }}</span>
        <span class="ra-podium__wins">{{ wins[o.pos.player_id] ?? 0 }} vinte</span>
      </div>
    </div>

    <div class="ra-final__actions">
      <button class="ra-btn ra-btn--gold ra-btn--lg ra-btn--block" @click="emit('newTournament')">NUOVO TORNEO</button>
      <NuxtLink :to="`/clans/${code}/storico`" class="ra-btn ra-btn--ghost ra-btn--block">Vedi storico →</NuxtLink>
    </div>
  </div>
</template>
