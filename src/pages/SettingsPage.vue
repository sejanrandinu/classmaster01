<template>
  <q-page class="q-pa-lg">
    <div class="row q-col-gutter-lg">
      <div class="col-12">
        <h1 class="text-h4 text-weight-bold q-mb-lg">{{ t.title }}</h1>
      </div>

      <div class="col-12 col-md-8">
        <!-- Security Section -->
        <q-card flat bordered class="rounded-borders q-mb-lg shadow-sm">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md text-primary">{{ t.securityTitle }}</div>
            <q-list separator>
              <q-item clickable v-ripple @click="resetPassword">
                <q-item-section avatar>
                  <q-icon name="lock_person" color="primary" />
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
                  <q-icon name="notifications_active" color="orange" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ t.notifications }}</q-item-label>
                  <q-item-label caption>{{ t.notificationsCaption }}</q-item-label>
                </q-item-section>
                <q-item-section side class="row items-center no-wrap">
                  <q-btn flat dense color="primary" icon="campaign" class="q-mr-sm" @click="testNotification">
                    <q-tooltip>Test Notification</q-tooltip>
                  </q-btn>
                  <q-toggle v-model="settings.notifications" color="primary" @update:model-value="toggleNotifications" />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="fa-brands fa-whatsapp" color="green" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ t.whatsappNotifications }}</q-item-label>
                  <q-item-label caption>{{ t.whatsappNotificationsCaption }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle v-model="settings.whatsapp" color="green" @update:model-value="toggleWhatsapp" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Preferences Section -->
        <q-card flat bordered class="rounded-borders q-mb-lg shadow-sm">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md text-primary">{{ t.preferencesTitle }}</div>
            <q-list separator>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="language" color="blue" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ t.language }}</q-item-label>
                  <q-item-label caption>{{ t.languageCaption }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-select 
                    v-model="appStore.language" 
                    :options="['English', 'Sinhala']" 
                    outlined
                    dense 
                    class="q-px-sm"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- ID Card Design Section (Premium Redesign) -->
        <q-card flat bordered class="rounded-borders shadow-sm">
          <q-card-section class="bg-indigo-10 text-white q-pa-lg">
            <div class="text-h5 text-weight-bold">{{ t.cardDesignTitle }}</div>
            <div class="text-subtitle2 text-indigo-1">{{ t.cardDesignSubtitle }}</div>
          </q-card-section>
          
          <q-card-section class="q-pa-lg">
            <div class="row q-col-gutter-xl">
                <!-- Left: Configuration -->
                <div class="col-12 col-md-6">
                    <div class="text-subtitle2 q-mb-md text-grey-8">{{ t.backgroundSettings }}</div>
                    
                    <!-- Premium Upload Area -->
                    <div class="upload-zone q-mb-lg" @click="$refs.fileInput.pickFiles()">
                        <q-file 
                            ref="fileInput"
                            v-model="pickedFile" 
                            style="display: none"
                            accept="image/*"
                            @update:model-value="onFilePicked"
                        />
                        <div v-if="!profile.card_background_url" class="column items-center justify-center q-pa-xl text-grey-6 border-dashed">
                            <q-icon name="cloud_upload" size="48px" />
                            <div class="text-weight-bold q-mt-sm">{{ t.clickToUpload }}</div>
                            <div class="text-caption">Max size 2MB</div>
                        </div>
                        <div v-else class="relative-position rounded-borders overflow-hidden shadow-2 border-primary">
                            <q-img :src="profile.card_background_url" :ratio="16/9" />
                            <div class="absolute-top-right q-ma-xs">
                                <q-btn round color="red" icon="delete" size="sm" @click.stop="profile.card_background_url = ''" />
                            </div>
                        </div>
                    </div>

                    <div class="row q-col-gutter-lg">
          <!-- Profile Card -->
          <div class="col-12 col-md-4">
            <q-card flat class="glass-modern h-full">
              <q-card-section class="text-center q-pa-xl">
                <div class="relative-position inline-block">
                    <q-avatar size="120px" class="q-mb-md profile-avatar-glow">
                        <img :src="profile.profile_image_url || 'https://cdn.quasar.dev/img/boy-avatar.png'">
                    </q-avatar>
                    <q-btn 
                        round 
                        color="primary" 
                        icon="camera_alt" 
                        size="sm" 
                        class="absolute-bottom-right"
                        @click="$refs.profileFileInput.pickFiles()"
                    />
                    <q-file
                        ref="profileFileInput"
                        v-model="pickedProfileFile"
                        style="display: none"
                        accept="image/*"
                        @update:model-value="onProfileFilePicked"
                    />
                </div>
                <div class="text-h5 text-weight-bold text-white">{{ userName }}</div>
                <div class="text-caption text-indigo-2">{{ userEmail }}</div>
                <q-badge color="primary" class="q-mt-sm">{{ userRoleLabel }}</q-badge>
              </q-card-section>
            </q-card>
          </div>

          <!-- Security & Access -->
          <div class="col-12 col-md-8">
                            <q-input outlined v-model="profile.card_theme_color" :label="t.themeColor" dense>
                                <template v-slot:append>
                                    <q-icon name="colorize" class="cursor-pointer">
                                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                            <q-color v-model="profile.card_theme_color" />
                                        </q-popup-proxy>
                                    </q-icon>
                                </template>
                            </q-input>
                        </div>
                        <div class="col-12">
                            <q-select outlined v-model="profile.card_layout_type" :options="['standard', 'modern', 'compact']" :label="t.layoutType" dense />
                        </div>
                        <div class="col-12">
                            <q-toggle v-model="profile.card_show_visuals" :true-value="1" :false-value="0" :label="t.showVisuals" color="primary" />
                        </div>
                    </div>

                    <div class="row justify-end q-mt-lg">
                        <q-btn :label="t.applyToAll" color="indigo-10" unelevated :loading="saving" @click="saveIDSettings" class="full-width" size="lg" no-caps />
                    </div>
                </div>

                <!-- Right: Preview -->
                <div class="col-12 col-md-6 flex flex-center bg-grey-2 rounded-borders q-pa-md">
                    <div class="column items-center">
                        <div class="text-overline text-grey-7 q-mb-md">PREVIEW</div>
                        <div class="id-card-preview shadow-10" :style="profile.card_background_url ? `background-image: url(${profile.card_background_url}); background-size: cover; background-position: center;` : ''">
                            <div class="preview-overlay" :style="`background: linear-gradient(135deg, ${profile.card_theme_color}${profile.card_background_url ? 'aa' : ''} 0%, ${profile.card_theme_color}${profile.card_background_url ? '99' : ''} 100%)`"></div>
                            <div class="preview-content q-pa-md relative-position full-height text-white">
                                <div class="row justify-between items-center">
                                    <div class="text-overline text-weight-bold" style="font-size: 8px;">CLASSMASTER</div>
                                    <div class="text-caption text-indigo-1" style="font-size: 7px;">STUDENT ID</div>
                                </div>
                                <div class="row q-mt-md items-center q-col-gutter-sm">
                                    <div class="col-auto">
                                        <div class="bg-white rounded-borders q-pa-xs" style="width: 50px; height: 50px;">
                                            <q-icon name="qr_code_2" size="42px" color="indigo-10" />
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="text-weight-bold" style="font-size: 10px;">SAMAN PERERA</div>
                                        <div class="text-caption text-indigo-2" style="font-size: 8px;">Grade 11 - Royal College</div>
                                    </div>
                                </div>
                                <div v-if="profile.card_show_visuals" class="preview-visuals">
                                    <div class="v-blob-1"></div>
                                    <div class="v-blob-2"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Google Sheets Sync -->
        <q-card flat class="glass-modern q-mt-lg">
          <q-card-section class="q-pa-lg">
            <div class="text-h6 text-weight-bold q-mb-md row items-center">
              <q-avatar size="28px" class="q-mr-sm" square>
                <img src="https://fonts.gstatic.com/s/i/productlogos/sheets_2020q4/v8/web-64dp/logo_sheets_2020q4_color_2x_web_64dp.png" style="width:22px;height:22px;" />
              </q-avatar>
              Google Sheets Sync
              <q-badge color="green-7" class="q-ml-sm text-caption">NEW</q-badge>
            </div>
            <p class="text-grey-7 text-caption q-mb-md">
              Automatically sync attendance, payments &amp; exam marks to your Google Sheet via a Google Apps Script webhook.
            </p>

            <q-input
              outlined
              dense
              v-model="sheetsWebhookUrl"
              label="Google Apps Script Web App URL"
              placeholder="https://script.google.com/macros/s/.../exec"
              class="q-mb-md"
            >
              <template v-slot:prepend><q-icon name="link" color="green-7" /></template>
            </q-input>

            <div class="row q-gutter-sm q-mb-lg">
              <q-btn unelevated color="green-7" label="Save Webhook URL" icon="save" no-caps :loading="savingWebhook" @click="saveWebhookUrl" />
              <q-btn outline color="blue-7" label="Test Connection" icon="send" no-caps :loading="testingWebhook" @click="testWebhookUrl" />
            </div>

            <!-- Setup Instructions -->
            <q-expansion-item
              icon="help_outline"
              label="How to set up Google Sheets sync?"
              dense
              class="bg-grey-1 rounded-borders"
            >
              <q-card flat class="q-pa-md bg-grey-1">
                <ol class="text-caption text-grey-8" style="padding-left:1.2rem; line-height: 1.8;">
                  <li>Open <a href="https://sheets.google.com" target="_blank" class="text-green-7">Google Sheets</a> and create a new spreadsheet.</li>
                  <li>Go to <strong>Extensions → Apps Script</strong>.</li>
                  <li>Delete any existing code and paste the script below.</li>
                  <li>Click <strong>Deploy → New deployment → Web app</strong>.</li>
                  <li>Set <em>Execute as</em>: <strong>Me</strong>, <em>Who has access</em>: <strong>Anyone</strong>.</li>
                  <li>Click <strong>Deploy</strong> and copy the Web App URL.</li>
                  <li>Paste it above and click <strong>Save Webhook URL</strong>.</li>
                </ol>

                <q-separator class="q-my-sm" />
                <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">📋 Google Apps Script Template:</div>
                <div class="bg-grey-900 text-green-4 rounded-borders q-pa-sm" style="font-family:monospace; font-size:11px; white-space:pre-wrap; background:#1e1e1e; color:#4ec9b0; border-radius:8px;">{{ gasScriptTemplate }}</div>
                <q-btn flat dense size="sm" icon="content_copy" label="Copy Script" color="green-7" class="q-mt-xs" @click="copyGasScript" />
              </q-card>
            </q-expansion-item>
          </q-card-section>
        </q-card>

        <!-- Data Management -->
        <q-card flat class="glass-modern q-mt-lg">
          <q-card-section class="q-pa-lg">
            <div class="text-h6 text-weight-bold q-mb-md row items-center">
                <q-icon name="storage" color="red-7" class="q-mr-sm" />
                {{ t.dataManagementTitle }}
            </div>
            
            <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                    <q-btn 
                        outline 
                        color="orange-8" 
                        icon="account_balance_wallet" 
                        :label="t.resetFinancial" 
                        class="full-width premium-btn" 
                        @click="confirmReset('financial')"
                    />
                </div>
                <div class="col-12 col-sm-6">
                    <q-btn 
                        outline 
                        color="red-7" 
                        icon="delete_sweep" 
                        :label="t.resetAll" 
                        class="full-width premium-btn" 
                        @click="confirmReset('all')"
                    />
                </div>
            </div>
            <div class="q-mt-md text-caption text-grey-6">
                <q-icon name="warning" color="orange" class="q-mr-xs" /> 
                {{ t.dataManagementWarning }}
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
import { auth, client, storage } from 'src/api'
import { useAppStore } from 'src/store/app'
import { notificationService } from 'src/utils/notifications'

const $q = useQuasar()
const appStore = useAppStore()

const saving = ref(false)
const profile = ref({
    profile_image_url: '',
    card_background_url: '',
    card_theme_color: '#0d124d',
    card_layout_type: 'standard',
    card_show_visuals: 1
})
const pickedFile = ref(null)
const pickedProfileFile = ref(null)

const userEmail = ref('')
const userName = ref('')
const userRole = ref('')

const userRoleLabel = computed(() => {
    if (userEmail.value?.trim().toLowerCase() === 'sejanrandinu01@gmail.com') return 'Super Admin'
    if (userRole.value === 'trial') return 'Trial Member'
    return profile.value.is_approved ? 'Active Member' : 'Pending Member'
})

onMounted(async () => {
    const data = await auth.getUser()
    if (data) {
        userEmail.value = data.email
        userName.value = data.account_holder_name
        userRole.value = data.role
        profile.value = { ...profile.value, ...data }
    }
})

const onProfileFilePicked = async (file) => {
    if (!file) return
    
    const compressToBlob = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target.result
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX = 400
                    let width = img.width
                    let height = img.height
                    if (width > height) {
                        if (width > MAX) { height *= MAX / width; width = MAX }
                    } else {
                        if (height > MAX) { width *= MAX / height; height = MAX }
                    }
                    canvas.width = width
                    canvas.height = height
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
                    canvas.toBlob(resolve, 'image/jpeg', 0.7)
                }
            }
        })
    }

    try {
        $q.loading.show({ message: 'Uploading profile picture...' })
        const blob = await compressToBlob(file)
        const uploadFile = new File([blob], `profile-${Date.now()}.jpg`, { type: 'image/jpeg' })
        const result = await storage.upload(uploadFile)
        const url = result.url
        await client.post('me', { profile_image_url: url })
        profile.value.profile_image_url = url
        $q.notify({ type: 'positive', message: 'Profile picture updated!' })
    } catch (e) {
        console.error('Upload error:', e)
        $q.notify({ type: 'negative', message: 'Failed to update profile picture' })
    } finally {
        $q.loading.hide()
    }
}

