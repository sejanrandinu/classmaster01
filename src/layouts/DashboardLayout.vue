<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <!-- Top Bar -->
    <q-header class="bg-white text-grey-9 shadow-1" height-hint="64">
      <q-toolbar class="q-px-lg" style="height: 64px;">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        
        <q-toolbar-title class="text-weight-bold text-h6 flex items-center">
            <q-avatar size="32px" class="q-mr-sm">
                <img src="/favicon.svg">
            </q-avatar>
            <span class="text-primary">ClassMaster</span>
            <span class="text-caption q-ml-sm text-grey-6 gt-xs">{{ t.adminConsole }}</span>
        </q-toolbar-title>

        <q-space />

        <!-- Top Right Actions -->
        <div class="row q-gutter-sm items-center">
            <q-input dense outlined v-model="search" :placeholder="appStore.language === 'English' ? 'Search students...' : 'සිසුන් සොයන්න...'" class="gt-sm q-mr-md search-input" bg-color="grey-1" borderless @keyup.enter="handleSearch">
                <template v-slot:prepend>
                    <q-icon name="search" color="grey-5" />
                </template>
            </q-input>

            <q-btn round flat color="grey-7" icon="notifications" @click="handleNotifications">
                <q-badge color="red" floating rounded v-if="notificationsCount > 0">{{ notificationsCount }}</q-badge>
            </q-btn>
            
            <q-separator vertical class="q-mx-sm" />
            
            <q-btn flat no-caps class="text-grey-8">
                <q-avatar size="32px" class="q-mr-sm">
                    <img src="https://cdn.quasar.dev/img/boy-avatar.png">
                </q-avatar>
                <div class="text-left gt-xs">
                    <div class="text-weight-bold text-body2">{{ userDisplayName }}</div>
                    <div class="text-caption text-grey-6" style="line-height:1;">{{ userRoleLabel }}</div>
                </div>
                <q-menu auto-close class="rounded-borders shadow-3">
                    <q-list style="min-width: 220px">
                        <div class="q-px-md q-py-sm bg-grey-2 q-mb-xs">
                             <div class="text-weight-bold text-grey-9">
                                <template v-if="loadingProfile">...</template>
                                <template v-else>{{ isApproved ? (appStore.language === 'English' ? 'Approved Member' : 'අනුමත සාමාජිකයෙක්') : 'Guest' }}</template>
                             </div>
                             <div class="text-caption text-grey-7">{{ userEmail }}</div>
                        </div>

                        <q-item clickable v-ripple @click="handleProfile">
                            <q-item-section avatar style="min-width: 32px;">
                                <q-icon name="person_outline" size="20px" color="grey-7" />
                            </q-item-section>
                            <q-item-section class="text-grey-8">{{ t.myProfile }}</q-item-section>
                        </q-item>

                        <q-item clickable v-ripple @click="handleSettings">
                            <q-item-section avatar style="min-width: 32px;">
                                <q-icon name="settings" size="20px" color="grey-7" />
                            </q-item-section>
                            <q-item-section class="text-grey-8">{{ t.settings }}</q-item-section>
                        </q-item>
                        
                        <q-item clickable v-ripple @click="handleHelp">
                            <q-item-section avatar style="min-width: 32px;">
                                <q-icon name="help_outline" size="20px" color="grey-7" />
                            </q-item-section>
                            <q-item-section class="text-grey-8">{{ t.helpSupport }}</q-item-section>
                        </q-item>

                        <q-separator class="q-my-xs" />
                        
                        <q-item clickable v-ripple @click="handleLogout" class="text-red-7">
                            <q-item-section avatar style="min-width: 32px;">
                                <q-icon name="logout" size="20px" />
                            </q-item-section>
                            <q-item-section>{{ t.logout }}</q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Sidebar -->
    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered class="bg-white" :width="280">
        <div class="column full-height">
            <!-- Navigation -->
            <q-list padding class="q-mt-md text-grey-8">
                <q-item-label header class="text-uppercase text-xs text-weight-bold letter-spacing-wide q-mb-sm">{{ appStore.language === 'English' ? 'Main Menu' : 'ප්‍රධාන මෙනුව' }}</q-item-label>
                
                <q-item clickable v-ripple exact to="/dashboard" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="dashboard" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.dashboard }}</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/dashboard/students" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="people" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.students }}</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/dashboard/tutors" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="supervisor_account" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.tutors }}</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/dashboard/subjects" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="auto_stories" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.subjects }}</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/dashboard/classes" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="calendar_month" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.classes }}</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/dashboard/attendance" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="how_to_reg" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.attendance }}</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/dashboard/attendance-history" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="history" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.history }}</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/dashboard/messages" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="send" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.messages }}</q-item-section>
                </q-item>

                <q-item-label header class="text-uppercase text-xs text-weight-bold letter-spacing-wide q-mt-md q-mb-sm">{{ t.finance }}</q-item-label>

                <q-item clickable v-ripple to="/dashboard/fees" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="payments" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.collectFees }}</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/dashboard/scan-qr" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="qr_code_scanner" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.scanQr }}</q-item-section>
                </q-item>

                <q-item-label header class="text-uppercase text-xs text-weight-bold letter-spacing-wide q-mt-md q-mb-sm">{{ t.administration }}</q-item-label>

                <q-item clickable v-ripple to="/dashboard/staff" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="badge" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.staffMembers }}</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/dashboard/roles" active-class="bg-primary text-white">
                    <q-item-section avatar>
                        <q-icon name="admin_panel_settings" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium">{{ t.staffRoles }}</q-item-section>
                </q-item>

                <template v-if="isSuperAdmin">
                    <q-item-label header class="text-uppercase text-xs text-weight-bold letter-spacing-wide q-mt-md q-mb-sm">{{ t.superAdmin }}</q-item-label>

                    <q-item clickable v-ripple to="/dashboard/approvals" active-class="bg-primary text-white">
                        <q-item-section avatar>
                            <q-icon name="pending_actions" />
                        </q-item-section>
                        <q-item-section class="text-weight-medium">{{ t.newApprovals }}</q-item-section>
                        <q-item-section side v-if="pendingCount > 0">
                            <q-badge color="red" rounded>{{ pendingCount }}</q-badge>
                        </q-item-section>
                    </q-item>

                    <q-item clickable v-ripple to="/dashboard/approved-users" active-class="bg-primary text-white">
                        <q-item-section avatar>
                            <q-icon name="group_add" />
                        </q-item-section>
                        <q-item-section class="text-weight-medium">{{ t.approvedMembers }}</q-item-section>
                    </q-item>
                </template>
            </q-list>

            <q-space />
        </div>
    </q-drawer>

    <q-page-container class="bg-grey-1">
      <template v-if="loadingProfile">
        <div class="flex flex-center" style="height: 80vh">
          <q-spinner-dots color="primary" size="40px" />
        </div>
      </template>
      <template v-else-if="!isApproved">
        <div class="q-pa-xl flex flex-center" style="min-height: 80vh;">
          <q-card flat bordered class="q-pa-xl rounded-borders text-center shadow-1" style="max-width: 600px; width: 100%">
            <div class="q-mb-lg flex flex-center">
              <q-img 
                src="~assets/verification_pending.png" 
                style="width: 180px; height: 180px;" 
                class="q-mb-md"
              />
            </div>
            <h2 class="text-h4 text-weight-bold q-mb-md">{{ appStore.language === 'English' ? 'Account Pending Approval' : 'ගිණුම අනුමත වීමට නියමිතයි' }}</h2>
            <p class="text-grey-7 text-h6 q-mb-xl line-height-1-6">
              {{ appStore.language === 'English' ? 'Your registration with ClassMaster is successful.' : 'ClassMaster සඳහා ඔබගේ ලියාපදිංචිය සාර්ථකයි.' }} <br>
              {{ appStore.language === 'English' ? 'We are currently reviewing your request. Your dashboard will be activated once the payment is confirmed and the account is approved by our team.' : 'අපි දැනට ඔබගේ ඉල්ලීම සමාලෝචනය කරමින් සිටිමු. මූල්‍ය කටයුතු තහවුරු කළ පසු සහ අපගේ කණ්ඩායම විසින් ගිණුම අනුමත කළ පසු ඔබගේ දර්ශක පුවරුව සක්‍රිය වනු ඇත.' }}
            </p>
            <div class="row justify-center q-gutter-md">
              <q-btn unelevated color="primary" :label="appStore.language === 'English' ? 'Contact Support' : 'සහාය සම්බන්ධ කරගන්න'" icon="chat" no-caps class="q-px-lg" @click="handleSupport" />
              <q-btn outline color="indigo" :label="appStore.language === 'English' ? 'Payment Details' : 'ගෙවීම් විස්තර'" icon="payments" no-caps class="q-px-lg" @click="showPaymentDetails" />
              <q-btn flat color="grey-7" :label="appStore.language === 'English' ? 'Logout' : 'පද්ධතියෙන් ඉවත් වන්න'" icon="logout" no-caps @click="handleLogout" />
            </div>
            <div class="q-mt-xl text-caption text-grey-6">
              WhatsApp Support: +94 70 283 8364
            </div>
          </q-card>
        </div>
      </template>
      <template v-else>
        <router-view />
      </template>
      
      <!-- Chatbot Component -->
      <ChatbotComponent />
      
      <!-- Class Reminder Logic -->
      <ClassReminder />

      <!-- WhatsApp Dialog for Google Users -->
      <q-dialog v-model="showWhatsAppDialog" persistent>
        <q-card style="min-width: 350px">
          <q-card-section>
            <div class="text-h6">Complete Your Profile</div>
            <div class="text-caption text-grey">Please provide your WhatsApp number for important updates.</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input 
                dense 
                v-model="whatsappNumber" 
                label="WhatsApp Number" 
                placeholder="e.g. 0702838364" 
                outlined 
                autofocus 
                :rules="[val => val && val.length > 0 || 'Please type your number']"
            >
                 <template v-slot:prepend>
                  <q-icon name="phone" />
                 </template>
            </q-input>
          </q-card-section>

          <q-card-actions align="right" class="text-primary">
            <q-btn flat label="Save Number" @click="saveWhatsApp" :loading="whatsappLoading" />
          </q-card-actions>
        </q-card>
      </q-dialog>

    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { auth, client } from 'src/api'
