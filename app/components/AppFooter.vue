<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <p>
      © {{ year }} Royal Arena ·
      Not affiliated with, endorsed, sponsored, or specifically approved by Supercell.
      Supercell is not responsible for it.
      Clash Royale and related assets are trademarks of Supercell Oy.
      For more information see Supercell's
      <a
        href="https://www.supercell.com/fan-content-policy"
        target="_blank"
        rel="noopener"
      >Fan Content Policy</a>.
    </p>
  </footer>
</template>