const settings = reactive({
  notifications: true,
  whatsapp: appStore.whatsappEnabled
})

// Translation Dictionary
const translations = {
  English: {
    title: 'Settings',
    securityTitle: 'Security & Access',
    resetPassword: 'Reset Password',
    resetPasswordCaption: 'Set a new password for your account',
    notifications: 'System Notifications',
    notificationsCaption: 'Receive alerts about class attendance and fees',
    whatsappNotifications: 'WhatsApp Notifications',
    whatsappNotificationsCaption: 'Automatically open WhatsApp to notify parents/students',
    dataManagementTitle: 'Data Management',
    resetFinancial: 'Reset Financial Data',
    resetAll: 'Reset All Data (Full Reset)',
    dataManagementWarning: 'Careful! These actions are permanent and cannot be undone.',
    preferencesTitle: 'App Preferences',
    language: 'Language',
    languageCaption: 'Choose your preferred language',
    resetLinkSent: 'Password reset instructions sent to ',
    cardDesignTitle: 'Global ID Card Design',
    cardDesignSubtitle: 'Configure the default branding for all student ID cards',
    backgroundSettings: 'Visual Assets',
    clickToUpload: 'Click to Upload Background',
    themeColor: 'Theme Primary Color',
    layoutType: 'Global Layout Pattern',
    showVisuals: 'Enable Decorative Accents',
    applyToAll: 'Save & Apply to All Cards'
  },
  Sinhala: {
    title: 'සැකසුම්',
    securityTitle: 'ආරක්ෂාව සහ පිවිසුම',
    resetPassword: 'මුරපදය නැවත සකසන්න',
    resetPasswordCaption: 'ඔබගේ ගිණුම සඳහා නව මුරපදයක් ඇතුළත් කරන්න',
    notifications: 'පද්ධති නිවේදන',
    notificationsCaption: 'පැමිණීම සහ ගාස්තු පිළිබඳ දැනුම්දීම් ලබා ගන්න',
    whatsappNotifications: 'WhatsApp නිවේදන',
    whatsappNotificationsCaption: 'දෙමාපියන්ට/සිසුන්ට WhatsApp හරහා දැනුම්දීම් යවන්න',
    dataManagementTitle: 'දත්ත කළමනාකරණය',
    resetFinancial: 'මූල්‍ය දත්ත මකන්න',
    resetAll: 'සියලුම දත්ත මකන්න (Reset)',
    dataManagementWarning: 'පරෙස්සම් වන්න! මෙම ක්‍රියා ස්ථිර වන අතර නැවත ලබා ගත නොහැක.',
    preferencesTitle: 'පද්ධති මනාපයන්',
    language: 'භාෂාව',
    languageCaption: 'ඔබ කැමති භාෂාව තෝරන්න',
    resetLinkSent: 'මුරපදය නැවත සැකසීමේ පණිවිඩය යවන ලදී: ',
    cardDesignTitle: 'පොදු හැඳුනුම්පත් නිර්මාණය',
    cardDesignSubtitle: 'සියලුම සිසුන් සඳහා පොදු හැඳුනුම්පත් රටාව මෙතැනින් සකසන්න',
    backgroundSettings: 'පසුබිම් සැකසුම්',
    clickToUpload: 'පසුබිම් පින්තූරය ඇතුළත් කිරීමට මෙතන Click කරන්න',
    themeColor: 'ප්‍රධාන තේමා වර්ණය',
    layoutType: 'පොදු පිරිසැලසුම (Layout)',
    showVisuals: 'අලංකාර රටා පෙන්වන්න',
    applyToAll: 'සුරකින්න සහ සියලුම කාඩ්පත් වලට යොදන්න'
  }
}