import { useAppStore } from 'src/store/app'
import layoutTranslations from 'src/i18n/layout'
import ChatbotComponent from 'src/components/ChatbotComponent.vue'
import ClassReminder from 'src/components/ClassReminder.vue'
import PaymentDialog from 'src/components/PaymentDialog.vue'

const appStore = useAppStore()
const t = computed(() => layoutTranslations[appStore.language])

const leftDrawerOpen = ref(false)
const search = ref('')
const router = useRouter()
const $q = useQuasar()

const showPaymentDetails = () => {
    $q.dialog({
        component: PaymentDialog
    })
}

const userEmail = ref('')
const userName = ref('')
const loadingProfile = ref(true)
const dbApproved = ref(false)
const userRole = ref('')

const isSuperAdmin = computed(() => {
    return userEmail.value?.trim().toLowerCase() === 'sejanrandinu01@gmail.com'
})

const isApproved = computed(() => {
    if (isSuperAdmin.value) return true
    return dbApproved.value
})

const userDisplayName = computed(() => {
    if (isSuperAdmin.value) return 'Sejan Randinu'
    return userName.value || (userEmail.value ? userEmail.value.split('@')[0] : 'Member')
})

const userRoleLabel = computed(() => {
    if (isSuperAdmin.value) return 'Super Admin'
    return isApproved.value ? 'Active Member' : 'Pending Member'
})

