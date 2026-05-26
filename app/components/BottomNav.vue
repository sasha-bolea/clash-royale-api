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
      <span class="bn-emoji">📋</span>
      <span>STORICO</span>
    </NuxtLink>
    <NuxtLink :to="`/clans/${code}/torneo`" class="bn-item bn-center" :class="{ active: isActive('torneo') }">
      <div class="bn-center-ring">
        <span class="bn-emoji-center">⚔️</span>
      </div>
      <span>ARENA</span>
    </NuxtLink>
    <NuxtLink :to="`/clans/${code}/statistiche`" class="bn-item" :class="{ active: isActive('statistiche') }">
      <span class="bn-emoji">📊</span>
      <span>STATS</span>
    </NuxtLink>
  </nav>
</template>
