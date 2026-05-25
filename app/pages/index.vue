<script setup lang="ts">
// Landing pubblica: se loggato redirect a /clans, altrimenti CTA login/signup
useHead({ title: 'Royal Arena' })
definePageMeta({ layout: false })

const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) navigateTo('/clans', { replace: true })
})
</script>

<template>
  <div class="landing-page">
    <header><div class="logo">Royal Arena</div></header>
    <main>
      <div class="landing-hero">
        <img src="/images/ui/logo.png" alt="logo" class="landing-logo" />
        <h1 class="landing-title">Royal Arena</h1>
        <p class="landing-sub">
          Crea il clan, sfida gli amici, traccia ogni torneo di Clash Royale.
        </p>
        <div class="landing-cta">
          <NuxtLink to="/signup" class="btn-gold">CREA ACCOUNT</NuxtLink>
          <NuxtLink to="/login" class="btn-link">Ho già un account</NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>
