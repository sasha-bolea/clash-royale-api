<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Player } from '~~/shared/types/domain'

const props = defineProps<{ clanId: number }>()

const playerStore = usePlayerStore()
const { allPlayers } = storeToRefs(playerStore)

const showAdd = ref(false)

function onAdded(player: Player) {
  allPlayers.value = [...allPlayers.value, player].sort((a, b) =>
    a.username.localeCompare(b.username),
  )
}
</script>

<template>
  <div class="players-manager">
    <button class="ra-btn ra-btn--block add-player-btn" @click="showAdd = true">
      + Aggiungi giocatore
    </button>

    <AddPlayerModal
      v-if="showAdd"
      :clan-id="clanId"
      @close="showAdd = false"
      @added="onAdded"
    />
  </div>
</template>