const showWhatsAppDialog = ref(false)
const whatsappNumber = ref('')
const whatsappLoading = ref(false)

onMounted(async () => {
    await fetchProfile()
})

const fetchProfile = async () => {
    loadingProfile.value = true
    try {
        const data = await auth.getUser()
        if (data) {
            userEmail.value = data.email
            userName.value = data.full_name || ''
            dbApproved.value = data.is_approved
            userRole.value = data.role

            if (!data.whatsapp_number && !isSuperAdmin.value) {
                showWhatsAppDialog.value = true
            }
        } else {
            router.replace('/login')
        }
    } catch (err) {
        console.error('Fetch profile error:', err)
        router.replace('/login')
    } finally {
        loadingProfile.value = false
    }
}

const saveWhatsApp = async () => {
    if (!whatsappNumber.value) return
    whatsappLoading.value = true
    try {
        await client.post('me', { whatsapp_number: whatsappNumber.value })
        $q.notify({ type: 'positive', message: 'WhatsApp number saved!' })
        showWhatsAppDialog.value = false
    } catch {
        $q.notify({ type: 'negative', message: 'Error saving WhatsApp number.' })
    } finally {
        whatsappLoading.value = false
    }
}

const handleSupport = () => window.open('https://wa.me/94702838364', '_blank')
const toggleLeftDrawer = () => { leftDrawerOpen.value = !leftDrawerOpen.value }
const handleProfile = () => router.push('/dashboard/profile')
const handleSettings = () => router.push('/dashboard/settings')
const handleHelp = () => router.push('/dashboard/help-support')

const handleLogout = () => {
    auth.logout()
    $q.notify({ type: 'positive', message: 'Logged out successfully' })
}

</script>

<style scoped>
.search-input {
    width: 300px; 
    border-radius: 8px;
}
.letter-spacing-wide {
    letter-spacing: 0.1em;
}
</style>
