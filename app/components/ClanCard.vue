<script setup lang="ts">
import type { SavedClan } from '~/composables/useBrowserSession'

defineProps<{ clan: SavedClan }>()
</script>

<template>
  <NuxtLink :to="`/clans/${clan.code}/torneo`" class="ra-panel ra-panel--interactive ra-clan-card">
    <img class="ra-clan-card__icon" src="/images/ui/crown-shield.png" alt="" width="40" height="48">
    <span class="ra-clan-card__name ra-display ra-display--md">{{ clan.name }}</span>
    <span class="ra-badge">#{{ clan.code }}</span>
  </NuxtLink>
</template>