const t = computed(() => translations[appStore.language])

onMounted(async () => {
    try {
        const data = await client.get('me')
        if (data) {
            profile.value.whatsapp_number = data.whatsapp_number
            profile.value.bank_name = data.bank_name
            profile.value.account_number = data.account_number
            profile.value.account_holder_name = data.account_holder_name
            profile.value.card_background_url = data.card_background_url || ''
            profile.value.card_theme_color = data.card_theme_color || '#0d124d'
            profile.value.card_layout_type = data.card_layout_type || 'standard'
            profile.value.card_show_visuals = data.card_show_visuals ?? 1
            settings.whatsapp = data.whatsapp_enabled === undefined ? true : (data.whatsapp_enabled === 1 || data.whatsapp_enabled === true || data.whatsapp_enabled === '1')
        }
    } catch (e) {
        console.error('Failed to load profile:', e)
    }
})

const onFilePicked = async (file) => {
    if (!file) return
    
    const compressToBlob = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target.result
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 1200
                    const MAX_HEIGHT = 800
                    let width = img.width
                    let height = img.height
                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT }
                    }
                    canvas.width = width
                    canvas.height = height
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
                    canvas.toBlob(resolve, 'image/jpeg', 0.7)
                }
            }
        })
    }

    try {
        $q.loading.show({ message: 'Uploading background image...' })
        const blob = await compressToBlob(file)
        const uploadFile = new File([blob], `card-bg-${Date.now()}.jpg`, { type: 'image/jpeg' })
        const result = await storage.upload(uploadFile)
        profile.value.card_background_url = result.url
        $q.notify({ type: 'positive', message: 'Background image uploaded!' })
    } catch (e) {
        console.error('Compression error:', e)
        $q.notify({ type: 'negative', message: 'Failed to upload background image' })
    } finally {
        $q.loading.hide()
    }
}

