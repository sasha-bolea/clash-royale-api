<script setup lang="ts">
// Layout root: pagina + bottom nav (solo dentro /clans/[id]/*) + toast globale.
const route = useRoute()

// Bottom nav visibile solo nelle pagine di un clan attivo.
const showNav = computed(() => /^\/clans\/[A-Z0-9]+(\/|$)/.test(route.path))

// Installed app (standalone): pin the app height to the real screen height.
// iOS sometimes reports a window shorter by the status bar (47px) after a resume,
// leaving an empty band at the bottom. Re-checked on resize, rotation and resume.
function syncAppHeight() {
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
  if (!standalone) return
  const h = Math.max(window.innerHeight, screen.height)
  document.documentElement.style.setProperty('--ra-app-h', `${h}px`)
}

// Blocca pinch-zoom su iOS (ignora user-scalable=no dal iOS 10)
onMounted(() => {
  syncAppHeight()
  window.addEventListener('resize', syncAppHeight)
  window.addEventListener('orientationchange', syncAppHeight)
  document.addEventListener('visibilitychange', syncAppHeight)

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
    <ConfirmHost />
    <PwaUpdatePrompt />
  </div>
</template>
