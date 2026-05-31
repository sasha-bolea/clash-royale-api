<script setup lang="ts">
// Dashboard locale: lista clan salvati nel browser + CTA crea/entra
useHead({ title: 'Royal Arena' })
definePageMeta({ layout: false })

const { savedClans } = useBrowserSession()

const showCreate = ref(false)
const showJoin = ref(false)
</script>

<template>
  <div>
    <header><div class="logo">Royal Arena</div></header>

    <main>
      <template v-if="!savedClans.length">
        <div class="landing-hero">
          <h1 class="landing-title">Royal Arena</h1>
          <p class="landing-sub">
            Crea un clan, condividi il codice con gli amici, traccia ogni torneo di Clash Royale.
          </p>
          <div class="landing-cta">
            <button class="btn-gold" @click="showCreate = true">CREA CLAN</button>
            <button class="btn-link" @click="showJoin = true">Ho un codice</button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="clans-actions">
          <button class="btn-gold" @click="showCreate = true">+ Nuovo clan</button>
          <button class="btn-link" @click="showJoin = true">Entra con codice</button>
        </div>
        <div class="clans-list">
          <ClanCard v-for="c in savedClans" :key="c.clan_id" :clan="c" />
        </div>
      </template>
    </main>

    <AppFooter />

    <CreateClanModal
      v-if="showCreate"
      @close="showCreate = false"
      @created="showCreate = false"
    />
    <JoinByCodeModal
      v-if="showJoin"
      @close="showJoin = false"
      @joined="showJoin = false"
    />
  </div>
</template>
