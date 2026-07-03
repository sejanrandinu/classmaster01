
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
                val => val && val.replace(/\D/g, '').length === 10 || 'අංක 10ක් ඇතුළත් කරන්න'
              ]"
            >
               <template v-slot:prepend>
                  <q-icon name="phone" color="grey-7" size="20px" />
               </template>
            </q-input>


            <!-- Payment Instructions -->
            <div class="q-mb-lg q-pa-lg rounded-borders" style="background: rgba(255,255,255,0.03); border: 2px solid rgba(255,255,255,0.1);">
              <div class="row items-center q-mb-md">
                <q-icon name="payments" color="yellow-6" size="24px" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-bold text-white">Payment Information</div>
              </div>

              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12">
                  <div class="text-caption text-grey-5">Choose Your Payment Option:</div>
                </div>
                <!-- Lifetime -->
                <div class="col-12">
                  <div class="q-pa-md rounded-borders bg-indigo-10 border-indigo">
                    <div class="text-caption text-indigo-3 text-uppercase text-weight-bold">Lifetime Deal</div>
                    <div class="text-h5 text-weight-bold text-white">
                      <span class="text-grey-6 text-strike q-mr-xs text-subtitle1">Rs. 140,000</span> Rs. 130,000
                    </div>
                  </div>
                </div>
                <!-- OR -->
                <div class="col-12 text-center">
                  <q-badge color="grey-9" label="OR" class="q-pa-xs" />
                </div>
                <!-- Monthly -->
                <div class="col-12">
                  <div class="q-pa-md rounded-borders" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                    <div class="text-caption text-grey-5 text-uppercase text-weight-bold">Monthly Plan</div>
                    <div class="text-h5 text-weight-bold text-yellow-6">Rs. 5,000 / month</div>
                  </div>
                </div>
              </div>
              
              <div v-if="adminDetails" class="q-mb-md q-pa-md rounded-borders" style="background: linear-gradient(135deg, rgba(63, 81, 181, 0.2) 0%, rgba(33, 150, 243, 0.1) 100%); border: 1px solid rgba(255,255,255,0.2);">
                <div class="text-caption text-indigo-3 q-mb-sm text-uppercase letter-spacing-widest">Send Payment To:</div>
                <div class="row q-col-gutter-xs">
                  <div class="col-12">
                    <div class="text-body2 text-grey-4">Bank Name</div>
                    <div class="text-subtitle1 text-weight-bold text-white">{{ adminDetails.bank_name || 'Loading...' }}</div>
                  </div>
                  <div class="col-12 q-mt-sm">
                    <div class="text-body2 text-grey-4">Account Number</div>
                    <div class="text-h6 text-weight-bold text-yellow-6">{{ adminDetails.account_number || 'Loading...' }}</div>
                  </div>
                  <div class="col-12 q-mt-sm">
                    <div class="text-body2 text-grey-4">Account Holder</div>
                    <div class="text-body1 text-weight-medium text-white">{{ adminDetails.account_holder_name || 'Loading...' }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="q-pa-md text-center">
                <q-spinner-dots color="indigo-4" size="2em" />
                <div class="text-caption text-grey-5 q-mt-sm">Fetching bank details...</div>
              </div>

              <div class="q-pa-sm rounded bg-indigo-10" style="border: 1px solid rgba(255,255,255,0.1);">
                <div class="text-caption text-grey-3">
                  <q-icon name="info" color="white" size="14px" class="q-mr-xs" />
                  After transfer, send your receipt and email to 
                  <span class="text-weight-bold text-white">0702838364</span> via WhatsApp.
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { auth } from 'src/api'
import VueTurnstile from 'vue-turnstile'

const router = useRouter()
const $q = useQuasar()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const whatsapp = ref('')
const loading = ref(false)
const turnstileToken = ref('')

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
    await auth.register(email.value, password.value, whatsapp.value, turnstileToken.value)

    $q.notify({
      type: 'positive',
      message: 'Registration successful!',
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