const saveIDSettings = async () => {
    saving.value = true
    try {
        await client.post('me', profile.value)
        $q.notify({ type: 'positive', message: 'Global ID card design updated!' })
    } catch (error) {
        console.error('Save error:', error)
        $q.notify({ type: 'negative', message: 'Failed to update settings' })
    } finally {
        saving.value = false
    }
}

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

const toggleNotifications = async (val) => {
  if (val) {
    const granted = await notificationService.requestPermission()
    if (!granted) {
      $q.notify({
        type: 'warning',
        message: 'Notification permission denied by browser.',
        caption: 'Please enable it in browser settings to receive alerts.'
      })
      settings.notifications = false
    } else {
      $q.notify({ type: 'positive', message: 'Notifications enabled!' })
    }
  }
}

const toggleWhatsapp = async (val) => {
    try {
        await client.post('me', { whatsapp_enabled: val })
        appStore.setWhatsappEnabled(val)
        $q.notify({ 
            type: val ? 'positive' : 'warning', 
            message: `WhatsApp notifications ${val ? 'enabled' : 'disabled'}`,
            icon: val ? 'check' : 'block'
        })
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to update WhatsApp settings' })
        settings.whatsapp = !val
    }
}

const confirmReset = (type) => {
    const isAll = type === 'all'
    $q.dialog({
        title: `Confirm ${isAll ? 'Full' : 'Financial'} Reset`,
        message: `Are you absolutely sure you want to delete ${isAll ? 'ALL your data (students, classes, payments, etc.)' : 'all your financial records (payments, salaries, etc.)'}? This action is permanent.`,
        cancel: true,
        persistent: true,
        ok: { color: 'red-7', flat: true, label: 'Yes, Delete Permanently' }
    }).onOk(async () => {
        try {
            await client.post('maintenance/reset', { type })
            $q.notify({ type: 'positive', message: 'Data reset successfully' })
            if (isAll) {
                // Refresh or redirect to dashboard after full reset
                window.location.reload()
            }
        } catch {
            $q.notify({ type: 'negative', message: 'Reset failed' })
        }
    })
}

