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
    <div v-if="needRefresh" class="pwa-update-banner">
      <span>Nuova versione disponibile.</span>
      <button class="pwa-btn-ok" @click="aggiorna">Aggiorna</button>
      <button class="pwa-btn-skip" @click="ignora">Ignora</button>
    </div>
  </Teleport>
</template>

<style scoped>
.pwa-update-banner {
  position: fixed;
  bottom: calc(80px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg3);
  border: 1px solid var(--gold-dim);
  border-radius: 12px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text);
  z-index: 200;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,.5);
}
.pwa-btn-ok {
  background: var(--gold);
  color: #0a0f2e;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  font-family: 'Lilita One', cursive;
  font-size: 13px;
  cursor: pointer;
}
.pwa-btn-skip {
  background: transparent;
  color: var(--muted);
  border: none;
  font-family: 'Lilita One', cursive;
  font-size: 13px;
  cursor: pointer;
}
</style>
