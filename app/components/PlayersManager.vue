<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Player } from '~~/shared/types/domain'

const props = defineProps<{ clanId: number }>()

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
  if (!confirm('Rimuovere il giocatore? Se è l\'ultimo, anche il clan viene eliminato.')) return
  try {
    await api.removePlayer(playerId)
    allPlayers.value = allPlayers.value.filter(p => p.id !== playerId)
    // Se la lista è vuota, il trigger DB ha già eliminato il clan
    if (allPlayers.value.length === 0) {
      useClanStore().reset()
      await navigateTo('/', { replace: true })
    }
  } catch (err: any) {
    showError(err?.message ?? 'Errore rimozione')
  }
}
</script>

<template>
  <div class="players-manager">
    <div class="section-label">GIOCATORI DEL CLAN</div>
    <PlayerForm :clan-id="clanId" @added="onAdded" />
    <p v-if="!allPlayers.length" class="empty-msg">
      Aggiungi il primo giocatore con il suo tag CR.
    </p>
    <ul v-else class="players-list-admin">
      <li v-for="p in allPlayers" :key="p.id" class="players-list-row">
        <span class="players-name">{{ p.username }}</span>
        <span class="players-tag">{{ p.cr_tag }}</span>
        <button class="btn-cancel btn-mini" @click="remove(p.id)">×</button>
      </li>
    </ul>
  </div>
</template>
