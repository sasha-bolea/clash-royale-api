<script setup lang="ts">
// TEMPORARY diagnostic overlay for the iOS PWA band under the bottom nav.
// Shows viewport/screen sizes and safe-area insets measured on the device.
// Remove once the band issue is solved.
const info = ref('')

// Reads the current layout numbers and formats them as short lines.
function measure() {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;visibility:hidden;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0'
  document.body.appendChild(probe)
  const cs = getComputedStyle(probe)
  const safeTop = cs.paddingTop
  const safeBottom = cs.paddingBottom
  probe.remove()

  const nav = document.querySelector('.bottom-nav')?.getBoundingClientRect()
  const body = document.body.getBoundingClientRect()
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
  info.value = [
    `standalone ${standalone}`,
    `screen ${screen.width}x${screen.height}`,
    `inner ${innerWidth}x${innerHeight} vv ${Math.round(visualViewport?.height ?? 0)}`,
    `docClient ${document.documentElement.clientHeight}`,
    `body bottom ${Math.round(body.bottom)} nav bottom ${nav ? Math.round(nav.bottom) : '-'}`,
    `safe top ${safeTop} bottom ${safeBottom}`,
  ].join('\n')
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  setInterval(measure, 1000)
})
</script>

<template>
  <pre class="diag-badge">{{ info }}</pre>
  <!-- Red line pinned to the bottom of the web view: shows where the page really ends. -->
  <div class="diag-bottom-line" />
</template>

<style>
.diag-badge {
  position: fixed;
  top: 50%;
  left: 8px;
  z-index: 9999;
  margin: 0;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.8);
  color: #0f0;
  font: 11px/1.4 monospace;
  border-radius: 6px;
  pointer-events: none;
  white-space: pre;
}
.diag-bottom-line {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: #f00;
  z-index: 9999;
  pointer-events: none;
}
</style>
