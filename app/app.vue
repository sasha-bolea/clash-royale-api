<script setup lang="ts">
// Layout root: pagina + bottom nav (solo dentro /clans/[id]/*) + toast globale.
const route = useRoute()

// Bottom nav visibile solo nelle pagine di un clan attivo.
const showNav = computed(() => /^\/clans\/[A-Z0-9]+(\/|$)/.test(route.path))

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
    <AppFooter />
    <BottomNav v-if="showNav" />
    <Toast />
    <PwaUpdatePrompt />
  </div>
</template>
