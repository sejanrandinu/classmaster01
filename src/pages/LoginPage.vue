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
    
    <!-- Login Card -->
    <div class="container-sm relative-position z-top q-pa-md" style="width: 100%; max-width: 480px;">
      <div class="glass-card q-pa-xl rounded-borders shadow-24">
         <div class="text-center q-mb-xl">
            <q-avatar size="64px" class="q-mb-md">
               <q-img src="/favicon.svg" style="width: 80px; height: 80px" class="q-mb-md" />
            </q-avatar>
            <div class="text-caption text-grey-5 q-mb-md">System Version: 3.1-vFix</div>
            <h1 class="text-h4 text-weight-bold text-grey-9 q-mb-xs">Welcome Back</h1>
            <p class="text-grey-5">Sign in to manage your institute</p>
         </div>

            <div v-if="errorMessage" class="bg-red-9 text-white q-pa-sm rounded-borders text-center q-mb-lg flex flex-center border-red">
               <q-icon name="error" class="q-mr-sm" /> {{ errorMessage }}
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
                 :rules="[ val => val && val.length > 0 || 'Please type your password']"
               >
                  <template v-slot:prepend>
                     <q-icon name="lock" color="grey-7" size="20px" />
                  </template>
               </q-input>


               <div class="q-mt-lg flex flex-center">
                 <VueTurnstile site-key="0x4AAAAAADHUUksPvPEHMfdp" v-model="turnstileToken" />
               </div>

               <div class="q-mt-lg">
                 <q-btn 
                   type="submit"
                   label="Sign In" 
                   color="white" 
                   text-color="black" 
                   rounded 
                   unelevated 
                   no-caps 
                   size="lg" 
                   class="full-width text-weight-bold hover-glow" 
                   style="height: 56px;"
                   :loading="loading"
                 />
               </div>
            </q-form>

            <div class="text-center q-mt-xl text-grey-5">
               Don't have an account? <router-link to="/register" class="text-white text-weight-bold" style="text-decoration: none;">Register Now</router-link>
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

const router = useRouter()
const $q = useQuasar()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const turnstileToken = ref('')

onMounted(() => {
  try {
    const storage = window.localStorage;
    if (storage) {
      storage.setItem('cm_storage_check', 'ok')
      storage.removeItem('cm_storage_check')
    } else {
       throw new Error('Local storage not available');
    }
  } catch (e) {
    console.warn('Storage access blocked:', e)
    errorMessage.value = 'ඔබගේ පිරික්සුම් යන්ත්‍රය (Browser) විසින් Site Data ලබා ගැනීම අවහිර කර ඇත. කරුණාකර Browser settings හරහා Cookies සහ Site Data ලබා ගැනීමට අවසර දෙන්න.'
    $q.notify({
      type: 'negative',
      message: 'Storage Blocked! පද්ධතිය නිවැරදිව ක්‍රියා කිරීමට site data අවශ්‍ය වේ.',
      position: 'top',
      timeout: 0,
      actions: [{ label: 'Fix Settings', color: 'yellow', handler: () => {
         window.open('https://support.google.com/chrome/answer/95647', '_blank')
      }}]
    })
  }
})

const onSubmit = async () => {
  if (!turnstileToken.value) {
    errorMessage.value = 'Please complete the security check.'
    return
  }

  console.log('Sign in button clicked, preparing to submit...')
  loading.value = true
  errorMessage.value = ''
  
  try {
    console.log('Attempting custom API sign in for:', email.value)
    await auth.login(email.value, password.value, turnstileToken.value)

    console.log('Login successful, notifying user...')
    $q.notify({
      type: 'positive',
      message: 'Successfully logged in!',
      position: 'top'
    })
    
    console.log('Redirecting to dashboard...')
    router.replace('/dashboard')
  } catch (error) {
    console.error('Full login error object:', error)
    let msg = error.message || 'Error logging in'
    
    if (msg.includes('Invalid credentials')) {
      msg = 'Incorrect email or password.'
    }
    
    errorMessage.value = msg
    
    $q.notify({
      type: 'negative',
      message: msg,
      position: 'top',
      timeout: 5000
    })
  } finally {
    loading.value = false
  }
}

</script>

<style scoped lang="scss">
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

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

.border-red {
  border: 1px solid rgba(255, 0, 0, 0.2);
}
</style>

