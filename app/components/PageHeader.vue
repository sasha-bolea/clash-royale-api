<script setup lang="ts">
// Page title bar: gold ribbon in the middle, optional round back button on the
// left and an optional action (slot "action") on the right.
// Props: title — ribbon text; backTo — route for the back button (hidden if absent).
defineProps<{
  title: string
  backTo?: string
}>()
</script>

<template>
  <header class="ra-header">
    <NuxtLink v-if="backTo" :to="backTo" class="ra-btn ra-btn--round ra-btn--sm ra-header__side" aria-label="Indietro">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
    </NuxtLink>
    <span v-else class="ra-header__side" aria-hidden="true" />

    <h1 class="ra-ribbon ra-header__title">{{ title }}</h1>

    <div class="ra-header__side">
      <slot name="action" />
    </div>
  </header>
</template>
