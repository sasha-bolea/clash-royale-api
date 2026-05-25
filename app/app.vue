<script setup lang="ts">
// Layout root: pagina + bottom nav (solo dentro /clans/[id]/*) + toast globale.
const route = useRoute()

// Bottom nav visibile solo nelle pagine di un clan attivo.
const showNav = computed(() => /^\/clans\/\d+(\/|$)/.test(route.path))

const bodyClass = computed(() => {
  // Pagina torneo applica blocco scroll (vedi CSS .page-home)
  if (/^\/clans\/\d+\/torneo$/.test(route.path)) return 'page-home'
  return ''
})

useHead({
  bodyAttrs: { class: bodyClass },
})
</script>

<template>
  <div id="app-root">
    <NuxtPage />
    <BottomNav v-if="showNav" />
    <Toast />
  </div>
</template>
