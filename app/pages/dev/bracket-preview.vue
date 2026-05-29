<script setup lang="ts">
import type { BracketFormat, Player, Tournament, TournamentMatch } from '~~/shared/types/domain'
import TournamentBracket from '~/components/bracket/TournamentBracket.vue'

// Pagina di sviluppo per verificare il riempimento progressivo del bracket.
// Solo dev: in produzione non renderizza nulla.
const isDev = import.meta.dev

function mkPlayer(id: number): Player {
  return { id, clan_id: 1, username: `P${id}`, cr_tag: `#P${id}`, created_at: '' }
}
const allPlayers = Array.from({ length: 8 }, (_, i) => mkPlayer(i + 1))

let counter = 0
function mk(p1: number, p2: number, winner: number): TournamentMatch {
  counter++
  const t = new Date(Date.UTC(2026, 0, 1, 0, counter)).toISOString()
  const u = (id: number) => ({ id, username: `P${id}`, cr_tag: `#P${id}` })
  return {
    id: counter,
    tournament_id: 1,
    player1_id: p1,
    player2_id: p2,
    winner_id: winner,
    crowns_p1: winner === p1 ? 3 : 1,
    crowns_p2: winner === p2 ? 3 : 1,
    played_at: t,
    cr_battle_id: `b${counter}`,
    player1: u(p1),
    player2: u(p2),
    winner: { id: winner, username: `P${winner}` },
  }
}

// Sequenze valide per (formato, fullRanking).
function sequence(format: BracketFormat, full: boolean): TournamentMatch[] {
  counter = 0
  switch (format) {
    case 2: return [mk(1, 2, 1)]
    case 3: return [mk(1, 2, 1), mk(2, 3, 3), mk(1, 3, 1)]
    case 4: {
      const base = [mk(1, 2, 1), mk(3, 4, 3), mk(1, 3, 1)]
      return full ? [...base, mk(2, 4, 2)] : base
    }
    case 6: {
      const groups = [
        mk(1, 2, 1), mk(2, 3, 3), mk(1, 3, 1), // girone A → rank [1,3,2]
        mk(4, 5, 4), mk(5, 6, 6), mk(4, 6, 4), // girone B → rank [4,6,5]
      ]
      const cross = full
        ? [mk(1, 4, 1), mk(3, 6, 3), mk(2, 5, 2)]
        : [mk(1, 4, 1)]
      return [...groups, ...cross]
    }
    case 8: {
      const main = [
        mk(1, 2, 1), mk(3, 4, 3), mk(5, 6, 5), mk(7, 8, 7), // quarti
        mk(1, 3, 1), mk(5, 7, 5),                            // semi
        mk(1, 5, 1),                                         // finale
      ]
      const third = full ? [mk(3, 7, 3)] : []               // finalina solo se full
      const cons = full
        ? [mk(2, 4, 2), mk(6, 8, 6), mk(2, 6, 2), mk(4, 8, 4)]
        : []
      return [...main, ...third, ...cons]
    }
  }
}

const format = ref<BracketFormat>(8)
const full = ref(true)
const step = ref(0)

const fullSeq = computed(() => sequence(format.value, full.value))
const shown = computed(() => fullSeq.value.slice(0, step.value))
const participants = computed(() => allPlayers.slice(0, format.value))

const tournament = computed<Tournament>(() => ({
  id: 1, clan_id: 1, match_type: 'amichevole', status: 'active',
  full_ranking: full.value, started_at: '', finished_at: null,
}))

watch([format, full], () => { step.value = 0 })
function advance() { if (step.value < fullSeq.value.length) step.value++ }
function reset() { step.value = 0 }
function fill() { step.value = fullSeq.value.length }
</script>

<template>
  <main v-if="isDev" style="padding:16px">
    <h2 style="font-family:'Lilita One',cursive">Bracket preview (dev)</h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
      <select v-model.number="format">
        <option :value="2">2</option>
        <option :value="3">3</option>
        <option :value="4">4</option>
        <option :value="6">6</option>
        <option :value="8">8</option>
      </select>
      <label><input v-model="full" type="checkbox"> full_ranking</label>
      <button @click="advance">Avanza ({{ step }}/{{ fullSeq.length }})</button>
      <button @click="fill">Completa</button>
      <button @click="reset">Reset</button>
    </div>
    <TournamentBracket :matches="shown" :tournament="tournament" :participants="participants" />
  </main>
  <main v-else style="padding:16px">Solo in sviluppo.</main>
</template>
