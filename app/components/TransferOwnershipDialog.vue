<script setup lang="ts">
import type { ClanMember } from '~~/shared/types/domain'

const props = defineProps<{
  members: ClanMember[]
  currentOwnerId: string
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', newOwnerId: string): void
}>()

const candidates = computed(() => props.members.filter(m => m.user_id !== props.currentOwnerId))
const selected = ref<string>('')
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h2 class="modal-title">Trasferisci ownership</h2>
      <p v-if="!candidates.length" class="empty-msg">
        Nessun altro membro nel clan. Aggiungi qualcuno prima di trasferire.
      </p>
      <template v-else>
        <p>Seleziona il nuovo owner. Perderai i permessi di gestione.</p>
        <label v-for="m in candidates" :key="m.user_id" class="radio-row">
          <input v-model="selected" type="radio" :value="m.user_id" />
          <span>{{ m.user_id.slice(0, 8) }}…</span>
        </label>
      </template>
      <div class="modal-actions">
        <button type="button" class="btn-cancel" @click="$emit('close')">Annulla</button>
        <button
          type="button"
          class="btn-gold"
          :disabled="!selected"
          @click="$emit('confirm', selected)"
        >Trasferisci</button>
      </div>
    </div>
  </div>
</template>
