<script setup lang="ts">
defineProps<{
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <div class="ra-modal-overlay" @click.self="$emit('close')">
    <div class="ra-modal ra-pop-in">
      <h2 class="ra-modal__title">{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="ra-modal__actions">
        <button type="button" class="ra-btn ra-btn--ghost" @click="$emit('close')">Indietro</button>
        <button
          type="button"
          :class="danger ? 'ra-btn ra-btn--red' : 'ra-btn ra-btn--gold'"
          @click="$emit('confirm')"
        >
          {{ confirmLabel ?? 'Conferma' }}
        </button>
      </div>
    </div>
  </div>
</template>
