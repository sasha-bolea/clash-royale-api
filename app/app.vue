<script setup lang="ts">
// Layout root: pagina + bottom nav (solo dentro /clans/[id]/*) + toast globale.
const route = useRoute()

// Bottom nav visibile solo nelle pagine di un clan attivo.
const showNav = computed(() => /^\/clans\/[A-Z0-9]+(\/|$)/.test(route.path))

// Attiva app-shell flex per pagine clan: rende bottom-nav figlio statico
// invece di position:fixed, eliminando i bug di repaint fixed su iOS PWA.
watchEffect(() => {
  document.body.classList.toggle('clan-shell', showNav.value)
})

// Blocca pinch-zoom su iOS (ignora user-scalable=no dal iOS 10)
onMounted(() => {
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault()
  }, { passive: false })
})
</script>

<template>
  <div id="app-root">
    <NuxtPage />
    <BottomNav v-if="showNav" />
    <Toast />
    <PwaUpdatePrompt />
    <PwaInstallBanner />
  </div>
</template>

<style>
#app-root {
  padding-top: var(--install-banner-height, 0px);
  transition: padding-top 0.2s ease;
}
</style>
