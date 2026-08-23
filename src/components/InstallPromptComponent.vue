<template>
  <div>
    <!-- Automatic Install App Modal / Bottom Sheet -->
    <q-dialog v-model="showPrompt" position="bottom" class="install-dialog">
      <q-card flat class="glass-prompt-card text-white q-pa-lg">
        <q-card-section class="row items-center no-wrap">
          <q-avatar size="56px" class="q-mr-md glow-shadow">
            <img src="/favicon.svg" alt="ClassMaster Logo" />
          </q-avatar>
          <div class="col">
            <div class="row items-center justify-between">
              <div class="text-subtitle1 text-weight-bolder letter-spacing-tight">
                {{ appStore.language === 'English' ? 'Install ClassMaster App' : 'ClassMaster App එක ස්ථාපනය කරන්න' }}
              </div>
              <q-btn flat round dense icon="close" color="grey-4" v-close-popup />
            </div>
            <div class="text-caption text-indigo-2 q-mt-xs">
              {{ appStore.language === 'English'
                ? 'Add ClassMaster to your home screen for quick 1-tap access & offline performance!'
                : 'ක්ෂණිකව පිවිසීමට ClassMaster ඔබේ දුරකථන මුල් තිරයට (Home Screen) එකතු කරගන්න!' 
              }}
            </div>
          </div>
        </q-card-section>

        <!-- Android / Chrome Native Install Action -->
        <q-card-section class="q-pt-none q-pb-md" v-if="!isIOS">
          <div class="row q-gutter-sm justify-end">
            <q-btn 
              flat 
              no-caps 
              label="Later" 
              color="grey-4" 
              v-close-popup 
              class="q-px-md"
            />
            <q-btn 
              unelevated 
              no-caps 
              color="yellow-8" 
              text-color="dark" 
              icon="add_to_home_screen" 
              :label="appStore.language === 'English' ? 'Add to Home Screen' : 'මුල් තිරයට එක් කරන්න'" 
              class="text-weight-bold q-px-lg install-btn glow-yellow" 
              @click="installPWA"
            />
          </div>
        </q-card-section>

        <!-- iOS Safari Instructions Banner -->
        <q-card-section class="q-pt-none q-pb-md" v-else>
          <div class="bg-indigo-10 q-pa-md rounded-borders text-caption border-teal">
            <div class="text-weight-bold text-teal-3 q-mb-xs flex items-center">
              <q-icon name="ios_share" class="q-mr-xs" size="18px" />
              {{ appStore.language === 'English' ? 'How to Install on iPhone / iPad:' : 'iPhone / iPad හි ස්ථාපනය කරන ආකාරය:' }}
            </div>
            <ol class="q-ma-none q-pl-md text-indigo-2">
              <li>{{ appStore.language === 'English' ? 'Tap the Share button at the bottom of Safari' : 'Safari හි පහළ ඇති Share (බෙදාගැනීමේ) සලකුණ ඔබන්න' }} <q-icon name="ios_share" size="14px" /></li>
              <li>{{ appStore.language === 'English' ? 'Scroll down & tap "Add to Home Screen"' : 'පහළට ගොස් "Add to Home Screen" තෝරන්න' }} <q-icon name="add_box" size="14px" /></li>
            </ol>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Floating Mini Banner (Always available if not installed) -->
    <div v-if="canInstall && !showPrompt" class="floating-install-fab border-glow">
      <q-btn
        rounded
        unelevated
        color="yellow-8"
        text-color="dark"
        icon="install_mobile"
        :label="appStore.language === 'English' ? 'Add App' : 'App එක ගන්න'"
        no-caps
        class="text-weight-bold shadow-10"
        @click="showPrompt = true"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAppStore } from 'src/store/app'

const appStore = useAppStore()
const showPrompt = ref(false)
const canInstall = ref(false)
let deferredPrompt = null

const isIOS = computed(() => {
  if (typeof window === 'undefined') return false
  const userAgent = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent) && !window.navigator.standalone
})

const isStandalone = computed(() => {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://')
  )
})

onMounted(() => {
  // If already installed as PWA or running inside mobile app container, don't prompt
  if (isStandalone.value) return

  // Check if iOS
  if (isIOS.value) {
    // Show prompt automatically after 2 seconds for iOS
    setTimeout(() => {
      showPrompt.value = true
    }, 2000)
    return
  }

  // Chrome / Android / Edge deferred prompt listener
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    canInstall.value = true

    // Show prompt automatically after 1.5 seconds on visit!
    setTimeout(() => {
      const dismissedTime = localStorage.getItem('classmaster_pwa_dismissed')
      if (!dismissedTime || Date.now() - parseInt(dismissedTime) > 86400000) {
        showPrompt.value = true
      }
    }, 1500)
  })
})

const installPWA = async () => {
  if (!deferredPrompt) {
    showPrompt.value = false
    return
  }
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') {
    canInstall.value = false
  }
  deferredPrompt = null
  showPrompt.value = false
}
</script>

<style scoped lang="scss">
.glass-prompt-card {
  background: rgba(13, 18, 77, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  max-width: 540px;
  margin: 0 auto;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.7);
}

.glow-shadow {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
}

.glow-yellow {
  box-shadow: 0 0 20px rgba(250, 204, 21, 0.4);
}

.floating-install-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9990;
}

.border-teal {
  border: 1px solid rgba(45, 212, 191, 0.3);
}
</style>
