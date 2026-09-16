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

  // Handle stale chunk & CSS preload errors gracefully across deployments
  window.addEventListener('error', (event) => {
    const msg = event?.message || event?.error?.message || ''
    if (msg.includes('Unable to preload CSS') || msg.includes('Failed to fetch dynamically imported module')) {
      const lastReload = sessionStorage.getItem('cm-last-chunk-reload')
      const now = Date.now()
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('cm-last-chunk-reload', now.toString())
        window.location.reload()
      }
    }
  }, true)

  // Handle PWA Install Prompt globally (preventDefault allows custom install buttons)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    window.deferredPwaPrompt = e
    window.dispatchEvent(new CustomEvent('pwa-install-available'))
  })
})
</script>
