<script setup lang="ts">
// Vetrina del UI kit (app/assets/css/ui.css) con dati finti, per valutare il
// redesign sul telefono. Non è linkata dal sito; da rimuovere o nascondere
// quando il redesign è applicato a tutte le pagine.
useHead({ title: 'Royal Arena — Design', meta: [{ name: 'robots', content: 'noindex' }] })

const tab = ref<'giocatori' | 'torneo'>('giocatori')
const nav = ref<'storico' | 'arena' | 'stats'>('arena')

const players = ref([
  { id: 1, name: 'POLLOLOKO_717', tag: '#LLRCP2U2L', selected: true },
  { id: 2, name: 'LO SGRAVATO', tag: '#L2PU8GLJL', selected: true },
  { id: 3, name: 'Swahx', tag: '#LV8LYP88', selected: false },
  { id: 4, name: 'Persak#freesera', tag: '#CL0VV9JU', selected: true },
])
const selectedCount = computed(() => players.value.filter(p => p.selected).length)

// Toggles a demo player's selection.
function togglePlayer(id: number) {
  const p = players.value.find(x => x.id === id)
  if (p) p.selected = !p.selected
}

const podium = [
  { place: 1, name: 'POLLOLOKO_717', wins: 2 },
  { place: 2, name: 'LO SGRAVATO', wins: 1 },
  { place: 3, name: 'Swahx', wins: 0 },
]

// Re-mounts the podium so its entrance animation can be replayed.
const podiumKey = ref(0)
</script>

