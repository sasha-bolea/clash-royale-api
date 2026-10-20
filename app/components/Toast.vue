<script setup lang="ts">
const { message, visible } = useToast()
</script>

<template>
  <div class="ra-toast" :class="{ 'is-visible': visible }" role="status">{{ message }}</div>
</template>
