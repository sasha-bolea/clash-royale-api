<script setup lang="ts">
// Empty page/section: game icon, short title, explanation and an optional action (default slot).
// Props: icon — image path under /images/ui; title; text — optional explanation.
defineProps<{ icon: string; title: string; text?: string }>()
</script>

<template>
  <div class="ra-empty ra-pop-in">
    <img class="ra-empty__icon" :src="icon" alt="">
    <p class="ra-empty__title">{{ title }}</p>
    <p v-if="text" class="ra-empty__text">{{ text }}</p>
    <div v-if="$slots.default" class="ra-empty__action"><slot /></div>
  </div>
</template>
