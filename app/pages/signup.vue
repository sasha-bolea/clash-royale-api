<script setup lang="ts">
useHead({ title: 'Registrati — Royal Arena' })
definePageMeta({ layout: false })

const { user, signUp } = useAuth()
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)
const done = ref(false)

watchEffect(() => {
  if (user.value) navigateTo('/clans', { replace: true })
})

async function submit() {
  error.value = null
  submitting.value = true
  try {
    await signUp(email.value, password.value)
    done.value = true
  } catch (err: any) {
    error.value = err?.message ?? 'Errore registrazione'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <header><div class="logo">Royal Arena</div></header>
    <main>
      <form v-if="!done" class="auth-form" @submit.prevent="submit">
        <h2 class="auth-title">Crea account</h2>
        <label>
          <span>Email</span>
          <input v-model="email" type="email" required autocomplete="email" />
        </label>
        <label>
          <span>Password</span>
          <input v-model="password" type="password" required minlength="6" autocomplete="new-password" />
        </label>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button class="btn-gold" type="submit" :disabled="submitting">
          {{ submitting ? '...' : 'REGISTRATI' }}
        </button>
        <p class="auth-switch">
          Hai già account? <NuxtLink to="/login">Accedi</NuxtLink>
        </p>
      </form>
      <div v-else class="auth-form">
        <h2 class="auth-title">Controlla la tua email</h2>
        <p>Ti abbiamo inviato un link di conferma a <strong>{{ email }}</strong>. Cliccalo per attivare l'account.</p>
        <NuxtLink to="/login" class="btn-gold">Torna al login</NuxtLink>
      </div>
    </main>
  </div>
</template>
