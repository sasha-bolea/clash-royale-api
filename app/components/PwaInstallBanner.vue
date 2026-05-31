<script setup lang="ts">
const showBanner = ref(false)
const showModal = ref(false)
const isIos = ref(false)

onMounted(() => {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true

  if (standalone) return
  if (sessionStorage.getItem('pwa-banner-dismissed')) return

  isIos.value = /iPad|iPhone|iPod/.test(navigator.userAgent)
  showBanner.value = true
})

function dismiss() {
  showBanner.value = false
  sessionStorage.setItem('pwa-banner-dismissed', '1')
}

function openModal() {
  showModal.value = true
}
</script>

<template>
  <Teleport to="body">
    <!-- Banner -->
    <div v-if="showBanner" class="install-banner" @click.self="openModal">
      <button class="install-banner__cta" @click="openModal">
        <span class="install-banner__icon">📲</span>
        <span>Aggiungi alla schermata Home</span>
      </button>
      <button class="install-banner__close" aria-label="Chiudi" @click.stop="dismiss">✕</button>
    </div>

    <!-- Modal istruzioni -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="install-overlay" @click.self="showModal = false">
        <div class="install-modal">
          <button class="install-modal__close" aria-label="Chiudi" @click="showModal = false">✕</button>

          <h2 class="install-modal__title">Aggiungi alla schermata Home</h2>
          <p class="install-modal__sub">Usa l'app in modalità standalone, senza barra del browser.</p>

          <!-- iOS -->
          <template v-if="isIos">
            <ol class="install-modal__steps">
              <li>
                <span class="step-icon">1</span>
                Tocca il pulsante <strong>Condividi</strong>
                <span class="share-icon">⬆</span> in basso nella barra di Safari
              </li>
              <li>
                <span class="step-icon">2</span>
                Scorri e scegli <strong>«Aggiungi alla schermata Home»</strong>
              </li>
              <li>
                <span class="step-icon">3</span>
                Tocca <strong>Aggiungi</strong> in alto a destra
              </li>
            </ol>
          </template>

          <!-- Android / Desktop -->
          <template v-else>
            <ol class="install-modal__steps">
              <li>
                <span class="step-icon">1</span>
                Tocca il menu <strong>⋮</strong> in alto a destra in Chrome
              </li>
              <li>
                <span class="step-icon">2</span>
                Seleziona <strong>«Aggiungi alla schermata Home»</strong>
                <br><small>(oppure «Installa app» se disponibile)</small>
              </li>
              <li>
                <span class="step-icon">3</span>
                Conferma toccando <strong>Installa</strong>
              </li>
            </ol>
          </template>

          <button class="install-modal__btn" @click="showModal = false; dismiss()">Ho capito</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Banner ── */
.install-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 300;
  background: linear-gradient(90deg, #1a1f4e, #0e1235);
  border-bottom: 2px solid var(--gold-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 48px 10px 16px;
  min-height: 48px;
}

.install-banner__cta {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--gold);
  font-family: 'Lilita One', cursive;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  letter-spacing: 0.3px;
}

.install-banner__icon {
  font-size: 18px;
  line-height: 1;
}

.install-banner__close {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}

/* ── Overlay ── */
.install-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ── Modal ── */
.install-modal {
  position: relative;
  background: var(--bg2);
  border: 1px solid var(--gold-dim);
  border-radius: 20px 20px 0 0;
  padding: 28px 24px 32px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.6);
}

.install-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
}

.install-modal__title {
  font-family: 'Lilita One', cursive;
  font-size: 20px;
  color: var(--gold);
  margin: 0 0 6px;
}

.install-modal__sub {
  color: var(--muted);
  font-size: 13px;
  margin: 0 0 20px;
}

.install-modal__steps {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.install-modal__steps li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  color: var(--text);
  line-height: 1.5;
}

.step-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--gold-dim);
  color: var(--gold);
  font-family: 'Lilita One', cursive;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.share-icon {
  display: inline-block;
  background: var(--bg3);
  border-radius: 6px;
  padding: 1px 6px;
  font-size: 13px;
  margin-left: 4px;
}

.install-modal__steps small {
  color: var(--muted);
  font-size: 12px;
}

.install-modal__btn {
  width: 100%;
  background: var(--gold);
  color: #0a0f2e;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-family: 'Lilita One', cursive;
  font-size: 16px;
  cursor: pointer;
}

/* ── Transition ── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .install-modal,
.modal-fade-leave-active .install-modal {
  transition: transform 0.25s ease;
}

.modal-fade-enter-from .install-modal,
.modal-fade-leave-to .install-modal {
  transform: translateY(100%);
}
</style>
