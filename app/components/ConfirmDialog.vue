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
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h2 class="modal-title">{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <button type="button" class="btn-cancel" @click="$emit('close')">Annulla</button>
        <button
          type="button"
          :class="danger ? 'btn-cancel btn-danger' : 'btn-gold'"
          @click="$emit('confirm')"
        >
          {{ confirmLabel ?? 'Conferma' }}
        </button>
      </div>
    </div>
  </div>
</template>
