<template>
  <q-layout view="hHh lpR fff">
    <q-header bordered class="bg-black text-white" style="z-index: 9999 !important;">
      <q-toolbar class="container-xl q-py-sm">
        <q-btn flat no-caps no-wrap to="/" class="q-ml-none">
          <q-avatar size="32px" class="q-mr-sm">
            <img src="/favicon.svg">
          </q-avatar>
          <q-toolbar-title shrink class="text-weight-bolder letter-spacing-tight" style="font-size: 1.3rem;">
            ClassMaster
          </q-toolbar-title>
        </q-btn>

        <q-space />

        <div class="q-gutter-sm row items-center gt-sm">
          <q-btn flat rounded label="Home" to="/" class="text-white text-weight-medium" no-caps />
          <q-btn flat rounded label="Features" href="/#features" class="text-white text-weight-medium" no-caps />
          <q-btn flat rounded label="Student Portal" to="/student-portal" class="text-indigo-2 text-weight-bold" no-caps icon="school" />
            
          <template v-if="!user">
             <q-btn flat rounded label="Login" to="/login" class="text-white text-weight-medium" no-caps />
             <q-btn rounded color="white" text-color="black" label="Get Started" to="/register" class="q-ml-md text-weight-bold q-px-lg" no-caps />
          </template>
            
          <template v-else>
             <q-btn flat rounded label="Dashboard" to="/dashboard" class="text-white text-weight-medium" no-caps />
             <q-btn flat rounded label="Logout" @click="handleLogout" class="text-white text-weight-medium" no-caps />
          </template>
        </div>
          
      </q-toolbar>
    </q-header>

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
                sejanrandinu01@gmail.com
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
  </q-layout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from 'src/api'
import { useQuasar } from 'quasar'
import ChatbotComponent from 'src/components/ChatbotComponent.vue'

const router = useRouter()
const $q = useQuasar()

const user = ref(null)

const handleLogout = async () => {
    auth.logout()
    // Force clear all local state
    if (typeof window !== 'undefined') {
        window.localStorage.clear()
        window.sessionStorage.clear()
    }

    router.push('/')
    user.value = null
    $q.notify({
        type: 'positive',
        message: 'App reset & logged out'
    })
}

// Monetag ad zones for landing/public pages
const MONETAG_ZONES = [
    { zone: '11348086', src: 'https://al5sm.com/tag.min.js' },
    { zone: '11348093', src: 'https://n6wxm.com/vignette.min.js' },
    { zone: '11348096', src: 'https://nap5k.com/tag.min.js' },
]
const monetagScripts = []

const injectMonetag = () => {
    MONETAG_ZONES.forEach(({ zone, src }) => {
        const s = document.createElement('script')
        s.dataset.zone = zone
        s.src = src
        s.async = true
        s.setAttribute('data-monetag-injected', 'landing')
        document.head.appendChild(s)
        monetagScripts.push(s)
    })
}

const removeMonetag = () => {
    monetagScripts.forEach(s => s.parentNode && s.parentNode.removeChild(s))
    monetagScripts.length = 0
}

onMounted(async () => {
    // Get initial user from local storage
    const userData = localStorage.getItem('classmaster-user')
    if (userData) {
        user.value = JSON.parse(userData)
    }

    // Inject Monetag ads on all public/landing pages
    injectMonetag()
})

onUnmounted(() => {
    removeMonetag()
})

const openWhatsapp = () => {
  window.open('https://wa.me/94702838364', '_blank')
}
</script>

<style lang="scss" scoped>


.hover-white {
  transition: all 0.3s ease;
  &:hover {
    color: white !important;
  }
}

.border-top {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.custom-input {
  :deep(.q-field--outlined .q-field__control) {
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    &:before {
      border-color: rgba(255, 255, 255, 0.1);
    }
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
</style>

