<template>
  <q-page class="q-pa-md bg-grey-1">
     <!-- Notification Banner -->
     <div v-if="notificationPermissionNeeded" class="q-mb-md">
        <q-banner dense class="bg-indigo-1 text-indigo-9 rounded-borders shadow-1">
           <template v-slot:avatar><q-icon name="notifications_active" color="indigo-9" /></template>
           Stay updated! Enable system notifications for important alerts.
           <template v-slot:action>
              <q-btn flat color="indigo-9" label="Enable Now" @click="requestNotificationPermission" no-caps />
              <q-btn flat color="grey-6" label="Later" @click="showNotificationBanner = false" no-caps />
           </template>
        </q-banner>
     </div>

     <!-- Trial Banner -->
     <div v-if="userProfile && isTrialActive" class="q-mb-md">
        <q-banner dense class="bg-blue-1 text-blue-9 rounded-borders shadow-1">
           <template v-slot:avatar><q-icon name="info" color="blue-9" /></template>
           You are currently on a 7-day free trial. 
           <strong>{{ trialDaysLeft }} days remaining</strong>.
           <template v-slot:action>
              <q-btn flat color="blue-9" label="Upgrade Now" @click="showPaymentDetails" no-caps />
           </template>
        </q-banner>
     </div>

    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
       <div>
         <h1 class="text-h4 text-weight-bold text-grey-9 q-mb-xs">Overview</h1>
         <div class="text-grey-6 flex items-center">
           <q-icon name="fiber_manual_record" :color="realtimeStatusColor" size="12px" class="q-mr-sm pulse" />
           Live Dashboard Status: {{ dbCheckStatus }}
         </div>
       </div>
       <div class="row q-gutter-sm">
          <q-btn unelevated color="primary" icon="add" label="New Admission" no-caps @click="handleNewAdmission" class="premium-btn shadow-2" />
       </div>
    </div>

    <!-- Stats Grid -->
    <div class="row q-col-gutter-md q-mb-lg">
       <div class="col-xs-12 col-sm-6 col-md-3" v-for="(stat, i) in stats" :key="i">
          <q-card flat class="dashboard-stat-card glass-modern overflow-hidden" @click="router.push(stat.to)">
             <q-card-section>
                <div class="row items-center justify-between q-mb-sm">
                   <div class="text-caption text-grey-6 text-uppercase text-weight-bold letter-spacing-wide">{{ stat.label }}</div>
                   <div :class="`stat-icon-bg bg-${stat.color}-1`" class="q-pa-sm rounded-borders">
                        <q-icon :name="stat.icon" :color="stat.color" size="24px" />
                   </div>
                </div>
                <div class="text-h4 text-weight-bold text-grey-9 q-mb-xs">
                    <span v-if="stat.prefix" class="text-h6 text-grey-5">{{ stat.prefix }}</span>
                    {{ Math.round(stat.value).toLocaleString() }}
                </div>
                <!-- Mini Progress Visual -->
                <q-linear-progress :value="stat.progress" :color="stat.color" rounded class="q-mt-sm" style="height: 4px" />
             </q-card-section>
          </q-card>
       </div>
    </div>

    <!-- Main Content Area -->
    <div class="row q-col-gutter-md">
        <!-- Center Column -->
        <div class="col-xs-12 col-md-8">
            <!-- Today's Schedule -->
            <q-card flat class="glass-modern q-mb-md">
                <q-card-section class="q-pb-none">
                    <div class="row items-center justify-between q-mb-md">
                        <div class="text-h6 text-weight-bold flex items-center">
                            <q-icon name="event_upcoming" color="primary" class="q-mr-sm" />
                            Today's Schedule
                        </div>
                        <q-btn flat dense color="primary" label="Manage Classes" no-caps @click="handleViewAllSchedule" />
                    </div>
                </q-card-section>
                <q-card-section>
                    <div v-if="todaySchedule.length === 0" class="text-center q-py-xl text-grey-6 border-dashed rounded-borders">
                        <q-icon name="event_available" size="64px" color="grey-3" class="q-mb-sm" />
                        <div class="text-h6 opacity-60">No classes remaining today</div>
                    </div>
                    <q-list v-else separator class="modern-list shadow-1 rounded-borders overflow-hidden">
                        <q-item v-for="cls in todaySchedule" :key="cls.id" clickable v-ripple @click="showClassDetails(cls)" class="q-py-md">
                            <q-item-section avatar>
                                <q-avatar color="primary" text-color="white" size="48px" class="shadow-2">
                                    {{ cls.subject.charAt(0) }}
                                </q-avatar>
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-bold text-h6">{{ cls.class_name }}</q-item-label>
                                <q-item-label caption class="flex items-center">
                                    <q-icon name="person" size="14px" class="q-mr-xs" /> {{ cls.tutor }}
                                    <q-separator vertical class="q-mx-sm" />
                                    <q-badge :label="cls.grade" color="grey-2" text-color="grey-8" dense />
                                </q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <div class="text-h6 text-weight-bold text-primary">{{ formatTime(cls.start_time) }}</div>
                                <div class="text-caption text-grey-5">{{ cls.day }}</div>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-card-section>
            </q-card>

            <!-- Revenue Analytics -->
            <q-card flat class="glass-modern">
                <q-card-section>
                    <div class="text-h6 text-weight-bold q-mb-lg flex items-center">
                        <q-icon name="analytics" color="green-7" class="q-mr-sm" />
                        Monthly Financial Snapshot
                    </div>
                    
                    <div class="row q-col-gutter-lg">
                        <div class="col-12 col-sm-6">
                            <div class="bg-green-50 q-pa-lg rounded-borders flex items-center justify-between">
                                <div>
                                    <div class="text-caption text-green-7 text-weight-bold">FEE REVENUE</div>
                                    <div class="text-h5 text-weight-bolder text-green-9">LKR {{ totalFees.toLocaleString() }}</div>
                                </div>
                                <q-icon name="south_west" color="green-7" size="32px" />
                            </div>
                        </div>
                        <div class="col-12 col-sm-6">
                            <div class="bg-red-50 q-pa-lg rounded-borders flex items-center justify-between">
                                <div>
                                    <div class="text-caption text-red-7 text-weight-bold">SALARY EXPENSES</div>
                                    <div class="text-h5 text-weight-bolder text-red-9">LKR {{ totalSalaries.toLocaleString() }}</div>
                                </div>
                                <q-icon name="north_east" color="red-7" size="32px" />
                            </div>
                        </div>
                    </div>

                    <!-- Visual Comparison Bar -->
                    <div class="q-mt-xl">
                        <div class="row justify-between q-mb-xs">
                            <span class="text-caption text-grey-6">Revenue vs Expenses</span>
                            <span class="text-caption text-weight-bold" :class="netRevenue >= 0 ? 'text-green' : 'text-red'">
                                Net Profit: LKR {{ netRevenue.toLocaleString() }}
                            </span>
                        </div>
                        <div class="revenue-balance-bar shadow-inner">
                            <div :style="{ width: expensePercentage + '%' }" class="expense-fill" />
                            <div :style="{ width: profitPercentage + '%' }" class="profit-fill" />
                        </div>
                        <div class="row q-mt-sm">
                            <div class="col-6 row items-center"><div class="legend-dot bg-red-5 q-mr-sm" /> <span class="text-caption">Expenses</span></div>
                            <div class="col-6 row items-center justify-end"><div class="legend-dot bg-green-5 q-mr-sm" /> <span class="text-caption">Profit</span></div>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Right Side Panel -->
        <div class="col-xs-12 col-md-4">
            <!-- Quick Link Cards -->
            <div class="row q-col-gutter-sm q-mb-md">
                <div class="col-6" v-for="link in quickLinks" :key="link.label">
                    <q-card flat class="q-pa-md text-center cursor-pointer quick-link-card shadow-1" @click="handleQuickAction(link.action)">
                        <q-icon :name="link.icon" :color="link.color" size="24px" class="q-mb-xs" />
                        <div class="text-caption text-weight-bold text-grey-8">{{ link.label }}</div>
                    </q-card>
                </div>
            </div>

            <!-- Recent Activity -->
             <q-card flat class="glass-modern overflow-hidden">
                <q-card-section class="bg-white q-pb-none">
                    <div class="text-h6 text-weight-bold">Recent Activity</div>
                </q-card-section>
                <q-card-section class="q-px-none">
                    <div v-if="activities.length === 0" class="text-center q-py-xl text-grey-4">
                        <q-icon name="history" size="48px" />
                        <div>No updates recorded</div>
                    </div>
                    <q-list padding class="activity-timeline">
                        <q-item v-for="act in activities" :key="act.id" class="activity-item">
                            <q-item-section avatar top class="relative-position">
                                <q-icon :name="getActivityIcon(act.type)" :color="getActivityColor(act.type)" size="20px" class="q-pa-xs bg-grey-1 rounded-borders" />
                                <div class="timeline-line" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-bold text-grey-9">{{ act.description }}</q-item-label>
                                <q-item-label caption class="text-grey-5">{{ formatTimeAgo(act.created_at) }}</q-item-label>
                                <q-badge v-if="act.amount" dense :color="getActivityColor(act.type)" outline class="q-mt-xs self-start">
                                    LKR {{ act.amount.toLocaleString() }}
                                </q-badge>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-card-section>
            </q-card>
        </div>
    </div>

    <!-- Class Detail Dialog -->
    <q-dialog v-model="showDetails" backdrop-filter="blur(10px) brightness(0.5)">
        <q-card style="width: 400px; border-radius: 24px;" class="overflow-hidden">
            <div :class="`q-pa-lg text-white text-center bg-gradient-${selectedClass?.id % 5 + 1}`">
                <div class="text-overline opacity-80 letter-spacing-wide">SESSION DETAILS</div>
                <div class="text-h4 text-weight-bolder">{{ selectedClass?.class_name }}</div>
                <q-chip outline color="white" text-color="white" class="q-mt-sm">{{ selectedClass?.subject }}</q-chip>
            </div>
            <q-card-section class="q-pa-xl">
                <div class="q-gutter-y-md">
                    <div class="row items-center border-bottom q-pb-md">
                        <q-icon name="schedule" color="primary" size="24px" class="q-mr-md" />
                        <div>
                            <div class="text-caption text-grey-6 uppercase">Time</div>
                            <div class="text-subtitle1 text-weight-bold">{{ formatTime(selectedClass?.start_time) }} - {{ formatTime(selectedClass?.end_time) }}</div>
                        </div>
                    </div>
                    <div class="row items-center border-bottom q-pb-md">
                        <q-icon name="person_pin" color="primary" size="24px" class="q-mr-md" />
                        <div>
                            <div class="text-caption text-grey-6 uppercase">Instructor</div>
                            <div class="text-subtitle1 text-weight-bold">{{ selectedClass?.tutor }}</div>
                        </div>
                    </div>
                    <div class="row items-center border-bottom q-pb-md">
                        <q-icon name="payments" color="primary" size="24px" class="q-mr-md" />
                        <div>
                            <div class="text-caption text-grey-6 uppercase">Monthly Fee</div>
                            <div class="text-subtitle1 text-weight-bold">LKR {{ Number(selectedClass?.fee).toLocaleString() }}</div>
                        </div>
                    </div>
                </div>
            </q-card-section>
            <q-card-actions align="center" class="q-pb-lg">
                <q-btn flat label="Close" color="grey-7" v-close-popup class="q-px-lg" />
                <q-btn color="primary" label="Mark Attendance" unelevated no-caps icon="qr_code_scanner" @click="handleQuickAction('attendance')" />
            </q-card-actions>
        </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { client } from 'src/api'