<template>
  <div class="ds-page ra-bg">
    <header class="ds-header">
      <h1 class="ra-ribbon">Royal Arena</h1>
    </header>

    <main class="ds-main">
      <section class="ds-section">
        <p class="ra-label">Testi</p>
        <p class="ra-display ra-display--xl">TORNEO CONCLUSO</p>
        <p class="ra-display ra-display--lg ra-display--gold">Vittoria!</p>
        <p class="ra-display ra-display--md">Seleziona i giocatori</p>
      </section>

      <section class="ds-section">
        <p class="ra-label">Pulsanti</p>
        <button class="ra-btn ra-btn--gold ra-btn--lg ra-btn--block">AVVIA TORNEO</button>
        <div class="ds-row">
          <button class="ra-btn">Blu</button>
          <button class="ra-btn ra-btn--green">Conferma</button>
          <button class="ra-btn ra-btn--red">Annulla</button>
        </div>
        <div class="ds-row">
          <button class="ra-btn ra-btn--ghost">Vedi storico →</button>
          <button class="ra-btn ra-btn--round" aria-label="info">i</button>
          <button class="ra-btn ra-btn--gold" disabled>Disattivo</button>
        </div>
      </section>

      <section class="ds-section">
        <p class="ra-label">Tab</p>
        <div class="ra-tabs">
          <button class="ra-tab" :class="{ 'is-active': tab === 'giocatori' }" @click="tab = 'giocatori'">GIOCATORI</button>
          <button class="ra-tab" :class="{ 'is-active': tab === 'torneo' }" @click="tab = 'torneo'">TORNEO</button>
        </div>
      </section>

      <section class="ds-section">
        <div class="ds-row ds-row--between">
          <p class="ra-label">Selezione giocatori</p>
          <span class="ra-badge ra-badge--gold">{{ selectedCount }} selezionati</span>
        </div>
        <button
          v-for="(p, i) in players"
          :key="p.id"
          class="ra-chip ra-pop-in"
          :class="{ 'is-selected': p.selected }"
          :style="{ animationDelay: `${i * 60}ms` }"
          @click="togglePlayer(p.id)"
        >
          <span class="ra-avatar">{{ p.name[0] }}</span>
          <span class="ra-chip__name">{{ p.name }}</span>
          <span class="ra-chip__tag">{{ p.tag }}</span>
          <span class="ra-chip__check">✓</span>
        </button>
      </section>

      <section class="ds-section">
        <div class="ds-row ds-row--between">
          <p class="ra-label">Partite</p>
          <span class="ra-badge ra-badge--live">LIVE</span>
        </div>
        <div class="ra-match">
          <div class="ra-match__side is-winner">
            <span class="ra-avatar">P</span>
            <span class="ra-match__name">POLLOLOKO_717</span>
          </div>
          <div class="ra-match__score">
            <img class="ra-match__crown" src="/images/ui/blue-crown.png" alt="">
            3 - 1
            <img class="ra-match__crown" src="/images/ui/red-crown.png" alt="">
          </div>
          <div class="ra-match__side ra-match__side--right">
            <span class="ra-avatar ra-avatar--red">S</span>
            <span class="ra-match__name">Swahx</span>
          </div>
        </div>
      </section>

      <section class="ds-section">
        <p class="ra-label">Statistiche</p>
        <div class="ds-grid3">
          <div class="ra-stat">
            <img class="ra-stat__icon" src="/images/ui/trophy.png" alt="">
            <span class="ra-stat__value">66</span>
            <span class="ra-stat__label">Tornei</span>
          </div>
          <div class="ra-stat">
            <img class="ra-stat__icon" src="/images/ui/blue-crown.png" alt="">
            <span class="ra-stat__value">12</span>
            <span class="ra-stat__label">Vinte</span>
          </div>
          <div class="ra-stat">
            <img class="ra-stat__icon" src="/images/ui/crown-shield.png" alt="">
            <span class="ra-stat__value">58%</span>
            <span class="ra-stat__label">Win rate</span>
          </div>
        </div>
      </section>

      <section class="ds-section">
        <div class="ds-row ds-row--between">
          <p class="ra-label">Podio</p>
          <button class="ra-btn ra-btn--ghost ds-small" @click="podiumKey++">Rivedi animazione</button>
        </div>
        <div :key="podiumKey" class="ra-panel ra-panel--gold">
          <div class="ra-podium">
            <div v-for="p in podium" :key="p.place" class="ra-podium__place" :class="`ra-podium__place--${p.place}`">
              <img v-if="p.place === 1" class="ra-podium__crown" src="/images/ui/blue-crown.png" alt="">
              <span class="ra-podium__name">{{ p.name }}</span>
              <span class="ra-podium__wins">{{ p.wins }} vinte</span>
              <div class="ra-podium__step">{{ p.place }}</div>
            </div>
          </div>
        </div>
        <button class="ra-btn ra-btn--gold ra-btn--lg ra-btn--block">NUOVO TORNEO</button>
      </section>

      <section class="ds-section">
        <p class="ra-label">Card clan</p>
        <div class="ra-panel ra-panel--interactive ds-clan">
          <div>
            <p class="ra-display ra-display--md">torneo fioi</p>
            <p class="ds-muted">4 giocatori · 66 tornei</p>
          </div>
          <span class="ra-badge">#MTHV83</span>
        </div>
      </section>
    </main>

    <nav class="ra-tabbar ds-tabbar">
      <a class="ra-tabbar__item" :class="{ 'is-active': nav === 'storico' }" @click="nav = 'storico'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="16" x2="13" y2="16" /></svg>
        STORICO
      </a>
      <a class="ra-tabbar__item" :class="{ 'is-active': nav === 'arena' }" @click="nav = 'arena'">
        <span class="ra-tabbar__center"><img src="/images/ui/trophy.png" alt="" width="38"></span>
        ARENA
      </a>
      <a class="ra-tabbar__item" :class="{ 'is-active': nav === 'stats' }" @click="nav = 'stats'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
        STATS
      </a>
    </nav>
  </div>
</template>

<style scoped>
.ds-page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.ds-header {
  display: flex;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) 16px 8px;
}
.ds-main {
  flex: 1;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 16px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.ds-section { display: flex; flex-direction: column; gap: 12px; }
.ds-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.ds-row--between { justify-content: space-between; }
.ds-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.ds-small { min-height: 36px; font-size: 13px; padding: 0 14px; }
.ds-clan { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ds-muted { margin-top: 4px; font-size: 13px; color: var(--ra-text-muted); }
.ds-tabbar { position: sticky; bottom: 0; }
</style>
