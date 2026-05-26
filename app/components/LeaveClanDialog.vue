<script setup lang="ts">
import type { Player } from '~~/shared/types/domain'

defineProps<{ players: Player[] }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', removePlayerId: number | null): void
}>()

// null = esci senza rimuovere player; number = rimuovi quel player + esci
const selected = ref<number | null>(null)
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h2 class="modal-title">Esci dal clan</h2>
      <p class="settings-help">
        Vuoi rimuovere anche il tuo giocatore dal clan? Lo storico delle partite passate resta.
      </p>

      <label class="radio-row">
        <input v-model="selected" type="radio" :value="null" />
        <span>Solo esci (non rimuovere nessun giocatore)</span>
      </label>

      <p v-if="!players.length" class="empty-msg">Nessun giocatore nel clan.</p>
      <div v-else class="leave-clan-players">
        <label v-for="p in players" :key="p.id" class="radio-row">
          <input v-model="selected" type="radio" :value="p.id" />
          <span>
            <strong>{{ p.username }}</strong>
            <span class="players-tag">{{ p.cr_tag }}</span>
          </span>
        </label>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn-cancel" @click="$emit('close')">Annulla</button>
        <button type="button" class="btn-gold" @click="$emit('confirm', selected)">Esci</button>
      </div>
    </div>
  </div>
</template>