const testNotification = async () => {
  if (!settings.notifications) {
    $q.notify({ type: 'info', message: 'Please enable notifications first' })
    return
  }
  
  await notificationService.notify('Notification Test', {
    body: 'This is how your notifications will appear! 🔔',
    requireInteraction: false
  })
}

// Google Sheets Sync
const sheetsWebhookUrl = ref('')
const savingWebhook = ref(false)
const testingWebhook = ref(false)

// Load existing webhook URL on mount (piggybacks on existing getUser call)
onMounted(async () => {
  try {
    const data = await auth.getUser()
    if (data?.sheets_webhook_url) sheetsWebhookUrl.value = data.sheets_webhook_url
  } catch (err) {
    console.error('Failed to load webhook URL:', err)
  }
})

const saveWebhookUrl = async () => {
  savingWebhook.value = true
  try {
    await client.post('me', { sheets_webhook_url: sheetsWebhookUrl.value })
    $q.notify({ type: 'positive', message: 'Google Sheets webhook URL saved!', icon: 'check_circle' })
  } catch (err) {
    console.error('Save webhook error:', err)
    $q.notify({ type: 'negative', message: 'Failed to save webhook URL' })
  } finally {
    savingWebhook.value = false
  }
}

const testWebhookUrl = async () => {
  if (!sheetsWebhookUrl.value) {
    $q.notify({ type: 'warning', message: 'Please enter a webhook URL first' })
    return
  }
  testingWebhook.value = true
  try {
    // Route through backend to avoid browser CORS restrictions on Google Apps Script URLs
    await client.post('sheets-test', { webhook_url: sheetsWebhookUrl.value })
    $q.notify({ type: 'positive', message: 'Test ping sent! Check your Google Sheet.', icon: 'check_circle' })
  } catch (err) {
    console.error('Test webhook error:', err)
    $q.notify({ type: 'negative', message: 'Test failed — check if the URL is correct and the script is deployed.' })
  } finally {
    testingWebhook.value = false
  }
}