import gsap from 'gsap'
import PaymentDialog from 'src/components/PaymentDialog.vue'
import { notificationService } from 'src/utils/notifications'

const router = useRouter()
const showNotificationBanner = ref(true)

const notificationPermissionNeeded = computed(() => {
    return showNotificationBanner.value && 
           'Notification' in window && 
           Notification.permission === 'default'
})

const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission()
    if (granted) {
        $q.notify({ type: 'positive', message: 'Notifications enabled!' })
        notificationService.send('Welcome to ClassMaster!', { body: 'You will now receive important updates here.' })
    }
    showNotificationBanner.value = false
}

// Stats
const stats = ref([
  { label: 'Registered Students', value: 0, target: 0, progress: 0, icon: 'business', color: 'primary', to: '/dashboard/students' },
  { label: 'Net Revenue', value: 0, target: 0, progress: 0, prefix: 'LKR ', icon: 'account_balance_wallet', color: 'green', to: '/dashboard/fees' },
  { label: 'Active Tutors', value: 0, target: 0, progress: 0, icon: 'cast_for_education', color: 'purple', to: '/dashboard/tutors' },
  { label: 'Remaining Today', value: 0, target: 0, progress: 0, icon: 'pending_actions', color: 'orange', to: '/dashboard/classes' },
])

