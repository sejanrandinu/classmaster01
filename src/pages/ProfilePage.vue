<template>
  <q-page class="q-pa-lg bg-grey-1">
    <div class="row q-col-gutter-lg">
      <div class="col-12">
        <h1 class="text-h4 text-weight-bold text-grey-9 q-mb-lg">My Profile</h1>
      </div>

      <!-- Profile Card -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="rounded-borders bg-white">
          <q-card-section class="text-center q-pa-xl">
            <q-avatar size="120px" font-size="52px" color="primary" text-color="white" class="shadow-10 q-mb-md profile-avatar-glow">
              <img v-if="profile.profile_image_url" :src="profile.profile_image_url">
              <template v-else>{{ profile.email ? profile.email.charAt(0).toUpperCase() : 'U' }}</template>
            </q-avatar>
            <div class="text-h5 text-weight-bold text-grey-9">{{ profile.email }}</div>
            <q-chip color="green-1" text-color="green-8" class="q-mt-sm text-weight-bold" icon="verified">
              {{ isApproved ? (isSuperAdminEmail(profile.email) ? 'Super Admin' : 'Approved Member') : 'Pending Approval' }}
            </q-chip>
          </q-card-section>
          
          <q-separator />
          
          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-subtitle2 text-grey-6 q-mb-xs">Member Since</div>
                <div class="text-body1 text-weight-medium">{{ formatDate(profile.created_at) }}</div>
              </div>
              <div class="col-6">
                <div class="text-subtitle2 text-grey-6 q-mb-xs">Trial Status</div>
                <q-badge :color="isTrialActive ? 'orange' : 'red'" class="q-pa-xs">
                  {{ isTrialActive ? 'Trial Active' : 'Trial Expired' }}
                </q-badge>
                <div v-if="isTrialActive" class="text-caption text-grey-7 q-mt-xs">
                  Ends: {{ formatDate(profile.trial_ends_at) }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Edit Profile Form -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="rounded-borders bg-white">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">Profile Details</div>
            <q-form @submit="updateProfile" class="q-gutter-md">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input 
                    outlined 
                    v-model="profile.email" 
                    label="Email Address" 
                    readonly 
                    bg-color="grey-1"
                  >
                    <template v-slot:prepend><q-icon name="email" color="grey-7" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <q-input 
                    outlined 
                    v-model="profile.whatsapp_number" 
                    label="WhatsApp Number" 
                    hint="Format: 0771234567"
                    :rules="[val => !val || val.replace(/\D/g, '').length >= 9 || (appStore.language === 'English' ? 'Please enter a valid phone number' : 'කරුණාකර වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න')]"
                  >
                    <template v-slot:prepend><q-icon name="fa-brands fa-whatsapp" color="green-7" /></template>
                  </q-input>
                </div>
              </div>

              <!-- Bank Details Section (Super Admin Only) -->
              <div v-if="isSuperAdminEmail(profile.email)" class="q-mt-lg">
                <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-md">Bank Details (Private)</div>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-input 
                      outlined 
                      v-model="profile.bank_name" 
                      label="Bank Name" 
                    >
                      <template v-slot:prepend><q-icon name="account_balance" color="primary" /></template>
                    </q-input>
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input 
                      outlined 
                      v-model="profile.account_number" 
                      label="Account Number" 
                    >
                      <template v-slot:prepend><q-icon name="credit_card" color="primary" /></template>
                    </q-input>
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input 
                      outlined 
                      v-model="profile.account_holder_name" 
                      label="Account Holder Name" 
                    >
                      <template v-slot:prepend><q-icon name="person" color="primary" /></template>
                    </q-input>
                  </div>
                </div>
              </div>

              <div class="row justify-end q-mt-md">
                <q-btn 
                  label="Update Profile" 
                  type="submit" 
                  color="primary" 
                  unelevated 
                  class="q-px-xl"
                  :loading="loading"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { auth, client } from 'src/api'
import { useAppStore } from 'src/store/app'
import { isSuperAdminEmail } from 'src/utils/superadmin'

const $q = useQuasar()
const appStore = useAppStore()
const loading = ref(false)
const profile = ref({
  email: '',
  whatsapp_number: '',
  bank_name: '',
  account_number: '',
  account_holder_name: '',
  is_approved: false,
  created_at: '',
  profile_image_url: ''
})

const isApproved = computed(() => {
  if (isSuperAdminEmail(profile.value.email)) return true
  return profile.value.is_approved
})

const isTrialActive = computed(() => {
  if (!profile.value.trial_ends_at) return false
  return new Date(profile.value.trial_ends_at) > new Date()
})

onMounted(async () => {
  fetchProfile()
})

const fetchProfile = async () => {
  try {
    loading.value = true
    const data = await auth.getUser()
    if (data) {
       profile.value = data
    }
  } catch (e) {
    console.error('Exception in fetchProfile:', e)
  } finally {
    loading.value = false
  }
}

const updateProfile = async () => {
  loading.value = true
  try {
    await client.post('me', {
      whatsapp_number: profile.value.whatsapp_number,
      bank_name: profile.value.bank_name,
      account_number: profile.value.account_number,
      account_holder_name: profile.value.account_holder_name
    })

    $q.notify({ type: 'positive', message: 'Profile updated successfully' })
    fetchProfile()
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Update failed: ' + error.message })
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped lang="scss">
.profile-avatar-glow {
    border: 4px solid #6366f1;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
}
</style>

