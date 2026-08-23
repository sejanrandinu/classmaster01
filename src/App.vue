<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  // Register Service Worker for PWA Offline & System Notifications
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      console.log('ClassMaster ServiceWorker registered with scope:', reg.scope)
    } catch (e) {
      console.warn('ServiceWorker registration failed:', e)
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
