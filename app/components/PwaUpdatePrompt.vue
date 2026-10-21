<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()

function aggiorna() {
  updateServiceWorker(true)
}

function ignora() {
  needRefresh.value = false
}
</script>

<template>
  <Teleport to="body">
    <!-- In alto, sotto la barra di stato: non copre mai tab bar e pulsanti d'azione -->
    <div v-if="needRefresh" class="ra-panel ra-update ra-pop-in" role="status">
      <img src="/images/ui/icon-192.png" alt="" width="36" height="36" class="ra-update__icon">
      <span class="ra-update__text">Nuova versione disponibile</span>
      <button class="ra-btn ra-btn--gold ra-btn--sm" @click="aggiorna">Aggiorna</button>
      <button class="ra-btn ra-btn--round ra-btn--xs" aria-label="Più tardi" @click="ignora">✕</button>
    </div>
  </Teleport>
</template>

<style scoped>
.ra-update {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 8px);
  left: 12px;
  right: 12px;
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 456px;
  margin: 0 auto;
  padding: 8px 10px;
}
.ra-update__icon { flex-shrink: 0; border-radius: 10px; border: 2px solid var(--ra-stroke); }
.ra-update__text { flex: 1; min-width: 0; font-family: var(--ra-font-display); font-size: var(--ra-fs-sm); }
</style>
