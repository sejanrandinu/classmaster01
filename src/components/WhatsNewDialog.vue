<template>
  <q-dialog v-model="dialogOpen" transition-show="scale" transition-hide="scale">
    <q-card class="whats-new-card rounded-borders overflow-hidden" style="width: 680px; max-width: 95vw; background: #0f172a; color: #f8fafc;">
      
      <!-- Header with glowing gradient -->
      <div class="q-pa-lg text-white relative-position header-gradient border-bottom-glow">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center q-gutter-sm">
            <q-avatar color="amber-9" text-color="dark" icon="auto_awesome" size="42px" class="shadow-4 glow-icon" />
            <div>
              <div class="row items-center q-gutter-xs">
                <span class="text-h6 text-weight-bolder letter-spacing-tight">
                  {{ isSinhala ? "ClassMaster හි නව විශේෂාංග" : "What's New in ClassMaster" }}
                </span>
                <q-chip dense color="amber" text-color="dark" class="text-weight-bolder text-caption q-ml-sm">
                  v3.2.0 LATEST
                </q-chip>
              </div>
              <div class="text-caption text-grey-4">
                {{ isSinhala ? "නවතම යාවත්කාලීන කිරීම් සහ වැඩිදියුණු කිරීම්" : "Latest features, updates & performance improvements" }}
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="grey-4" v-close-popup />
        </div>
      </div>

      <!-- Navigation Tabs -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey-4 bg-slate-900 border-bottom-dark"
        active-color="amber"
        indicator-color="amber"
        align="justify"
        narrow-indicator
      >
        <q-tab name="latest" no-caps>
          <div class="row items-center q-gutter-xs">
            <q-icon name="rocket_launch" color="amber" size="18px" />
            <span class="text-weight-bold">{{ isSinhala ? "නවතම එකතු කිරීම් (v3.2)" : "v3.2.0 Highlights" }}</span>
          </div>
        </q-tab>
        <q-tab name="history" no-caps>
          <div class="row items-center q-gutter-xs">
            <q-icon name="history" size="18px" />
            <span>{{ isSinhala ? "පෙර යාවත්කාලීන (History)" : "Version History" }}</span>
          </div>
        </q-tab>
      </q-tabs>

      <q-separator color="grey-8" />

      <!-- Tab Content -->
      <q-card-section class="q-pa-md scroll-section" style="max-height: 60vh; overflow-y: auto;">
        
        <!-- ============ LATEST TAB ============ -->
        <div v-if="activeTab === 'latest'" class="column q-gutter-md">
          
          <!-- Banner Hero -->
          <div class="hero-box q-pa-md rounded-borders border-amber-subtle">
            <div class="row items-center justify-between">
              <div>
                <div class="text-subtitle1 text-weight-bold text-amber-4">
                  🎉 {{ isSinhala ? "v3.2 යාවත්කාලීනය සක්‍රියයි!" : "Version 3.2.0 is Live!" }}
                </div>
                <div class="text-caption text-grey-3">
                  {{ isSinhala ? "ඔන්ලයින් MCQ විභාග, ප්‍රවර්ධන කේත, සහ නම්‍යශීලී ගෙවීම් පද්ධතිය ඇතුළු නව අංග රැසක් එකතු කර ඇත." : "Packed with Online MCQ Exams, Promo Code Discounts, Billing Cycles, and PWA Enhancements." }}
                </div>
              </div>
              <q-badge color="amber-10" text-color="white" class="q-pa-xs text-caption">Sept 2026</q-badge>
            </div>
          </div>

          <!-- Feature 1: Online Exams -->
          <div class="feature-card q-pa-md rounded-borders glass-card border-purple">
            <div class="row items-start no-wrap q-gutter-md">
              <q-avatar icon="quiz" color="purple-9" text-color="white" size="44px" rounded class="shadow-2" />
              <div class="col">
                <div class="row items-center justify-between">
                  <div class="text-subtitle1 text-weight-bold text-purple-2">
                    1. {{ isSinhala ? "ඔන්ලයින් MCQ විභාග පද්ධතිය (Online Exams)" : "Online MCQ Examination Engine" }}
                  </div>
                  <q-chip dense color="purple" text-color="white" size="sm" class="text-weight-bold">STUDENT PORTAL</q-chip>
                </div>
                <div class="text-body2 text-grey-3 q-mt-xs">
                  {{ isSinhala 
                    ? "ශිෂ්‍යයින්ට Student Portal හරහා නියමිත කාල සීමාව ඇතුලත MCQ පරීක්ෂණ සජීවීව කිරීමට පහසුකම් සලසා ඇත. ස්වයංක්‍රීය ලකුණු ලබාදීම, Real-time Countdown Timer සහ ලකුණු විස්තර සටහන ක්ෂණිකව ලබාගත හැක."
                    : "Students can now attempt interactive MCQ exams directly in the Student Portal with countdown timers, auto-grading, pass/fail thresholds, and detailed breakdown cards."
                  }}
                </div>
                <div class="q-mt-sm row q-gutter-xs">
                  <q-chip outline dense color="purple-3" size="xs" icon="timer">Real-time Countdown</q-chip>
                  <q-chip outline dense color="purple-3" size="xs" icon="auto_graph">Auto-Grading</q-chip>
                  <q-chip outline dense color="purple-3" size="xs" icon="verified">Instant Results</q-chip>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature 2: Promo Codes -->
          <div class="feature-card q-pa-md rounded-borders glass-card border-green">
            <div class="row items-start no-wrap q-gutter-md">
              <q-avatar icon="confirmation_number" color="teal-9" text-color="white" size="44px" rounded class="shadow-2" />
              <div class="col">
                <div class="row items-center justify-between">
                  <div class="text-subtitle1 text-weight-bold text-teal-2">
                    2. {{ isSinhala ? "ප්‍රවර්ධන කේත සහ වට්ටම් (Promo Codes & Discounts)" : "Promo Codes & Institute Discounts" }}
                  </div>
                  <q-chip dense color="teal-7" text-color="white" size="sm" class="text-weight-bold">REGISTRATION</q-chip>
                </div>
                <div class="text-body2 text-grey-3 q-mt-xs">
                  {{ isSinhala 
                    ? "ලියාපදිංචි වීමේදී Promo Codes (උදා: WELCOME20, ANNUAL50) ඇතුළත් කර ක්ෂණික මිල අඩු කිරීම් ලබාගත හැක. Admin Console මගින් නව කේත සෑදීමටද හැක."
                    : "Apply promotional discount codes during registration or packages checkout to get instant price reductions. Fully configurable from Promo Codes admin page."
                  }}
                </div>
                <div class="q-mt-sm row q-gutter-xs">
                  <q-chip outline dense color="teal-3" size="xs" icon="local_offer">WELCOME20 (20% OFF)</q-chip>
                  <q-chip outline dense color="teal-3" size="xs" icon="percent">ANNUAL50 (50% OFF)</q-chip>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature 3: Billing Cycles -->
          <div class="feature-card q-pa-md rounded-borders glass-card border-blue">
            <div class="row items-start no-wrap q-gutter-md">
              <q-avatar icon="card_membership" color="indigo-9" text-color="white" size="44px" rounded class="shadow-2" />
              <div class="col">
                <div class="row items-center justify-between">
                  <div class="text-subtitle1 text-weight-bold text-indigo-2">
                    3. {{ isSinhala ? "නම්‍යශීලී ගෙවීම් වටසටහන් (Flexible Billing Cycles)" : "Flexible Subscription Billing Cycles" }}
                  </div>
                  <q-chip dense color="indigo" text-color="white" size="sm" class="text-weight-bold">PRICING</q-chip>
                </div>
                <div class="text-body2 text-grey-3 q-mt-xs">
                  {{ isSinhala 
                    ? "මාසික (Monthly), වාර්ෂික (Annual - විශේෂ වාසි සහිත), හෝ Lifetime Plans තෝරාගැනීමට මුල් පිටුවේම පහසුකම් සලසා ඇත."
                    : "Select between Monthly, Annual (with built-in discount savings), or Lifetime access plans right inside the front-page registration form."
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- Feature 4: PWA App -->
          <div class="feature-card q-pa-md rounded-borders glass-card border-amber">
            <div class="row items-start no-wrap q-gutter-md">
              <q-avatar icon="phone_iphone" color="amber-10" text-color="dark" size="44px" rounded class="shadow-2" />
              <div class="col">
                <div class="row items-center justify-between">
                  <div class="text-subtitle1 text-weight-bold text-amber-3">
                    4. {{ isSinhala ? "ස්ථාපනය කළ හැකි PWA App එක (PWA Improvements)" : "Installable Mobile PWA & Offline Access" }}
                  </div>
                  <q-chip dense color="amber-9" text-color="dark" size="sm" class="text-weight-bold">PWA</q-chip>
                </div>
                <div class="text-body2 text-grey-3 q-mt-xs">
                  {{ isSinhala 
                    ? "දුරකථනයට හෝ පරිගණකයට ClassMaster App එකක් ලෙස කෙලින්ම Install කර ගැනීමට පහසු Install Banner එකක් සහ වේගවත් Offline support එකතු කර ඇත."
                    : "Install ClassMaster as a native desktop or smartphone web app with offline capabilities and single-click prompt banners."
                  }}
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ============ HISTORY TAB ============ -->
        <div v-else class="column q-gutter-y-lg q-pa-xs">
          
          <!-- v3.1 Timeline -->
          <div class="history-item relative-position q-pl-lg border-left-amber">
            <div class="row items-center justify-between">
              <div class="text-subtitle1 text-weight-bold text-amber-4">v3.1.0 — QR Attendance & SMS Engine</div>
              <q-badge color="grey-8">August 2026</q-badge>
            </div>
            <ul class="text-body2 text-grey-4 q-mt-xs q-pl-md">
              <li>QR Code Attendance scanner for lightning-fast student entry marking</li>
              <li>Bulk SMS Notifications via Notify.lk & Arkesel gateways</li>
              <li>Attendance History & Absence alert triggers</li>
            </ul>
          </div>

          <!-- v3.0 Timeline -->
          <div class="history-item relative-position q-pl-lg border-left-indigo">
            <div class="row items-center justify-between">
              <div class="text-subtitle1 text-weight-bold text-indigo-3">v3.0.0 — Multi-Campus & Discipline Portal</div>
              <q-badge color="grey-8">July 2026</q-badge>
            </div>
            <ul class="text-body2 text-grey-4 q-mt-xs q-pl-md">
              <li>Multi-campus Institute switcher for managing multiple tuition branches</li>
              <li>Student Discipline records tracking & parental notification system</li>
              <li>Tute & Study Material distribution module</li>
            </ul>
          </div>

          <!-- v2.5 Timeline -->
          <div class="history-item relative-position q-pl-lg border-left-grey">
            <div class="row items-center justify-between">
              <div class="text-subtitle1 text-weight-bold text-grey-4">v2.5.0 — Core Tuition Management</div>
              <q-badge color="grey-8">June 2026</q-badge>
            </div>
            <ul class="text-body2 text-grey-4 q-mt-xs q-pl-md">
              <li>Student fee collection, receipts & outstanding balance tracking</li>
              <li>Class & Subject scheduler with Tutor management</li>
            </ul>
          </div>

        </div>

      </q-card-section>

      <q-separator color="grey-8" />

      <!-- Footer -->
      <q-card-actions align="between" class="q-pa-md bg-slate-950">
        <q-checkbox
          v-model="dontShowAgain"
          color="amber"
          dark
          dense
          :label="isSinhala ? 'නැවත මෙම යාවත්කාලීනය සදහා පෙන්වන්න එපා' : 'Don\'t auto-show for this update'"
          class="text-grey-4 text-caption"
        />
        
        <q-btn
          unelevated
          color="amber-9"
          text-color="dark"
          no-caps
          class="text-weight-bolder q-px-lg rounded-borders shadow-4"
          @click="closeAndMarkSeen"
        >
          <q-icon name="check_circle" size="18px" class="q-mr-xs" />
          {{ isSinhala ? "තේරුණා! (Awesome, Got It)" : "Awesome, Got It!" }}
        </q-btn>
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from 'src/store/app'

const CURRENT_VERSION = 'v3.2.0'
const STORAGE_KEY = 'classmaster_seen_whats_new_version'

const appStore = useAppStore()
const isSinhala = computed(() => appStore.language !== 'English')

const dialogOpen = ref(false)
const activeTab = ref('latest')
const dontShowAgain = ref(true)

const openDialog = () => {
  activeTab.value = 'latest'
  dialogOpen.value = true
}

const closeAndMarkSeen = () => {
  if (dontShowAgain.value) {
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION)
    } catch (e) {
      console.error(e)
    }
  }
  dialogOpen.value = false
}

