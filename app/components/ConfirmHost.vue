<script setup lang="ts">
// Renders the dialog requested through useConfirm().askConfirm(). Mounted once in app.vue.
const { current, answer } = useConfirm()
</script>

<template>
  <ConfirmDialog
    v-if="current"
    :title="current.title"
    :message="current.message"
    :confirm-label="current.confirmLabel"
    :danger="current.danger"
    @close="answer(false)"
    @confirm="answer(true)"
  />
</template>
