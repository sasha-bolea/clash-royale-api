<script setup lang="ts">
import type { Clan } from '~~/shared/types/domain'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', clan: Clan): void
}>()

const name = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)
const api = useApi()

async function submit() {
  if (!name.value.trim()) return
  error.value = null
  submitting.value = true
  try {
    const clan = await api.createClan(name.value.trim())
    emit('created', clan)
  } catch (err: any) {
    error.value = err?.message ?? 'Errore creazione clan'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <form class="modal" @submit.prevent="submit">
      <h2 class="modal-title">Nuovo clan</h2>
      <label>
        <span>Nome clan</span>
        <input v-model="name" type="text" maxlength="40" required autofocus />
      </label>
      <p v-if="error" class="error-msg">{{ error }}</p>
      <div class="modal-actions">
        <button type="button" class="btn-cancel" @click="$emit('close')">Annulla</button>
        <button type="submit" class="btn-gold" :disabled="submitting">
          {{ submitting ? '...' : 'CREA' }}
        </button>
      </div>
    </form>
  </div>
</template>
