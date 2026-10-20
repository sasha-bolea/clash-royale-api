<script setup lang="ts">
// Dashboard locale: lista clan salvati nel browser + CTA crea/entra
useHead({ title: 'Royal Arena' })
definePageMeta({ layout: false })

const { savedClans } = useBrowserSession()

const showCreate = ref(false)
const showJoin = ref(false)
</script>

<template>
  <div class="index-root">
    <main class="ra-home">
      <template v-if="!savedClans.length">
        <section class="ra-hero">
          <img class="ra-hero__logo" src="/images/ui/icon-512.png" alt="" width="148" height="148">
          <h1 class="ra-display ra-display--xl">Royal Arena</h1>
          <p class="ra-hero__sub">
            Crea un clan, condividi il codice con gli amici, traccia ogni torneo di Clash Royale.
          </p>
          <div class="ra-hero__cta">
            <button class="ra-btn ra-btn--gold ra-btn--lg ra-btn--block" @click="showCreate = true">CREA CLAN</button>
            <button class="ra-btn ra-btn--ghost ra-btn--block" @click="showJoin = true">Ho un codice</button>
          </div>
        </section>
      </template>

      <template v-else>
        <PageHeader title="Royal Arena" />
        <div class="ra-home__actions">
          <button class="ra-btn ra-btn--gold ra-btn--block" @click="showCreate = true">+ Nuovo clan</button>
          <button class="ra-btn ra-btn--ghost ra-btn--block" @click="showJoin = true">Entra con codice</button>
        </div>
        <p class="ra-label">I tuoi clan</p>
        <div class="ra-home__list">
          <ClanCard
            v-for="(c, i) in savedClans"
            :key="c.clan_id"
            :clan="c"
            class="ra-pop-in"
            :style="{ animationDelay: `${i * 60}ms` }"
          />
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

<style scoped>
.index-root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
/* footer subito dopo l'ultimo clan;
   quando il contenuto è corto, margin-top:auto lo spinge a 20px dal fondo */
.index-root :deep(.ra-footer) {
  margin-top: auto;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}
</style>
