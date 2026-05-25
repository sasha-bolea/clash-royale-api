<script setup lang="ts">
// Layout root: pagina + bottom nav fissa + toast globale.
const route = useRoute()
const bodyClass = computed(() => {
  if (route.path === '/') return 'page-home'
  return ''
})
useHead({
  bodyAttrs: { class: bodyClass },
})
</script>

<template>
  <div id="app-root">
    <NuxtPage />
    <BottomNav />
    <Toast />
  </div>
</template>
