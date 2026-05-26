<script setup lang="ts">
import type { Player } from '~~/shared/types/domain'

defineProps<{
  clanName: string
  players: Player[]
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'add'): void
}>()
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h2 class="modal-title">Benvenuto in {{ clanName }}</h2>

      <p class="settings-help">
        <template v-if="players.length">
          Questi sono i giocatori del clan. Se non sei tra loro, aggiungiti.
        </template>
        <template v-else>
          Nessun giocatore ancora. Sei il primo? Aggiungiti.
        </template>
      </p>

      <ul v-if="players.length" class="welcome-players">
        <li v-for="p in players" :key="p.id">
          <strong>{{ p.username }}</strong>
          <span class="players-tag">{{ p.cr_tag }}</span>
        </li>
      </ul>

      <div class="modal-actions">
        <button type="button" class="btn-cancel" @click="$emit('close')">Più tardi</button>
        <button type="button" class="btn-gold" @click="$emit('add')">Aggiungiti</button>
      </div>
    </div>
  </div>
</template>
