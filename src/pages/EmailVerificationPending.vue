
<template>
  <q-page class="bg-black text-white flex flex-center">
    <div class="container-sm q-pa-md text-center" style="max-width: 500px;">
      <div class="glass-card q-pa-xl rounded-borders">
        <q-icon name="mark_email_unread" color="primary" size="80px" class="q-mb-lg" />
        <h2 class="text-h4 text-weight-bold q-mb-md">Verify Your Email</h2>
        <p class="text-grey-5 q-mb-xl">
          We've sent a verification link to your email. Please check your inbox and click the link to activate your account.
          You won't be able to access the dashboard until your email is verified.
        </p>
        
        <div class="q-gutter-y-md">
          <q-btn 
            color="primary" 
            label="I've Verified My Email" 
            class="full-width premium-btn" 
            size="lg"
            unelevated
            no-caps
            @click="checkStatus"
            :loading="loading"
          />
          
          <q-btn 
            flat 
            color="grey-5" 
            label="Resend Verification Email" 
            class="full-width"
            no-caps
            @click="resendEmail"
            :disable="cooldown > 0"
          >
            <template v-if="cooldown > 0"> (Wait {{ cooldown }}s)</template>
          </q-btn>
          
          <q-btn 
            flat 
            color="red-5" 
            label="Logout" 
            class="full-width q-mt-md"
            no-caps
            @click="logout"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { auth } from 'src/api'

const router = useRouter()
const $q = useQuasar()
const loading = ref(false)
const cooldown = ref(0)
let timer = null

onMounted(() => {
    // Check if user is already verified
    checkStatus()
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
})

const checkStatus = async () => {
    loading.value = true
    try {
        const user = await auth.getUser()
        if (user && user.is_verified) {
            $q.notify({ type: 'positive', message: 'Email verified! Redirecting...' })
            router.push('/dashboard')
        } else {
            if (!loading.value) {
                $q.notify({ type: 'info', message: 'Email not verified yet. Please check your inbox.' })
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const resendEmail = async () => {
    try {
        const user = JSON.parse(localStorage.getItem('classmaster-user') || '{}')
        if (!user.email) {
            $q.notify({ type: 'negative', message: 'User email not found. Please login again.' })
            return
        }

        // Logic to trigger resend via EmailJS or Backend
        // For now, we assume the backend has an endpoint or we re-trigger registration logic
        // But since we are using EmailJS, we might need a token from backend
        const res = await auth.getUser() // Get latest status/token
        if (res.verificationToken) {
            const { emailService } = await import('src/utils/email')
            await emailService.sendVerificationEmail(res.email, res.verificationToken)
            $q.notify({ type: 'positive', message: 'Verification email resent!' })
            
            // Start cooldown
            cooldown.value = 60
            timer = setInterval(() => {
                cooldown.value--
                if (cooldown.value <= 0) clearInterval(timer)
            }, 1000)
        }
    } catch (e) {
        $q.notify({ type: 'negative', message: 'Failed to resend email' })
    }
}

const logout = () => {
    auth.logout()
}
</script>
