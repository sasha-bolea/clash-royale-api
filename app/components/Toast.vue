<script setup lang="ts">
const { message, visible } = useToast()
</script>

<template>
  <div id="toast" :class="{ show: visible }">{{ message }}</div>
</template>
