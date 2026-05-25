<script setup lang="ts">
const route = useRoute()
const isActive = (path: string) => route.path === path
</script>

<template>
  <nav class="bottom-nav">
    <NuxtLink to="/storico" class="bn-item" :class="{ active: isActive('/storico') }">
      <img src="/images/ui/leaderboard.png" class="bn-icon" alt="storico" />
      <span>STORICO</span>
    </NuxtLink>
    <NuxtLink to="/" class="bn-item bn-center" :class="{ active: isActive('/') }">
      <div class="bn-center-ring">
        <img src="/images/ui/battle.png" class="bn-icon-center" alt="arena" />
      </div>
      <span>ARENA</span>
    </NuxtLink>
    <NuxtLink to="/statistiche" class="bn-item" :class="{ active: isActive('/statistiche') }">
      <img src="/images/ui/social.png" class="bn-icon" alt="stats" />
      <span>STATS</span>
    </NuxtLink>
  </nav>
</template>
