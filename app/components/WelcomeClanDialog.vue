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
  <div class="ra-modal-overlay" @click.self="$emit('close')">
    <div class="ra-modal ra-pop-in">
      <h2 class="ra-modal__title">Benvenuto in {{ clanName }}</h2>

      <p class="ra-settings__help">
        <template v-if="players.length">
          Questi sono i giocatori del clan. Se non sei tra loro, aggiungiti.
        </template>
        <template v-else>
          Nessun giocatore ancora. Sei il primo? Aggiungiti.
        </template>
      </p>

      <ul v-if="players.length" class="ra-settings__players ra-settings__players--scroll">
        <li v-for="p in players" :key="p.id" class="ra-settings__player">
          <span class="ra-avatar ra-avatar--sm">{{ p.username.charAt(0).toUpperCase() }}</span>
          <span class="ra-settings__player-name">{{ p.username }}</span>
          <span class="ra-chip__tag">{{ p.cr_tag }}</span>
        </li>
      </ul>

      <div class="ra-modal__actions">
        <button type="button" class="ra-btn ra-btn--ghost" @click="$emit('close')">Più tardi</button>
        <button type="button" class="ra-btn ra-btn--gold" @click="$emit('add')">Aggiungiti</button>
      </div>
    </div>
  </div>
</template>
