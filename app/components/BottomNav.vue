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
      <img src="/images/ui/leaderboard.png" class="bn-icon" alt="storico" />
      <span>STORICO</span>
    </NuxtLink>
    <NuxtLink :to="`/clans/${code}/torneo`" class="bn-item bn-center" :class="{ active: isActive('torneo') }">
      <div class="bn-center-ring">
        <img src="/images/ui/battle.png" class="bn-icon-center" alt="arena" />
      </div>
      <span>ARENA</span>
    </NuxtLink>
    <NuxtLink :to="`/clans/${code}/statistiche`" class="bn-item" :class="{ active: isActive('statistiche') }">
      <img src="/images/ui/social.png" class="bn-icon" alt="stats" />
      <span>STATS</span>
    </NuxtLink>
  </nav>
</template>
