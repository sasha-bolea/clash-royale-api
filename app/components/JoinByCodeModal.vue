<script setup lang="ts">
import type { Clan } from '~~/shared/types/domain'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'joined', clan: Clan): void
}>()

const code = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)
const api = useApi()
const session = useBrowserSession()

async function submit() {
  if (!code.value.trim()) return
  error.value = null
  submitting.value = true
  try {
    const clean = code.value.trim().toUpperCase()
    const clan = await api.getClanByCode(clean)
    if (!clan) {
      error.value = 'Codice non valido'
      return
    }
    session.addClan({
      clan_id: clan.id,
      code: clan.code,
      name: clan.name,
      joined_at: new Date().toISOString(),
    })
    emit('joined', clan)
    await navigateTo(`/clans/${clan.code}/torneo`)
  } catch (err: any) {
    error.value = err?.message ?? 'Errore'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <form class="modal" @submit.prevent="submit">
      <h2 class="modal-title">Entra con codice</h2>
      <label>
        <span>Codice clan</span>
        <input
          v-model="code"
          type="text"
          maxlength="6"
          required
          autofocus
          style="text-transform: uppercase; letter-spacing: 2px"
        />
      </label>
      <p v-if="error" class="error-msg">{{ error }}</p>
      <div class="modal-actions">
        <button type="button" class="btn-cancel" @click="$emit('close')">Annulla</button>
        <button type="submit" class="btn-gold" :disabled="submitting">
          {{ submitting ? '...' : 'ENTRA' }}
        </button>
      </div>
    </form>
  </div>
</template>
