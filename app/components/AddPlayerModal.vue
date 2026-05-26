<script setup lang="ts">
import type { Player } from '~~/shared/types/domain'

const props = defineProps<{ clanId: number }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'added', player: Player): void
}>()

const api = useApi()
const { showError } = useToast()

const crTag = ref('')
const fetchedName = ref('')
const checking = ref(false)
const adding = ref(false)
const lookupError = ref<string | null>(null)

let lookupTimer: ReturnType<typeof setTimeout> | null = null

watch(crTag, (val) => {
  if (lookupTimer) clearTimeout(lookupTimer)
  lookupError.value = null
  fetchedName.value = ''
  const cleaned = val.replace('#', '').trim()
  if (cleaned.length < 4) return
  lookupTimer = setTimeout(async () => {
    checking.value = true
    try {
      const profile = await api.getPlayerProfile(cleaned)
      fetchedName.value = profile.name
    } catch {
      lookupError.value = 'Tag CR non trovato'
    } finally {
      checking.value = false
    }
  }, 500)
})

async function submit() {
  if (!fetchedName.value || !crTag.value) return
  adding.value = true
  try {
    const player = await api.addPlayer(
      props.clanId,
      fetchedName.value,
      '#' + crTag.value.replace('#', '').toUpperCase(),
    )
    emit('added', player)
    emit('close')
  } catch (err: any) {
    showError(err?.message ?? 'Errore aggiunta giocatore')
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <form class="modal" @submit.prevent="submit">
      <h2 class="modal-title">Aggiungi giocatore</h2>

      <label>
        <span>Tag Clash Royale</span>
        <input
          v-model="crTag"
          type="text"
          placeholder="es. 2QC02PRC0"
          maxlength="15"
          required
          autofocus
          style="text-transform: uppercase; letter-spacing: 1px"
        />
      </label>

      <div class="add-player-feedback">
        <p v-if="checking" class="loading-inline">
          <span class="spinner"></span> Cerco {{ crTag }}...
        </p>
        <p v-else-if="fetchedName" class="player-form-found">
          Trovato: <strong>{{ fetchedName }}</strong>
        </p>
        <p v-else-if="lookupError" class="error-msg">{{ lookupError }}</p>
      </div>

      <details class="add-player-help">
        <summary>Come trovo il mio tag?</summary>
        <ol class="add-player-steps">
          <li>Apri <strong>Clash Royale</strong></li>
          <li>Tocca il tuo nome in alto a sinistra (accanto alle coppe)</li>
          <li>Sotto il nome appare il tag, formato <code>#XXXXXXX</code></li>
          <li>Toccalo per copiarlo, poi incollalo qui sopra</li>
        </ol>
        <p class="add-player-note">
          Il tag è univoco e non cambia mai. Puoi inserirlo con o senza <code>#</code>.
        </p>
      </details>

      <div class="modal-actions">
        <button type="button" class="btn-cancel" @click="$emit('close')">Annulla</button>
        <button
          type="submit"
          class="btn-gold"
          :disabled="adding || checking || !fetchedName"
        >
          {{ adding ? '...' : 'AGGIUNGI' }}
        </button>
      </div>
    </form>
  </div>
</template>
