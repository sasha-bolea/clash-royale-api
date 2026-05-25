<script setup lang="ts">
useHead({ title: 'Login — Royal Arena' })
definePageMeta({ layout: false })

const { user, signIn } = useAuth()
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

// Già loggato → redirect
watchEffect(() => {
  if (user.value) navigateTo('/clans', { replace: true })
})

async function submit() {
  error.value = null
  submitting.value = true
  try {
    await signIn(email.value, password.value)
    await navigateTo('/clans')
  } catch (err: any) {
    error.value = err?.message ?? 'Errore login'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <header><div class="logo">Royal Arena</div></header>
    <main>
      <form class="auth-form" @submit.prevent="submit">
        <h2 class="auth-title">Accedi</h2>
        <label>
          <span>Email</span>
          <input v-model="email" type="email" required autocomplete="email" />
        </label>
        <label>
          <span>Password</span>
          <input v-model="password" type="password" required autocomplete="current-password" />
        </label>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button class="btn-gold" type="submit" :disabled="submitting">
          {{ submitting ? '...' : 'ACCEDI' }}
        </button>
        <p class="auth-switch">
          Non hai account? <NuxtLink to="/signup">Registrati</NuxtLink>
        </p>
      </form>
    </main>
  </div>
</template>
