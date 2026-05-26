<script setup lang="ts">
// Bottom nav contestuale al clan corrente (route param :code sotto /clans/[code]/*)
const route = useRoute()
const code = computed(() => route.params.code as string | undefined)

const isActive = (suffix: string) => code.value
  ? route.path === `/clans/${code.value}/${suffix}`
  : false
</script>

<template>
  <nav v-if="code" class="bottom-nav">
    <NuxtLink :to="`/clans/${code}/storico`" class="bn-item" :class="{ active: isActive('storico') }">
      <svg class="bn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="7" y1="8" x2="17" y2="8"/>
        <line x1="7" y1="12" x2="17" y2="12"/>
        <line x1="7" y1="16" x2="13" y2="16"/>
      </svg>
      <span>STORICO</span>
    </NuxtLink>
    <NuxtLink :to="`/clans/${code}/torneo`" class="bn-item bn-center" :class="{ active: isActive('torneo') }">
      <div class="bn-center-ring">
        <svg class="bn-svg-center" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 21h8M12 17v4"/>
          <path d="M17 3H7L5 9c0 3.31 3.13 6 7 6s7-2.69 7-6l-2-6z"/>
          <path d="M5 9H3a2 2 0 0 0 0 4h2"/>
          <path d="M19 9h2a2 2 0 0 1 0 4h-2"/>
        </svg>
      </div>
      <span>ARENA</span>
    </NuxtLink>
    <NuxtLink :to="`/clans/${code}/statistiche`" class="bn-item" :class="{ active: isActive('statistiche') }">
      <svg class="bn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      <span>STATS</span>
    </NuxtLink>
  </nav>
</template>
