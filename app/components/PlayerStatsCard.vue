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
  <div class="stat-card" :class="{ expanded }" :id="`card-${player.id}`">
    <div class="card-top" @click="expanded = !expanded">
      <div class="card-name">{{ player.username }}</div>
      <span class="card-chevron">▾</span>
    </div>
    <div class="card-body" :class="{ 'loading-inline': loading }">
      <template v-if="loading">
        <span class="spinner"></span> Caricamento...
      </template>
      <p v-else-if="error" class="error-inline">Errore API: {{ error }}</p>
      <template v-else-if="data">
        <div class="level-trophy-row">
          <div class="level-badge">
            <span class="level-num-plain">Lv {{ data.expLevel }}</span>
          </div>
          <div class="trophy-block">
            <span class="trophy-icon">🏆</span>
            <span class="trophy-val">{{ fmt(data.trophies) }}</span>
            <span class="trophy-best">max {{ fmt(data.bestTrophies) }}</span>
          </div>
        </div>

        <div class="stats-grid-inner">
          <div class="stat-box">
            <div class="stat-box-val">{{ fmt(data.wins) }}</div>
            <div class="stat-box-lbl">Vittorie</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-val">{{ winRate }}%</div>
            <div class="stat-box-lbl">Win Rate</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-val">{{ fmt(data.threeCrownWins) }}</div>
            <div class="stat-box-lbl">3 Corone</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-val">{{ fmt(data.battleCount) }}</div>
            <div class="stat-box-lbl">Partite</div>
          </div>
        </div>

        <div v-if="data.arena" class="stat-row">
          <span class="stat-lbl">Arena</span>
          <span class="stat-val">{{ data.arena.name }}</span>
        </div>
        <div v-if="data.clan" class="stat-row">
          <span class="stat-lbl">Clan</span>
          <span class="stat-val clan-name">{{ data.clan.name }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
