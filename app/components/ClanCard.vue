<script setup lang="ts">
import type { SavedClan } from '~/composables/useBrowserSession'

defineProps<{ clan: SavedClan }>()
</script>

<template>
  <NuxtLink :to="`/clans/${clan.code}/torneo`" class="clan-card">
    <div class="clan-card-name">{{ clan.name }}</div>
    <div class="clan-card-meta">
      <span class="clan-code">#{{ clan.code }}</span>
    </div>
  </NuxtLink>
</template>