// Financials
const totalFees = ref(0)
const totalSalaries = ref(0)
const netRevenue = computed(() => totalFees.value - totalSalaries.value)
const expensePercentage = computed(() => {
    if (totalFees.value === 0) return 0
    return Math.min(100, (totalSalaries.value / totalFees.value) * 100)
})
const profitPercentage = computed(() => 100 - expensePercentage.value)

// Data
const todaySchedule = ref([])
const activities = ref([])
const dbCheckStatus = ref('Initializing...')
const realtimeStatusColor = ref('green')
const showDetails = ref(false)
const selectedClass = ref(null)

const quickLinks = [
    { label: 'Fee Collection', icon: 'currency_exchange', color: 'green-7', action: 'fees' },
    { label: 'Attendance', icon: 'qr_code_scanner', color: 'blue-7', action: 'attendance' },
    { label: 'New Class', icon: 'add_circle', color: 'orange-7', action: 'classes' },
    { label: 'Messages', icon: 'alternate_email', color: 'purple-7', action: 'message' }
]

const userProfile = ref(null)
const $q = useQuasar()

const showPaymentDetails = () => {
    $q.dialog({
        component: PaymentDialog
    })
}

onMounted(() => {
    fetchInitialData()
    fetchUserProfile()
})

const fetchUserProfile = async () => {
    try {
        const data = await client.get('me')
        if (data) userProfile.value = data
    } catch (e) {
        console.error('User profile fetch error:', e)
    }
}

