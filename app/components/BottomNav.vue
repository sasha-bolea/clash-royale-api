<script setup lang="ts">
// Bottom nav contestuale al clan corrente (route param :id sotto /clans/[id]/*)
const route = useRoute()
const clanId = computed(() => route.params.id as string | undefined)

const isActive = (suffix: string) => clanId.value
  ? route.path === `/clans/${clanId.value}/${suffix}`
  : false
</script>

<template>
  <nav v-if="clanId" class="bottom-nav">
    <NuxtLink :to="`/clans/${clanId}/storico`" class="bn-item" :class="{ active: isActive('storico') }">
      <img src="/images/ui/leaderboard.png" class="bn-icon" alt="storico" />
      <span>STORICO</span>
    </NuxtLink>
    <NuxtLink :to="`/clans/${clanId}/torneo`" class="bn-item bn-center" :class="{ active: isActive('torneo') }">
      <div class="bn-center-ring">
        <img src="/images/ui/battle.png" class="bn-icon-center" alt="arena" />
      </div>
      <span>ARENA</span>
    </NuxtLink>
    <NuxtLink :to="`/clans/${clanId}/statistiche`" class="bn-item" :class="{ active: isActive('statistiche') }">
      <img src="/images/ui/social.png" class="bn-icon" alt="stats" />
      <span>STATS</span>
    </NuxtLink>
  </nav>
</template>
