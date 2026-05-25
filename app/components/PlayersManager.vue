<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Player } from '~~/shared/types/domain'

const props = defineProps<{ clanId: number; isOwner: boolean }>()

const api = useApi()
const { showError } = useToast()
const playerStore = usePlayerStore()
const { allPlayers } = storeToRefs(playerStore)

function onAdded(player: Player) {
  allPlayers.value = [...allPlayers.value, player].sort((a, b) =>
    a.username.localeCompare(b.username),
  )
}

async function remove(playerId: number) {
  if (!confirm('Rimuovere il giocatore dal clan? Lo storico tornei resta.')) return
  try {
    await api.removePlayer(playerId)
    allPlayers.value = allPlayers.value.filter(p => p.id !== playerId)
  } catch (err: any) {
    showError(err?.message ?? 'Errore rimozione')
  }
}
</script>

<template>
  <div class="players-manager">
    <div class="section-label">GIOCATORI DEL CLAN</div>
    <PlayerForm v-if="isOwner" :clan-id="clanId" @added="onAdded" />
    <p v-if="!allPlayers.length" class="empty-msg">
      <template v-if="isOwner">Aggiungi il primo giocatore con il suo tag CR.</template>
      <template v-else>L'owner non ha ancora aggiunto giocatori.</template>
    </p>
    <ul v-else class="players-list-admin">
      <li v-for="p in allPlayers" :key="p.id" class="players-list-row">
        <span class="players-name">{{ p.username }}</span>
        <span class="players-tag">{{ p.cr_tag }}</span>
        <button v-if="isOwner" class="btn-cancel btn-mini" @click="remove(p.id)">×</button>
      </li>
    </ul>
  </div>
</template>
