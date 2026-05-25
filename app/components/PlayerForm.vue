<script setup lang="ts">
import type { Player } from '~~/shared/types/domain'

const props = defineProps<{ clanId: number }>()
const emit = defineEmits<{ (e: 'added', player: Player): void }>()

const api = useApi()
const { showError } = useToast()

const crTag = ref('')
const username = ref('')
const checking = ref(false)
const adding = ref(false)
const lookupError = ref<string | null>(null)

let lookupTimer: ReturnType<typeof setTimeout> | null = null

// Lookup auto del nome CR quando il tag ha lunghezza plausibile
watch(crTag, (val) => {
  if (lookupTimer) clearTimeout(lookupTimer)
  lookupError.value = null
  const cleaned = val.replace('#', '').trim()
  if (cleaned.length < 4) {
    username.value = ''
    return
  }
  lookupTimer = setTimeout(async () => {
    checking.value = true
    try {
      const profile = await api.getPlayerProfile(cleaned)
      username.value = profile.name
    } catch (err: any) {
      lookupError.value = 'Tag CR non trovato'
      username.value = ''
    } finally {
      checking.value = false
    }
  }, 500)
})

async function submit() {
  if (!username.value || !crTag.value) return
  adding.value = true
  try {
    const player = await api.addPlayer(props.clanId, username.value, '#' + crTag.value.replace('#', '').toUpperCase())
    emit('added', player)
    crTag.value = ''
    username.value = ''
  } catch (err: any) {
    showError(err?.message ?? 'Errore aggiunta giocatore')
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <form class="player-form" @submit.prevent="submit">
    <div class="player-form-row">
      <input
        v-model="crTag"
        type="text"
        placeholder="Tag CR (es. 2QC02PRC0)"
        maxlength="15"
        required
        style="text-transform: uppercase"
      />
      <input
        v-model="username"
        type="text"
        placeholder="Nome (auto)"
        :disabled="checking"
        required
      />
      <button class="btn-gold" type="submit" :disabled="adding || checking || !username">
        {{ adding ? '...' : '+' }}
      </button>
    </div>
    <p v-if="checking" class="loading-inline"><span class="spinner"></span> Lookup tag...</p>
    <p v-else-if="lookupError" class="error-msg">{{ lookupError }}</p>
  </form>
</template>
