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
  <div class="ra-modal-overlay" @click.self="$emit('close')">
    <div class="ra-modal ra-pop-in">
      <h2 class="ra-modal__title">Esci dal clan</h2>
      <p class="ra-settings__help">
        Vuoi rimuovere anche il tuo giocatore dal clan? Lo storico delle partite passate resta.
      </p>

      <label class="ra-radio">
        <input v-model="selected" type="radio" :value="null" />
        <span>Solo esci (non rimuovere nessun giocatore)</span>
      </label>

      <p v-if="!players.length" class="ra-waiting">Nessun giocatore nel clan.</p>
      <div v-else class="ra-settings__players ra-settings__players--scroll">
        <label v-for="p in players" :key="p.id" class="ra-radio">
          <input v-model="selected" type="radio" :value="p.id" />
          <span class="ra-settings__player-name">{{ p.username }}</span>
          <span class="ra-chip__tag">{{ p.cr_tag }}</span>
        </label>
      </div>

      <div class="ra-modal__actions">
        <button type="button" class="ra-btn ra-btn--ghost" @click="$emit('close')">Annulla</button>
        <button type="button" class="ra-btn ra-btn--red" @click="$emit('confirm', selected)">Esci</button>
      </div>
    </div>
  </div>
</template>
