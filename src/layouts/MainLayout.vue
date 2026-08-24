<template>
  <q-layout view="hHh lpR fff">
    <q-header bordered class="bg-black text-white" style="z-index: 9999 !important;">
      <q-toolbar class="container-xl q-py-sm">

        <!-- Logo -->
        <q-btn flat no-caps no-wrap to="/" class="q-ml-none">
          <q-avatar size="32px" class="q-mr-sm">
            <img src="/favicon.svg">
          </q-avatar>
          <q-toolbar-title shrink class="text-weight-bolder letter-spacing-tight" style="font-size: 1.3rem;">
            ClassMaster
          </q-toolbar-title>
        </q-btn>

        <q-space />

        <!-- Desktop Nav (hidden on mobile) -->
        <div class="q-gutter-sm row items-center gt-sm">
          <q-btn flat rounded label="Home" @click="scrollToSection('hero')" class="text-white text-weight-medium" no-caps />
          <q-btn flat rounded label="Features" @click="scrollToSection('features')" class="text-white text-weight-medium" no-caps />
          <q-btn flat rounded label="Pricing" @click="scrollToSection('pricing')" class="text-white text-weight-medium" no-caps />
          <q-btn flat rounded label="Student Portal" to="/student-portal" class="text-indigo-2 text-weight-bold" no-caps icon="school" />

          <q-btn v-if="canInstallPwa" color="indigo-6" icon="get_app" label="Install App" @click="installPwa" no-caps class="q-ml-sm text-weight-bold" />

          <template v-if="!user">
            <q-btn flat rounded label="Login" @click="scrollToAuth('login')" class="text-white text-weight-medium" no-caps />
            <q-btn rounded color="white" text-color="black" label="Get Started" @click="scrollToAuth('register')" class="q-ml-md text-weight-bold q-px-lg" no-caps />
          </template>

          <template v-else>
            <q-btn flat rounded label="Dashboard" to="/dashboard" class="text-white text-weight-medium" no-caps />
            <q-btn flat rounded label="Logout" @click="handleLogout" class="text-white text-weight-medium" no-caps />
          </template>
        </div>

        <!-- Mobile Hamburger (hidden on desktop) -->
        <q-btn
          flat round dense
          icon="menu"
          class="lt-md text-white"
          @click="mobileMenuOpen = true"
          aria-label="Open menu"
        />
      </q-toolbar>
    </q-header>

    <!-- Mobile Slide Drawer -->
    <q-drawer
      v-model="mobileMenuOpen"
      side="right"
      overlay
      bordered
      :width="285"
      style="z-index: 99999 !important;"
    >
      <div class="drawer-inner">

        <!-- Drawer Header -->
        <div class="drawer-header row items-center justify-between q-px-md q-py-sm">
          <div class="row items-center q-gutter-xs">
            <q-avatar size="28px">
              <img src="/favicon.svg">
            </q-avatar>
            <span class="text-white text-weight-bold" style="font-size: 1.05rem; letter-spacing: -0.03em;">ClassMaster</span>
          </div>
          <q-btn flat round dense icon="close" color="grey-5" @click="mobileMenuOpen = false" />
        </div>

        <q-separator style="opacity: 0.12;" />

        <!-- Nav Items -->
        <q-list padding class="q-mt-xs">
          <q-item clickable v-ripple class="drawer-item" @click="navTo('hero')">
            <q-item-section avatar><q-icon name="home" color="indigo-3" size="20px" /></q-item-section>
            <q-item-section class="text-white text-weight-medium">Home</q-item-section>
          </q-item>

          <q-item clickable v-ripple class="drawer-item" @click="navTo('features')">
            <q-item-section avatar><q-icon name="auto_awesome" color="indigo-3" size="20px" /></q-item-section>
            <q-item-section class="text-white text-weight-medium">Features</q-item-section>
          </q-item>

          <q-item clickable v-ripple class="drawer-item" @click="navTo('pricing')">
            <q-item-section avatar><q-icon name="sell" color="indigo-3" size="20px" /></q-item-section>
            <q-item-section class="text-white text-weight-medium">Pricing</q-item-section>
          </q-item>

          <q-item clickable v-ripple class="drawer-item" to="/student-portal" @click="mobileMenuOpen = false">
            <q-item-section avatar><q-icon name="school" color="indigo-3" size="20px" /></q-item-section>
            <q-item-section class="text-indigo-2 text-weight-bold">Student Portal</q-item-section>
          </q-item>
        </q-list>

        <q-separator style="opacity: 0.12;" class="q-mx-md" />

        <!-- Auth Buttons -->
        <div class="q-pa-md column q-gutter-sm">
          <template v-if="!user">
            <q-btn
              outline color="white" label="Login" no-caps
              class="full-width text-weight-medium rounded-borders"
              @click="authAction('login')"
            />
            <q-btn
              color="indigo-5" label="Get Started" no-caps
              class="full-width text-weight-bold rounded-borders"
              @click="authAction('register')"
            />
          </template>

          <template v-else>
            <q-btn
              outline color="indigo-3" label="Dashboard" icon="dashboard" no-caps
              class="full-width text-weight-medium rounded-borders"
              to="/dashboard" @click="mobileMenuOpen = false"
            />
            <q-btn
              flat color="grey-4" label="Logout" icon="logout" no-caps
              class="full-width text-weight-medium"
              @click="handleLogout"
            />
          </template>

          <q-btn
            v-if="canInstallPwa"
            color="indigo-6" icon="get_app" label="Install App" no-caps
            class="full-width text-weight-bold rounded-borders q-mt-xs"
            @click="installPwa"
          />
        </div>

      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-black text-white border-top border-dark q-py-xl">
      <div class="container-xl q-px-md">
        <div class="row q-col-gutter-xl">
          <div class="col-xs-12 col-md-4">
            <div class="row items-center q-mb-lg">
              <q-avatar size="32px" class="q-mr-sm">
                <img src="/favicon.svg">
              </q-avatar>
              <div class="text-h5 text-weight-bold letter-spacing-tight">ClassMaster</div>
            </div>
            <p class="text-grey-5" style="max-width: 300px;">
              Empowering education with technology. The most comprehensive management system for tuition providers globally.
            </p>
          </div>
          <div class="col-xs-6 col-md-2">
            <div class="text-subtitle1 text-weight-bold q-mb-md">Product</div>
            <div class="column q-gutter-sm">
              <a href="/#features" class="text-grey-5 hover-white text-decoration-none">Features</a>
              <router-link to="/student-portal" class="text-grey-5 hover-white text-decoration-none">Student Portal</router-link>
            </div>
          </div>
          <div class="col-xs-6 col-md-2">
            <div class="text-subtitle1 text-weight-bold q-mb-md">Company</div>
            <div class="column q-gutter-sm">
              <router-link to="/about-us" class="text-grey-5 hover-white text-decoration-none">About Us</router-link>
              <router-link to="/contact" class="text-grey-5 hover-white text-decoration-none">Contact</router-link>
            </div>
          </div>
          <div class="col-xs-12 col-md-4">
            <div class="text-subtitle1 text-weight-bold q-mb-md">Contact</div>
            <div class="column q-gutter-sm">
              <div class="text-grey-5 row items-center">
                <q-icon name="mail" size="18px" class="q-mr-sm" />
                superadmin@classmastertms.com
              </div>
              <div class="text-grey-5 row items-center">
                <q-icon name="phone" size="18px" class="q-mr-sm" />
                070 283 8364
              </div>
            </div>
            <div class="row q-gutter-sm q-mt-md">
              <q-btn flat round icon="fa-brands fa-whatsapp" color="grey-7" size="sm" class="hover-white" @click="openWhatsapp" />
            </div>
          </div>
        </div>
        <div class="q-mt-xl pt-lg border-top border-dark row justify-between items-center text-grey-7 text-caption">
          <div>Powered by SER Tech &copy; Copyright 2026</div>
          <div class="row q-gutter-md">
            <router-link to="/privacy-policy" class="hover-white cursor-pointer text-grey-7 text-decoration-none">Privacy Policy</router-link>
            <router-link to="/terms-of-service" class="hover-white cursor-pointer text-grey-7 text-decoration-none">Terms of Service</router-link>
          </div>
        </div>
      </div>
    </q-footer>

    <!-- Chatbot Component -->
    <ChatbotComponent />

    <!-- 1st Visit PWA & Notification Banner -->
    <PwaInstallBanner />
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from 'src/api'
import { useQuasar } from 'quasar'
import ChatbotComponent from 'src/components/ChatbotComponent.vue'
import PwaInstallBanner from 'src/components/PwaInstallBanner.vue'

