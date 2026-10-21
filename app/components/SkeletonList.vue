<script setup lang="ts">
// Loading placeholder: a column of shimmering panels shaped like the content to come.
// Props: count — number of rows (default 4); height — row height in px (default 64).
withDefaults(defineProps<{ count?: number; height?: number }>(), { count: 4, height: 64 })
</script>

<template>
  <div class="ra-skeleton" role="status" aria-label="Caricamento">
    <div
      v-for="i in count"
      :key="i"
      class="ra-skeleton__row"
      :style="{ height: `${height}px`, animationDelay: `${(i - 1) * 90}ms` }"
    />
  </div>
</template>
