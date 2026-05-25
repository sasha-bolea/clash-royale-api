<script setup lang="ts">
// Callback post conferma email Supabase. Aspetta sessione poi redirect.
definePageMeta({ layout: false })
const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) navigateTo('/clans', { replace: true })
})

onMounted(() => {
  // Fallback: se sessione non arriva, rimanda a login
  setTimeout(() => {
    if (!user.value) navigateTo('/login', { replace: true })
  }, 3000)
})
</script>

<template>
  <div class="auth-page">
    <main>
      <p class="loading">Conferma in corso...</p>
    </main>
  </div>
</template>
