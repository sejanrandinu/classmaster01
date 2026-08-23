<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  // Clear any legacy caching Service Workers that cause black screen on SPA chunk loading
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        if (registration.active && registration.active.scriptURL.includes('/sw.js')) {
          // Keep sw.js for notifications if working, or update it cleanly
          await registration.update()
        }
      }
    } catch (e) {
      console.warn('SW update check:', e)
    }
  }

  // Handle PWA Install Prompt globally
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    window.deferredPwaPrompt = e
    window.dispatchEvent(new CustomEvent('pwa-install-available'))
  })
})
</script>
