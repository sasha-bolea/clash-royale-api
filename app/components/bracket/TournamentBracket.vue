<script setup lang="ts">
import type { BracketFormat, Player, Tournament, TournamentMatch } from '~~/shared/types/domain'
import MatchCard from './MatchCard.vue'

const props = defineProps<{
  matches: TournamentMatch[]
  tournament: Tournament
  participants: Player[]
}>()

const VALID: BracketFormat[] = [2, 3, 4, 6, 8]
const format = computed(() => props.participants.length as BracketFormat)
const valid = computed(() => VALID.includes(format.value))

const view = computed(() =>
  valid.value
    ? buildBracketView(props.matches, props.participants, format.value, props.tournament.full_ranking)
    : null,
)

// Albero connesso solo quando i round dimezzano (4: 2→1, 8: 4→2→1).
const connected = computed(() => format.value === 4 || format.value === 8)
</script>

<template>
  <div v-if="view" class="bk-wrap">
    <!-- 6: gironi affiancati -->
    <template v-if="view.format === 6">
      <p v-if="view.groupsPending" class="bk-pending">
        In attesa di partite per identificare i gironi…
      </p>
      <div v-else-if="view.groups" class="bk-groups">
        <div class="bk-group">
          <div class="bk-group-title">Girone A</div>
          <div class="bk-chain">
            <div v-for="r in view.groups[0]" :key="r.id" class="bk-round">
              <MatchCard v-for="m in r.matches" :key="m.id" :node="m" />
            </div>
          </div>
        </div>
        <div class="bk-group">
          <div class="bk-group-title">Girone B</div>
          <div class="bk-chain">
            <div v-for="r in view.groups[1]" :key="r.id" class="bk-round">
              <MatchCard v-for="m in r.matches" :key="m.id" :node="m" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 2/3/4/8: albero principale a colonne -->
    <div v-else class="bk-tree" :class="{ 'bk-connected': connected }">
      <div v-for="r in view.rounds" :key="r.id" class="bk-round">
        <div class="bk-round-title">{{ r.label }}</div>
        <div class="bk-round-matches">
          <div v-for="m in r.matches" :key="m.id" class="bk-cell">
            <MatchCard :node="m" />
          </div>
        </div>
      </div>
    </div>

    <!-- extra: finalina, consolazione, incrocio -->
    <div v-if="view.extras && view.extras.length" class="bk-extras">
      <div v-for="ex in view.extras" :key="ex.id" class="bk-extra">
        <div class="bk-extra-title">{{ ex.label }}</div>
        <div class="bk-extra-matches">
          <MatchCard v-for="m in ex.matches" :key="m.id" :node="m" />
        </div>
      </div>
    </div>
  </div>
</template>
