<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'


onMounted(async () => {
    // Force unregister any Service Workers to prevent caching issues
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations()
            for (const registration of registrations) {
                await registration.unregister()
            }
        } catch (e) {
            console.warn('SW Cleanup error:', e)
        }
    }
})

</script>
