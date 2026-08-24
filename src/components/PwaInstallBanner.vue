<template>
  <transition name="slide-up">
    <div v-if="showBanner" class="pwa-banner-root no-print">
      <div class="pwa-banner-card glass-modern shadow-24 q-pa-md row items-center justify-between">
        <div class="row items-center q-gutter-md">
          <q-avatar size="48px" class="glow-shadow">
            <img src="/favicon.svg" alt="ClassMaster Logo" />
          </q-avatar>
          <div>
            <div class="text-subtitle1 text-weight-bold text-white row items-center">
              <span>{{ isEnglish ? 'Install ClassMaster Web App' : 'ClassMaster ඇප් එක ෆෝන් එකට ගනිමු' }}</span>
              <q-chip dense color="amber-5" text-color="black" class="q-ml-sm text-weight-bold" style="font-size: 10px;" :label="chipLabel" />
            </div>
            <div class="text-caption text-indigo-2">
              {{ isEnglish ? 'Get real-time system alerts, instant access & offline support.' : 'ක්ෂණික පැමිණීම්, ලකුණු සහ පන්ති නිවේදන පද්ධති දැනුම්දීම් ලබාගන්න.' }}
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-sm q-mt-sm-none q-mt-xs">
          <!-- Install Button (if available) -->
          <q-btn
            v-if="canInstall"
            unelevated
            color="amber-5"
            text-color="black"
            icon="get_app"
            :label="isEnglish ? 'Install App' : 'Install කරන්න'"
            no-caps
            class="text-weight-bold q-px-md rounded-borders hover-glow"
            @click="triggerInstall"
          />

          <!-- Notification Permission Button (if default) -->
          <q-btn
            v-if="needsNotificationPermission"
            unelevated
            color="teal-5"
            text-color="white"
            icon="notifications_active"
            :label="isEnglish ? 'Enable Notifications' : 'දැනුම්දීම් සක්‍රීය කරන්න'"
            no-caps
            class="text-weight-bold q-px-md rounded-borders"
            @click="triggerNotifications"
          />

          <!-- Dismiss Button (Dismisses forever so it pops up only on 1st visit) -->
          <q-btn
            flat
            round
            dense
            color="grey-4"
            icon="close"
            @click="dismissBanner"
          >
            <q-tooltip>{{ isEnglish ? 'Dismiss' : 'වසා දමන්න' }}</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { notificationService } from 'src/utils/notifications'
import { useAppStore } from 'src/store/app'

const appStore = useAppStore()
const isEnglish = computed(() => appStore.language === 'English')
const chipLabel = computed(() => isEnglish.value ? 'Official App' : 'නිල ඇප් එක')

const showBanner = ref(false)
const canInstall = ref(false)
const needsNotificationPermission = ref(false)

onMounted(() => {
  // Check if user has already seen/dismissed this 1st time visit banner
  const hasSeen = localStorage.getItem('cm_pwa_banner_seen')
  if (hasSeen) {
    showBanner.value = false
    return
  }

  // Check notification permission state
  needsNotificationPermission.value = notificationService.isPermissionNeeded()

  // Check PWA install state
  if (typeof window !== 'undefined' && window.deferredPwaPrompt) {
    canInstall.value = true
  }

  window.addEventListener('pwa-install-available', () => {
    canInstall.value = true
    checkShowBanner()
  })

  checkShowBanner()
})

const checkShowBanner = () => {
  const hasSeen = localStorage.getItem('cm_pwa_banner_seen')
  if (!hasSeen && (canInstall.value || needsNotificationPermission.value)) {
    showBanner.value = true
  }
}

const triggerInstall = async () => {
  if (window.deferredPwaPrompt) {
    window.deferredPwaPrompt.prompt()
    const choice = await window.deferredPwaPrompt.userChoice
    if (choice.outcome === 'accepted') {
      canInstall.value = false
    }
    window.deferredPwaPrompt = null
  }
  dismissBanner()
}

const triggerNotifications = async () => {
  const granted = await notificationService.requestPermission()
  if (granted) {
    needsNotificationPermission.value = false
    notificationService.send('Notifications Enabled! 🔔', {
      body: 'You will now receive instant alerts for classes, attendance & exams.'
    })
  }
  dismissBanner()
}

const dismissBanner = () => {
  // Mark as seen so it ONLY pops up on the 1st visit
  localStorage.setItem('cm_pwa_banner_seen', 'true')
  showBanner.value = false
}
</script>

<style scoped lang="scss">
.pwa-banner-root {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 92%;
  max-width: 850px;
  z-index: 99999 !important;
}

.pwa-banner-card {
  background: rgba(13, 18, 77, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}

.glow-shadow {
  box-shadow: 0 0 15px rgba(255, 193, 7, 0.4);
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(255, 193, 7, 0.6);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 100px);
  opacity: 0;
}
</style>
