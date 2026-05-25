<script setup lang="ts">
import type { Clan } from '~~/shared/types/domain'

const props = defineProps<{ clan: Clan }>()
const user = useSupabaseUser()
const isOwner = computed(() => user.value?.id === props.clan.owner_id)
</script>

<template>
  <NuxtLink :to="`/clans/${clan.id}/torneo`" class="clan-card">
    <div class="clan-card-name">{{ clan.name }}</div>
    <div class="clan-card-meta">
      <span v-if="isOwner" class="badge-owner">OWNER</span>
      <span v-else class="badge-member">MEMBER</span>
      <span class="clan-code">#{{ clan.invite_code }}</span>
    </div>
  </NuxtLink>
</template>
