<template>
  <q-page class="q-pa-lg">
    <div class="row q-col-gutter-lg">
      <div class="col-12">
        <h1 class="text-h4 text-weight-bold q-mb-lg">{{ t.title }}</h1>
      </div>

      <div class="col-12 col-md-8">
        <!-- Security Section -->
        <q-card flat bordered class="rounded-borders q-mb-lg">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">{{ t.securityTitle }}</div>
            <q-list separator>
              <q-item clickable v-ripple @click="resetPassword">
                <q-item-section avatar>
                  <q-icon name="lock" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ t.resetPassword }}</q-item-label>
                  <q-item-label caption>{{ t.resetPasswordCaption }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="notifications" color="orange" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ t.notifications }}</q-item-label>
                  <q-item-label caption>{{ t.notificationsCaption }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle v-model="settings.notifications" color="primary" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Preferences Section -->
        <q-card flat bordered class="rounded-borders q-mb-lg">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">{{ t.preferencesTitle }}</div>
            <q-list separator>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="translate" color="blue" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ t.language }}</q-item-label>
                  <q-item-label caption>{{ t.languageCaption }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-select 
                    v-model="appStore.language" 
                    :options="['English', 'Sinhala']" 
                    borderless 
                    dense 
                    class="q-px-sm"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- ID Card Design Section -->
        <q-card flat bordered class="rounded-borders">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">ID Card Global Design</div>
            <p class="text-grey-7 q-mb-lg">Configure the default look for all student ID cards.</p>
            
            <div class="q-gutter-md">
                <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-8">
                        <q-input outlined v-model="profile.card_background_url" label="Global Background Image URL" placeholder="https://...">
                            <template v-slot:append>
                                <q-file 
                                    v-model="pickedFile" 
                                    dense 
                                    flat 
                                    borderless 
                                    label="Upload" 
                                    accept="image/*"
                                    @update:model-value="onFilePicked"
                                >
                                    <template v-slot:prepend><q-icon name="cloud_upload" /></template>
                                </q-file>
                            </template>
                        </q-input>
                    </div>
                    <div class="col-12 col-md-4">
                        <q-input outlined v-model="profile.card_theme_color" label="Theme Color">
                            <template v-slot:append>
                                <q-icon name="colorize" class="cursor-pointer">
                                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                        <q-color v-model="profile.card_theme_color" />
                                    </q-popup-proxy>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>
                </div>

                <div class="row q-col-gutter-md items-center">
                    <div class="col-12 col-md-6">
                        <q-select outlined v-model="profile.card_layout_type" :options="['standard', 'modern', 'compact']" label="Global Layout" />
                    </div>
                    <div class="col-12 col-md-6">
                        <q-toggle v-model="profile.card_show_visuals" :true-value="1" :false-value="0" label="Enable Decorative Visuals" color="primary" />
                    </div>
                </div>

                <div class="row justify-end q-mt-md">
                    <q-btn label="Apply to All Cards" color="primary" unelevated :loading="saving" @click="saveIDSettings" />
                </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { reactive, computed, ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { auth, client } from 'src/api'
import { useAppStore } from 'src/store/app'

const $q = useQuasar()
const appStore = useAppStore()
const saving = ref(false)
const profile = ref({
    card_background_url: '',
    card_theme_color: '#0d124d',
    card_layout_type: 'standard',
    card_show_visuals: 1
})
const pickedFile = ref(null)

onMounted(async () => {
    const data = await client.get('me')
    if (data) Object.assign(profile.value, data)
})

const onFilePicked = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
        profile.value.card_background_url = e.target.result
    }
    reader.readAsDataURL(file)
}

const saveIDSettings = async () => {
    saving.value = true
    try {
        await client.post('me', profile.value)
        $q.notify({ type: 'positive', message: 'Global ID card design updated!' })
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to update settings' })
    } finally {
        saving.value = false
    }
}
...
const settings = reactive({
  notifications: true
})
...
const translations = {
...
  English: {
    title: 'Settings',
    securityTitle: 'Security & Access',
    resetPassword: 'Reset Password',
    resetPasswordCaption: 'Set a new password for your account',
    notifications: 'System Notifications',
    notificationsCaption: 'Receive alerts about class attendance and fees',
    preferencesTitle: 'App Preferences',
    language: 'Language',
    languageCaption: 'Choose your preferred language',
    resetLinkSent: 'Password reset instructions sent to '
  },
  Sinhala: {
    title: 'සැකසුම්',
    securityTitle: 'ආරක්ෂාව සහ පිවිසුම',
    resetPassword: 'මුරපදය නැවත සකසන්න',
    resetPasswordCaption: 'ඔබගේ ගිණුම සඳහා නව මුරපදයක් ඇතුළත් කරන්න',
    notifications: 'පද්ධති නිවේදන',
    notificationsCaption: 'පැමිණීම සහ ගාස්තු පිළිබඳ දැනුම්දීම් ලබා ගන්න',
    preferencesTitle: 'පද්ධති මනාපයන්',
    language: 'භාෂාව',
    languageCaption: 'ඔබ කැමති භාෂාව තෝරන්න',
    resetLinkSent: 'මුරපදය නැවත සැකසීමේ පණිවිඩය යවන ලදී: '
  }
}

const t = computed(() => translations[appStore.language])

const resetPassword = async () => {
  $q.dialog({
    title: t.value.resetPassword,
    message: 'Enter your new password:',
    prompt: {
      model: '',
      type: 'password',
      attrs: {
        autocomplete: 'new-password'
      }
    },
    cancel: true,
    persistent: true
  }).onOk(async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      $q.notify({ type: 'negative', message: 'Password must be at least 6 characters' })
      return
    }

    $q.loading.show()
    try {
      await auth.changePassword(newPassword)
      $q.notify({ 
        type: 'positive', 
        message: 'Password updated successfully!',
        timeout: 5000
      })
    } catch (e) {
      console.error('Password reset error:', e)
      $q.notify({ type: 'negative', message: 'Failed to update password' })
    } finally {
      $q.loading.hide()
    }
  })
}
</script>