const router = useRouter()
const $q = useQuasar()

const user = ref(null)
const mobileMenuOpen = ref(false)
const canInstallPwa = ref(false)

// Close drawer + scroll to section
const navTo = (sectionId) => {
  mobileMenuOpen.value = false
  scrollToSection(sectionId)
}

// Close drawer + scroll to auth
const authAction = (tab) => {
  mobileMenuOpen.value = false
  scrollToAuth(tab)
}

const handleLogout = async () => {
  auth.logout()
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
    window.sessionStorage.clear()
  }
  mobileMenuOpen.value = false
  router.push('/')
  user.value = null
  $q.notify({ type: 'positive', message: 'App reset & logged out' })
}

const installPwa = async () => {
  if (window.deferredPwaPrompt) {
    window.deferredPwaPrompt.prompt()
    const choice = await window.deferredPwaPrompt.userChoice
    if (choice.outcome === 'accepted') canInstallPwa.value = false
    window.deferredPwaPrompt = null
  }
  mobileMenuOpen.value = false
}

onMounted(async () => {
  if (typeof window !== 'undefined' && window.deferredPwaPrompt) canInstallPwa.value = true
  window.addEventListener('pwa-install-available', () => { canInstallPwa.value = true })

  const userData = localStorage.getItem('classmaster-user')
  if (userData) user.value = JSON.parse(userData)
})