const gasScriptTemplate = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);
  var sheetName = data.event || 'events';
  var tab = sheet.getSheetByName(sheetName) || sheet.insertSheet(sheetName);
  
  if (tab.getLastRow() === 0) {
    var headers = ['timestamp', 'event'].concat(Object.keys(data.data || {}));
    tab.appendRow(headers);
  }
  
  var row = [data.timestamp, data.event].concat(Object.values(data.data || {}));
  tab.appendRow(row);
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}`

const copyGasScript = () => {
  navigator.clipboard.writeText(gasScriptTemplate)
  $q.notify({ type: 'positive', message: 'Script copied to clipboard!', icon: 'content_copy' })
}
</script>

<style scoped>
.upload-zone {
    cursor: pointer;
    transition: all 0.3s ease;
}

.border-dashed {
    border: 2px dashed #ddd;
    border-radius: 12px;
}

.upload-zone:hover .border-dashed {
    border-color: var(--q-primary);
    background: rgba(var(--q-primary), 0.05);
}

.id-card-preview {
    width: 250px;
    height: 140px;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    background: #0d124d;
}

.preview-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 1;
}

.preview-content {
    z-index: 2;
}

.preview-visuals {
    position: absolute;
    bottom: 0; right: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    opacity: 0.15;
}

.v-blob-1 {
    width: 150px; height: 150px;
    background: radial-gradient(circle, white 0%, transparent 70%);
    position: absolute; bottom: -50px; right: -50px;
}

.v-blob-2 {
    width: 100px; height: 100px;
    background: radial-gradient(circle, white 0%, transparent 70%);
    position: absolute; top: -30px; left: -30px;
}

.border-primary {
    border: 2px solid var(--q-primary);
}
</style>