// Global listener to allow opening from anywhere in the app
const handleOpenEvent = () => {
  openDialog()
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('open-whats-new', handleOpenEvent)

    // Auto show if new version has not been seen
    const seenVersion = localStorage.getItem(STORAGE_KEY)
    if (seenVersion !== CURRENT_VERSION) {
      setTimeout(() => {
        dialogOpen.value = true
      }, 1000)
    }
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('open-whats-new', handleOpenEvent)
  }
})

defineExpose({
  openDialog
})
</script>

<style lang="scss" scoped>
.whats-new-card {
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.header-gradient {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311b92 100%);
}

.border-bottom-glow {
  border-bottom: 2px solid rgba(245, 158, 11, 0.4);
}

.glow-icon {
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);
}

.bg-slate-900 {
  background-color: #0f172a;
}

.bg-slate-950 {
  background-color: #090d16;
}

.border-bottom-dark {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-box {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.glass-card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
}

.border-purple { border-left: 4px solid #a855f7; }
.border-green { border-left: 4px solid #10b981; }
.border-blue { border-left: 4px solid #6366f1; }
.border-amber { border-left: 4px solid #f59e0b; }

.border-left-amber { border-left: 3px solid #f59e0b; }
.border-left-indigo { border-left: 3px solid #6366f1; }
.border-left-grey { border-left: 3px solid #64748b; }

.scroll-section {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
}
</style>
