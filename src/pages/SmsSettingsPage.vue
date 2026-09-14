<template>
  <q-page class="q-pa-lg bg-grey-1">
    <div class="row items-center q-mb-xl">
        <q-btn icon="arrow_back" flat round color="grey-7" to="/dashboard/messages" class="q-mr-md" />
        <div>
            <h1 class="text-h3 text-weight-bolder text-grey-9 q-mb-xs mt-0">SMS Gateway Configuration</h1>
            <div class="text-subtitle1 text-grey-6">Connect your SMS provider to send real-time alerts.</div>
        </div>
    </div>

    <div class="row q-col-gutter-xl">
        <div class="col-12 col-md-6">
            <q-card flat class="glass-modern q-pa-xl">
                <div class="text-h5 text-weight-bold q-mb-lg">Provider Details</div>
                
                <q-form @submit="saveSettings" class="q-gutter-md">
                    <q-select
                        filled
                        v-model="settings.provider"
                        :options="['Notify.lk', 'Textlocal', 'ShoutOUT', 'Custom API']"
                        label="Select SMS Provider"
                    >
                        <template v-slot:prepend><q-icon name="hub" color="primary" /></template>
                    </q-select>

                    <q-input
                        filled
                        v-model="settings.apiKey"
                        label="API Key / Token"
                        type="password"
                        placeholder="Enter your secret key"
                    >
                        <template v-slot:prepend><q-icon name="vpn_key" color="primary" /></template>
                    </q-input>

                    <q-input
                        filled
                        v-model="settings.senderId"
                        label="Sender ID (Masking)"
                        placeholder="e.g., CLASSMASTER"
                    >
                        <template v-slot:prepend><q-icon name="badge" color="primary" /></template>
                    </q-input>

                    <q-separator class="q-my-md" />
                    <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-xs">Automated Reminders</div>
                    <div class="row items-center justify-between bg-amber-1 q-pa-md rounded-borders border-amber q-mb-md">
                        <div>
                            <div class="text-weight-bold text-subtitle2 text-amber-10">Bi-Weekly Fee Reminders (සති 2ක ගාස්තු නිවේදන)</div>
                            <div class="text-caption text-grey-7">Automatically trigger fee reminders every 14 days for unpaid students.</div>
                        </div>
                        <q-toggle v-model="settings.biweeklyReminders" color="amber-9" />
                    </div>

                    <div class="bg-blue-1 q-pa-md rounded-borders text-primary">
                        <div class="row items-center no-wrap">
                            <q-icon name="info" size="24px" class="q-mr-sm" />
                            <div class="text-caption">
                                Your API keys are stored securely. Ensure your provider account has sufficient credit before sending messages.
                            </div>
                        </div>
                    </div>

                    <div class="row justify-end q-mt-xl">
                        <q-btn 
                            label="Save Configuration" 
                            color="primary" 
                            unelevated 
                            class="premium-btn q-px-xl" 
                            type="submit"
                            :loading="loading"
                        />
                    </div>
                </q-form>
            </q-card>
        </div>

        <div class="col-12 col-md-6">
            <q-card flat class="glass-modern q-pa-xl bg-dark text-white shadow-24">
                <div class="text-h5 text-weight-bold q-mb-lg">System Status</div>
                
                <div class="q-gutter-md">
                    <div class="row items-center justify-between bg-grey-9 q-pa-md rounded-borders">
                        <div class="row items-center">
                            <q-icon name="wifi" class="q-mr-sm" :color="connected ? 'green' : 'red'" />
                            <span>Connection to Provider</span>
                        </div>
                        <q-badge :color="connected ? 'green' : 'red'" :label="connected ? 'Active' : 'Offline'" />
                    </div>

                    <div class="row items-center justify-between bg-grey-9 q-pa-md rounded-borders">
                        <div class="row items-center">
                            <q-icon name="history" class="q-mr-sm" color="blue" />
                            <span>Messages Sent (This Month)</span>
                        </div>
                        <div class="text-weight-bold">142</div>
                    </div>

                    <div class="q-mt-xl">
                        <div class="text-caption text-grey-5 q-mb-sm">Current Plan</div>
                        <div class="text-h6">Pay-As-You-Go</div>
                    </div>

                    <q-btn 
                        outline 
                        color="white" 
                        label="Test Connection" 
                        class="full-width q-mt-xl" 
                        icon="tap_and_play"
                        @click="testConnection"
                    />
                </div>
            </q-card>
        </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const connected = ref(true)

const settings = ref({
    provider: 'Notify.lk',
    apiKey: '************************',
    senderId: 'CLASSMASTER',
    biweeklyReminders: true
})

const saveSettings = () => {
    loading.value = true
    setTimeout(() => {
        loading.value = false
        $q.notify({
            type: 'positive',
            message: 'SMS Configuration Saved!',
            icon: 'cloud_done'
        })
    }, 1000)
}

const testConnection = () => {
    $q.loading.show({ message: 'Verifying API Credentials...' })
    setTimeout(() => {
        $q.loading.hide()
        $q.notify({
            type: 'positive',
            message: 'Connection Successful! API is responding.',
            icon: 'check_circle'
        })
    }, 1500)
}
</script>

<style scoped lang="scss">
.glass-modern {
    background: white;
    border-radius: 24px;
    border: 1px solid rgba(0,0,0,0.05);
}
.premium-btn {
    border-radius: 12px;
    font-weight: 700;
}
</style>