const isTrialActive = computed(() => {
    if (!userProfile.value?.trial_ends_at) return false
    return new Date(userProfile.value.trial_ends_at) > new Date()
})

const trialDaysLeft = computed(() => {
    if (!userProfile.value?.trial_ends_at) return 0
    const diff = new Date(userProfile.value.trial_ends_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

const fetchInitialData = async () => {
    dbCheckStatus.value = 'Fetching data...'
    try {
        await Promise.all([
            fetchStats(),
            fetchActivities(),
            fetchSchedule()
        ])
        realtimeStatusColor.value = 'green'
    } catch {
        dbCheckStatus.value = 'Connection Error'
        realtimeStatusColor.value = 'red'
    }
}

const fetchStats = async () => {
    try {
        const data = await client.get('stats')
        if (data) {
            stats.value[0].target = data.students_count || 0
            stats.value[0].progress = Math.min(1, (data.students_count || 0) / 1000)

            // Fix: Set Net Revenue target so it animates
            stats.value[1].target = (data.monthly_revenue || 0) - (data.monthly_expenses || 0)
            stats.value[1].progress = Math.min(1, stats.value[1].target / 500000)

            stats.value[2].target = data.tutors_count || 0
            stats.value[2].progress = Math.min(1, (data.tutors_count || 0) / 50)
            
            stats.value[3].target = data.total_classes || 0
            stats.value[3].progress = 0.5 

            totalFees.value = data.monthly_revenue || 0
            totalSalaries.value = data.monthly_expenses || 0
        }
        animateStats()
    } catch (e) {
        console.error('Stats fetch error:', e)
    }
}

const fetchActivities = async () => {
    try {
        const data = await client.get('activities')
        if (data) activities.value = data.slice(0, 6)
    } catch (e) {
        console.error('Activities fetch error:', e)
    }
}

const fetchSchedule = async () => {
    try {
        const data = await client.get('schedule/today')
        if (data) todaySchedule.value = data
    } catch (e) {
        console.error('Schedule fetch error:', e)
    }
}

const animateStats = () => {
    stats.value.forEach(stat => {
        gsap.to(stat, {
            value: stat.target,
            duration: 1.5,
            ease: 'power2.out'
        })
    })
}

const showClassDetails = (cls) => {
    selectedClass.value = cls
    showDetails.value = true
}

const getActivityIcon = (type) => {
    switch(type) {
        case 'payment': return 'currency_exchange'
        case 'salary': return 'account_balance'
        case 'student': return 'person_add'
        case 'class': return 'calendar_month'
        default: return 'edit'
    }
}

const getActivityColor = (type) => {
    switch(type) {
        case 'payment': return 'green'
        case 'salary': return 'red'
        case 'student': return 'blue'
        case 'class': return 'orange'
        default: return 'grey'
    }
}

const formatTimeAgo = (at) => {
    const diff = Date.now() - new Date(at).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(at).toLocaleDateString()
}

const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
}

const handleQuickAction = (action) => {
    switch(action) {
        case 'fees': router.push('/dashboard/fees'); break;
        case 'attendance': router.push('/dashboard/attendance'); break;
        case 'classes': router.push('/dashboard/classes'); break;
        case 'message': router.push('/dashboard/messages'); break;
    }
}

const handleNewAdmission = () => router.push('/dashboard/students')
const handleViewAllSchedule = () => router.push('/dashboard/classes')

</script>

<style scoped lang="scss">
.glass-modern {
    background: white;
    border-radius: 20px;
    border: 1px solid rgba(0,0,0,0.05);
    transition: all 0.3s ease;
    &:hover {
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    }
}

.dashboard-stat-card {
    cursor: pointer;
    border-radius: 20px;
    transition: transform 0.2s;
    &:hover {
        transform: translateY(-4px);
    }
}

.stat-icon-bg {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.revenue-balance-bar {
    height: 12px;
    background: #e0e0e0;
    border-radius: 10px;
    display: flex;
    overflow: hidden;
    .expense-fill { background: #ff5252; transition: width 1s ease; }
    .profit-fill { background: #4caf50; transition: width 1s ease; }
}

.legend-dot { width: 8px; height: 8px; border-radius: 50%; }

.quick-link-card {
    border-radius: 16px;
    transition: all 0.3s;
    background: white;
    &:hover {
        background: #f8f9fa;
        transform: scale(1.05);
    }
}

.activity-timeline {
    padding-left: 20px;
    .activity-item {
        padding-bottom: 24px;
        &:last-child .timeline-line { display: none; }
    }
    .timeline-line {
        position: absolute;
        width: 1px;
        height: 100%;
        background: #eee;
        left: 20px;
        top: 30px;
    }
}

.modern-list {
    background: white;
    .q-item {
        transition: background 0.2s;
        &:hover { background: #f8f9fa; }
    }
}

.bg-gradient-1 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.bg-gradient-2 { background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%); }
.bg-gradient-3 { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.bg-gradient-4 { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.bg-gradient-5 { background: linear-gradient(135deg, #2af598 0%, #009efd 100%); }

.pulse { animation: pulse 2s infinite; }
@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

.letter-spacing-wide { letter-spacing: 0.08em; }
.border-bottom { border-bottom: 1px solid #f0f0f0; }
.premium-btn { border-radius: 12px; }
</style>
