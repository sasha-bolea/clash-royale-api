<script setup lang="ts">
// Explanation dialog with numbered steps (e.g. "Come funziona").
// Props: title — dialog title; steps — ordered list of { title, text }.
// Emits: close — user tapped the X or outside the dialog.
defineProps<{
  title: string
  steps: { title: string; text: string }[]
}>()
defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <Teleport to="body">
    <div class="ra-modal-overlay" @click.self="$emit('close')">
      <div class="ra-modal ra-pop-in ra-info">
        <button class="ra-btn ra-btn--round ra-btn--sm ra-info__close" aria-label="Chiudi" @click="$emit('close')">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
        </button>
        <h2 class="ra-modal__title">{{ title }}</h2>
        <ol class="ra-steps">
          <li v-for="(s, i) in steps" :key="i" class="ra-steps__item">
            <span class="ra-steps__num">{{ i + 1 }}</span>
            <div>
              <strong class="ra-steps__title">{{ s.title }}</strong>
              <p>{{ s.text }}</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </Teleport>
</template>
