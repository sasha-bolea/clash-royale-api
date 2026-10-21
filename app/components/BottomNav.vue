<script setup lang="ts">
// Bottom tab bar for clan pages (route param :code under /clans/[code]/*).
// ARENA sits in the middle as a raised round button.
const route = useRoute()
const code = computed(() => route.params.code as string | undefined)

// True when the current route is the given clan sub-page.
const isActive = (suffix: string) => code.value
  ? route.path === `/clans/${code.value}/${suffix}`
  : false

// Tapping the tab of the page you are already on scrolls it back to the top.
function onTab(suffix: string) {
  if (isActive(suffix)) document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <nav v-if="code" class="bottom-nav ra-tabbar">
    <NuxtLink :to="`/clans/${code}/storico`" class="ra-tabbar__item" :class="{ 'is-active': isActive('storico') }" @click="onTab('storico')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <line x1="7" y1="8" x2="17" y2="8" />
        <line x1="7" y1="12" x2="17" y2="12" />
        <line x1="7" y1="16" x2="13" y2="16" />
      </svg>
      STORICO
    </NuxtLink>
    <NuxtLink :to="`/clans/${code}/torneo`" class="ra-tabbar__item" :class="{ 'is-active': isActive('torneo') }" @click="onTab('torneo')">
      <span class="ra-tabbar__center">
        <img src="/images/ui/trophy.png" alt="" width="38" height="36">
      </span>
      ARENA
    </NuxtLink>
    <NuxtLink :to="`/clans/${code}/statistiche`" class="ra-tabbar__item" :class="{ 'is-active': isActive('statistiche') }" @click="onTab('statistiche')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
      STATS
    </NuxtLink>
  </nav>
</template>
