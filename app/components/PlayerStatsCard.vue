<script setup lang="ts">
import type { Player, CRPlayerProfile } from '~~/shared/types/domain'

const props = defineProps<{ player: Player }>()

const api = useApi()
const data = ref<CRPlayerProfile | null>(null)
const error = ref<string | null>(null)
const loading = ref(true)
const expanded = ref(false)

const winRate = computed(() => {
  if (!data.value || data.value.battleCount <= 0) return 0
  return Math.round((data.value.wins / data.value.battleCount) * 100)
})

onMounted(async () => {
  try {
    data.value = await api.getPlayerProfile(props.player.cr_tag)
  } catch (err: any) {
    error.value = err?.message ?? String(err)
  } finally {
    loading.value = false
  }
})

function fmt(n: number) {
  return n.toLocaleString('it-IT')
}
</script>

<template>
  <div class="ra-panel ra-collapse" :class="{ 'is-open': expanded }" :id="`card-${player.id}`">
    <button class="ra-collapse__head" :aria-expanded="expanded" @click="expanded = !expanded">
      <span class="ra-avatar">{{ player.username.charAt(0).toUpperCase() }}</span>
      <span class="ra-collapse__title">{{ player.username }}</span>
      <span v-if="data" class="ra-chip__trophies">
        <img src="/images/ui/trophy.png" alt="" width="18" height="17">
        {{ fmt(data.trophies) }}
      </span>
      <span class="ra-collapse__chev" aria-hidden="true">▾</span>
    </button>
    <div v-if="expanded" class="ra-collapse__body">
      <p v-if="loading" class="loading-inline"><span class="spinner"></span> Caricamento...</p>
      <p v-else-if="error" class="error-inline">Errore API: {{ error }}</p>
      <template v-else-if="data">
        <div class="ra-pstats__top">
          <span class="ra-badge ra-badge--gold">LIVELLO {{ data.expLevel }}</span>
          <span class="ra-pstats__best">Record: {{ fmt(data.bestTrophies) }}</span>
        </div>

        <div class="ra-pstats__grid">
          <div class="ra-stat">
            <img class="ra-stat__icon" src="/images/ui/blue-crown.png" alt="">
            <span class="ra-stat__value">{{ fmt(data.wins) }}</span>
            <span class="ra-stat__label">Vittorie</span>
          </div>
          <div class="ra-stat">
            <img class="ra-stat__icon" src="/images/ui/crown-shield.png" alt="">
            <span class="ra-stat__value">{{ winRate }}%</span>
            <span class="ra-stat__label">Win rate</span>
          </div>
          <div class="ra-stat">
            <img class="ra-stat__icon" src="/images/ui/red-crown.png" alt="">
            <span class="ra-stat__value">{{ fmt(data.threeCrownWins) }}</span>
            <span class="ra-stat__label">3 corone</span>
          </div>
          <div class="ra-stat">
            <img class="ra-stat__icon" src="/images/ui/battle.png" alt="">
            <span class="ra-stat__value">{{ fmt(data.battleCount) }}</span>
            <span class="ra-stat__label">Partite</span>
          </div>
        </div>

        <dl class="ra-rows">
          <div v-if="data.arena" class="ra-rows__row">
            <dt>Arena</dt>
            <dd>{{ data.arena.name }}</dd>
          </div>
          <div v-if="data.clan" class="ra-rows__row">
            <dt>Clan in gioco</dt>
            <dd class="ra-rows__gold">{{ data.clan.name }}</dd>
          </div>
        </dl>
      </template>
    </div>
  </div>
</template>
