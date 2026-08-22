
<template>
  <q-page class="bg-black text-white flex flex-center relative-position overflow-hidden">
    <!-- Background Elements -->
    <div class="absolute-full">
      <q-img 
        src="~assets/hero_education_dark_1767203133564.png" 
        class="fit" 
        style="opacity: 0.15; filter: grayscale(100%) brightness(0.7);"
      />
      <div class="absolute-full" style="background: radial-gradient(circle at center, transparent 0%, #000 95%);"></div>
    </div>
    
    <!-- Register Card -->
    <div class="container-sm relative-position z-top q-pa-md" style="width: 100%; max-width: 480px;">
      <div class="glass-card q-pa-xl rounded-borders">
         <div class="text-center q-mb-xl">
            <q-avatar size="64px" class="q-mb-md">
               <img src="/favicon.svg">
            </q-avatar>
            <h2 class="text-h3 text-weight-bold q-mb-sm letter-spacing-tight">Create Account</h2>
            <p class="text-grey-5 text-center">Join ClassMaster. Start your 7-day free trial now.</p>
         </div>

         <q-form @submit="onSubmit" class="q-gutter-y-lg">
            <q-input 
              v-model="email" 
              label="Email Address" 
              dark 
              outlined 
              dense
              class="custom-input"
              :rules="[ val => val && val.length > 0 || 'Please type your email']"
            >
               <template v-slot:prepend>
                  <q-icon name="email" color="grey-7" size="20px" />
               </template>
            </q-input>

            <q-input 
              v-model="password" 
              label="Password" 
              type="password" 
              dark 
              outlined 
              dense
              class="custom-input"
              :rules="[ 
                val => val && val.length > 0 || 'Please type your password',
                val => val.length >= 6 || 'Password must be at least 6 characters'
              ]"
            >
               <template v-slot:prepend>
                  <q-icon name="lock" color="grey-7" size="20px" />
               </template>
            </q-input>

            <q-input 
              v-model="confirmPassword" 
              label="Confirm Password" 
              type="password" 
              dark 
              outlined 
              dense
              class="custom-input"
              :rules="[ 
                val => val && val === password || 'Passwords do not match'
              ]"
            >
               <template v-slot:prepend>
                  <q-icon name="lock_clock" color="grey-7" size="20px" />
               </template>
            </q-input>

            <q-input 
              v-model="whatsapp" 
              label="WhatsApp Number" 
              dark 
              outlined 
              dense
              placeholder="e.g. 0702838364"
              class="custom-input q-mb-md"
              :rules="[ 
                val => val && val.replace(/\D/g, '').length >= 9 || (appStore.language === 'English' ? 'Please enter a valid phone number' : 'කරුණාකර වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න')
              ]"
            >
               <template v-slot:prepend>
                  <q-icon name="phone" color="grey-7" size="20px" />
               </template>
            </q-input>

            <!-- Package Selection Grid -->
            <div class="q-mb-lg q-pa-md rounded-borders" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);">
              <div class="row items-center justify-between q-mb-sm">
                <div class="row items-center">
                  <q-icon name="stars" color="yellow-6" size="20px" class="q-mr-xs" />
                  <span class="text-subtitle2 text-weight-bold text-white">Select Package</span>
                </div>
                <div class="row q-gutter-xs">
                  <q-btn 
                    dense 
                    flat 
                    no-caps 
                    size="xs" 
                    :color="activeBillingCycle === 'monthly' ? 'yellow-6' : 'grey-5'"
                    label="Monthly" 
                    @click="activeBillingCycle = 'monthly'" 
                  />
                  <q-btn 
                    dense 
                    flat 
                    no-caps 
                    size="xs" 
                    :color="activeBillingCycle === 'annual' ? 'yellow-6' : 'grey-5'"
                    label="Annual" 
                    @click="activeBillingCycle = 'annual'" 
                  />
                  <q-btn 
                    dense 
                    flat 
                    no-caps 
                    size="xs" 
                    :color="activeBillingCycle === 'lifetime' ? 'yellow-6' : 'grey-5'"
                    label="Lifetime" 
                    @click="activeBillingCycle = 'lifetime'" 
                  />
                </div>
              </div>

              <!-- 4 Tier Selector Buttons -->
              <div class="row q-col-gutter-xs q-mb-md">
                <div v-for="pkg in packagesList" :key="pkg.id" class="col-6">
                  <div 
                    class="q-pa-xs rounded-borders text-center cursor-pointer transition-all border-grey"
                    :class="selectedPackageId === pkg.id ? 'bg-indigo-10 border-indigo' : 'bg-grey-10'"
                    @click="selectedPackageId = pkg.id"
                  >
                    <div class="text-caption text-weight-bold text-white" style="font-size: 0.75rem;">{{ pkg.name }}</div>
                    <div class="text-subtitle2 text-weight-bolder text-yellow-5" style="font-size: 0.85rem;">
                      LKR {{ getPackageDisplayPrice(pkg).toLocaleString() }}
                    </div>
                    <div class="text-caption text-grey-5" style="font-size: 0.65rem;">
                      {{ activeBillingCycle === 'lifetime' ? 'Lifetime' : (activeBillingCycle === 'annual' ? '/yr' : '/mo') }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bank Details Info -->
              <div class="q-pa-sm rounded-borders bg-black border-dark text-caption" style="border: 1px solid rgba(255,255,255,0.1);">
                <div class="text-caption text-indigo-3 text-uppercase text-weight-bold q-mb-xs">Bank Transfer Details:</div>
                <div class="row items-center justify-between text-grey-4">
                  <span>Bank: <strong class="text-white">{{ adminDetails.bank_name }}</strong></span>
                  <span>Acc: <strong class="text-yellow-5">{{ adminDetails.account_number }}</strong></span>
                </div>
                <div class="text-grey-4 q-mt-xs">
                  Holder: <strong class="text-white">{{ adminDetails.account_holder_name }}</strong>
                </div>
                <div class="text-grey-4 q-mt-xs flex items-center">
                  <q-icon name="info" color="yellow-6" size="14px" class="q-mr-xs" />
                  Send slip & email to <strong>0702838364</strong> via WhatsApp.
                </div>
              </div>
            </div>

            <!-- Cloudflare Turnstile -->
            <div class="q-mb-md flex flex-center">
              <VueTurnstile site-key="0x4AAAAAADHUUksPvPEHMfdp" v-model="turnstileToken" />
            </div>

            <q-btn 
              type="submit"
              label="Register" 
              color="white" 
              text-color="black" 
              rounded 
              unelevated 
              no-caps 
              size="lg" 
              class="full-width text-weight-bold hover-glow" 
              :loading="loading"
            />
         </q-form>

         <div class="text-center q-mt-xl text-grey-5">
            Already have an account? <router-link to="/login" class="text-white text-weight-bold" style="text-decoration: none;">Sign In</router-link>
         </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { auth } from 'src/api'
import VueTurnstile from 'vue-turnstile'
import { useAppStore } from 'src/store/app'
import { useSubscriptionStore } from 'src/store/subscription'

const router = useRouter()
const $q = useQuasar()
const appStore = useAppStore()
const subStore = useSubscriptionStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const whatsapp = ref('')
const loading = ref(false)
const turnstileToken = ref('')
const selectedPackageId = ref('enterprise')
const activeBillingCycle = ref('monthly')

const packagesList = ref(subStore.packagesList)

onMounted(async () => {
  await subStore.fetchPackages()
  packagesList.value = subStore.packagesList
})

const getPackageDisplayPrice = (pkg) => {
  if (!pkg || !pkg.prices) return 0
  return pkg.prices[activeBillingCycle.value] || pkg.prices.monthly
}

const adminDetails = ref({
  bank_name: 'Bank of Ceylon (BOC)',
  account_number: '86019560',
  account_holder_name: 'B.L. Ruwan Manjula'
})

const onSubmit = async () => {
  if (!turnstileToken.value) {
    $q.notify({
      type: 'warning',
      message: 'Please complete the security check',
      position: 'top'
    })
    return
  }

  loading.value = true
  
  try {
    await auth.register(email.value, password.value, whatsapp.value, turnstileToken.value, selectedPackageId.value, activeBillingCycle.value)

    $q.notify({
      type: 'positive',
      message: 'Registration successful! Your account is pending Super Admin approval.',
      position: 'top',
      timeout: 5000
    })
    
    router.push('/dashboard')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error registering',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

</script>

<style scoped lang="scss">
.custom-input {
  :deep(.q-field__control) {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    
    &:before {
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    &:hover:before {
      border-color: rgba(255, 255, 255, 0.3);
    }
  }
  
  :deep(.q-field__native) {
    color: white;
  }
  
  :deep(.q-field__label) {
    color: #888;
  }
}

.hover-glow {
  transition: all 0.3s ease;
  &:hover {
    box-shadow: 0 0 25px rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
}

.border-indigo {
  border: 1px solid rgba(63, 81, 181, 0.4) !important;
  box-shadow: 0 0 20px rgba(63, 81, 181, 0.2);
}

.google-btn {
  transition: all 0.3s ease;
  &:hover:not(:disabled) {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