const openWhatsapp = () => window.open('https://wa.me/94702838364', '_blank')

const scrollToSection = (sectionId) => {
  if (router.currentRoute.value.path !== '/') {
    router.push({ path: '/', hash: `#${sectionId}` })
  } else {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
  }
}

const scrollToAuth = (tab = 'register') => {
  if (router.currentRoute.value.path !== '/') {
    router.push({ path: '/', query: { tab }, hash: '#auth-section' })
  } else {
    window.dispatchEvent(new CustomEvent('switch-auth-tab', { detail: tab }))
    document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style lang="scss" scoped>
.hover-white {
  transition: all 0.3s ease;
  &:hover { color: white !important; }
}

.border-top {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.custom-input {
  :deep(.q-field--outlined .q-field__control) {
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    &:before { border-color: rgba(255, 255, 255, 0.1); }
  }
}

a {
  text-decoration: none;
  transition: color 0.3s;
  font-size: 0.9rem;
}

.letter-spacing-tight {
  letter-spacing: -0.05em;
}

/* ── Mobile Drawer ── */
:deep(.q-drawer) {
  background: linear-gradient(160deg, #0d1240 0%, #080b1a 100%) !important;
  border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.drawer-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  min-height: 56px;
  background: rgba(255, 255, 255, 0.03);
}

.drawer-item {
  border-radius: 10px;
  margin: 2px 8px;
  min-height: 48px;
  transition: background 0.2s ease;
  &:hover { background: rgba(99, 102, 241, 0.15) !important; }
}
</style>
