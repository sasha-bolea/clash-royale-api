<script setup lang="ts">
// "Install the app" card for the home page. Shown only in the browser (not in the
// installed app) until dismissed; the tap opens step-by-step instructions for the platform.
type Platform = 'ios' | 'other'

const DISMISS_KEY = 'royal-arena:install-dismissed'

const visible = ref(false)
const showSteps = ref(false)
const platform = ref<Platform>('other')

onMounted(() => {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  if (standalone || localStorage.getItem(DISMISS_KEY)) return
  platform.value = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : 'other'
  visible.value = true
})

// Hides the card for good on this device.
function dismiss() {
  visible.value = false
  showSteps.value = false
  localStorage.setItem(DISMISS_KEY, '1')
}
</script>

<template>
  <div v-if="visible" class="ra-panel ra-install ra-pop-in">
    <img class="ra-install__icon" src="/images/ui/icon-192.png" alt="" width="48" height="48">
    <button class="ra-install__body" @click="showSteps = true">
      <span class="ra-install__title">Installa l'app</span>
      <span class="ra-install__text">A schermo intero, senza barra del browser</span>
    </button>
    <button class="ra-btn ra-btn--round ra-btn--xs" aria-label="Non mostrare più" @click="dismiss">✕</button>
  </div>

  <Teleport to="body">
    <div v-if="showSteps" class="ra-modal-overlay" @click.self="showSteps = false">
      <div class="ra-modal">
        <h2 class="ra-modal__title">Aggiungi alla schermata Home</h2>
        <ol class="ra-steps">
          <template v-if="platform === 'ios'">
            <li class="ra-steps__item">
              <span class="ra-steps__num">1</span>
              <div>
                <strong class="ra-steps__title">Apri in Safari</strong>
                <p>Se sei in un'altra app o in Chrome, apri royalarena.it con Safari.</p>
              </div>
            </li>
            <li class="ra-steps__item">
              <span class="ra-steps__num">2</span>
              <div>
                <strong class="ra-steps__title">Tocca Condividi</strong>
                <p>Il quadrato con la freccia verso l'alto, nella barra di Safari.</p>
              </div>
            </li>
            <li class="ra-steps__item">
              <span class="ra-steps__num">3</span>
              <div>
                <strong class="ra-steps__title">Aggiungi alla schermata Home</strong>
                <p>Lascia attivo «Apri come app web» e tocca Aggiungi.</p>
              </div>
            </li>
          </template>
          <template v-else>
            <li class="ra-steps__item">
              <span class="ra-steps__num">1</span>
              <div>
                <strong class="ra-steps__title">Apri il menu ⋮</strong>
                <p>In alto a destra in Chrome.</p>
              </div>
            </li>
            <li class="ra-steps__item">
              <span class="ra-steps__num">2</span>
              <div>
                <strong class="ra-steps__title">Installa app</strong>
                <p>Oppure «Aggiungi alla schermata Home», poi conferma.</p>
              </div>
            </li>
          </template>
        </ol>
        <button class="ra-btn ra-btn--gold ra-btn--block" @click="dismiss">Ho capito</button>
      </div>
    </div>
  </Teleport>
</template>
