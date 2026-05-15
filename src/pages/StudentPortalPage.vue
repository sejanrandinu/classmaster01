<template>
  <q-page class="portal-root q-pa-md">
    <div class="portal-container">
      <!-- Header Branding -->
      <div class="row items-center justify-between q-mb-xl">
        <div class="row items-center">
            <q-avatar size="50px" class="q-mr-md glow-shadow">
                <img src="/favicon.svg">
            </q-avatar>
            <div>
                <h1 class="text-h4 text-weight-bolder text-white no-margin letter-spacing-tight">Student Portal</h1>
                <div class="text-indigo-2 text-caption">Performance & Academic Metrics v2.0</div>
            </div>
        </div>
        <div v-if="studentData" class="gt-xs">
            <q-btn flat color="white" icon="logout" label="Sign Out" @click="studentData = null" no-caps class="glass-btn" />
        </div>
      </div>

      <!-- Auth State: ID Entry -->
      <div v-if="!studentData" class="flex flex-center" style="min-height: 60vh;">
        <q-card flat class="auth-card glass-modern q-pa-xl shadow-24 text-center">
            <div class="q-mb-lg">
                <q-icon name="fingerprint" size="64px" color="indigo-4" class="q-mb-md" />
                <div class="text-h5 text-white text-weight-bold">Academic Identity</div>
                <p class="text-indigo-2">Enter your unique student identifier to access your dashboard.</p>
            </div>
            <q-form @submit="fetchStudentStatus" class="q-gutter-md">
                <q-input 
                    filled 
                    v-model="studentId" 
                    label="Student ID" 
                    dark 
                    color="indigo-4"
                    class="id-input-field"
                    :rules="[val => !!val || 'Required']"
                >
                    <template v-slot:prepend><q-icon name="badge" /></template>
                </q-input>
                <q-btn 
                    type="submit" 
                    color="white" 
                    text-color="indigo-10" 
                    label="Initialize Dashboard" 
                    unelevated 
                    no-caps 
                    class="full-width q-py-md text-weight-bold premium-btn"
                    :loading="loading"
                />
            </q-form>
        </q-card>
      </div>

      <!-- Dashboard State -->
      <div v-else class="row q-col-gutter-lg">
        <!-- Student Header Card -->
        <div class="col-12">
            <q-card flat class="glass-modern profile-banner overflow-hidden">
                <div class="banner-accent"></div>
                <q-card-section class="row items-center q-pa-lg">
                    <q-avatar size="100px" class="q-mr-xl profile-avatar-glow">
                        <img :src="studentData.image_url || `https://ui-avatars.com/api/?name=${studentData.name}&background=6366f1&color=fff`" />
                    </q-avatar>
                    <div class="col">
                        <div class="row items-center">
                            <h2 class="text-h3 text-weight-bolder text-white no-margin">{{ studentData.name }}</h2>
                            <q-badge color="green-4" text-color="black" class="q-ml-md text-weight-bold">ACTIVE STUDENT</q-badge>
                        </div>
                        <div class="text-h6 text-indigo-2 q-mt-xs">{{ studentData.student_id }} | {{ studentData.grade }} | {{ studentData.school }}</div>
                        <div class="row q-gutter-md q-mt-md">
                            <div class="stat-pill">
                                <q-icon name="event_available" class="q-mr-xs" /> {{ attendanceRate }}% Attendance
                            </div>
                            <div class="stat-pill">
                                <q-icon name="emoji_events" class="q-mr-xs" /> Rank: #{{ latestRank }}
                            </div>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Quick Stats Grid -->
        <div class="col-12">
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-3" v-for="stat in quickStats" :key="stat.label">
                    <q-card flat class="glass-modern stat-mini-card">
                        <q-card-section>
                            <div class="row items-center justify-between q-mb-sm">
                                <div class="text-caption text-indigo-2 text-uppercase letter-spacing-wide">{{ stat.label }}</div>
                                <q-icon :name="stat.icon" :color="stat.color" size="20px" />
                            </div>
                            <div class="text-h4 text-white text-weight-bolder">{{ stat.value }}</div>
                            <div class="text-caption" :class="`text-${stat.color}-3`">{{ stat.desc }}</div>
                        </q-card-section>
                    </q-card>
            </div>
        </div>
    </div>

        <!-- Recent Exam Results -->
        <div class="col-12">
            <q-card flat class="glass-modern">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6 text-white text-weight-bold">Recent Exam Results</div>
                    <q-badge color="indigo-7">Performance Breakdown</q-badge>
                </q-card-section>
                <q-card-section class="q-pa-none">
                    <q-table
                        flat
                        dark
                        :rows="examResultsList"
                        :columns="resultColumns"
                        row-key="id"
                        hide-bottom
                        class="bg-transparent"
                    >
                        <template v-slot:body-cell-status="props">
                            <q-td :props="props" class="text-center">
                                <q-chip 
                                    :color="getStatusColor(props.row.group, true)" 
                                    :text-color="getStatusColor(props.row.group, false)"
                                    size="sm"
                                    class="text-weight-bold"
                                >
                                    {{ getGroupName(props.row.group) }}
                                </q-chip>
                            </q-td>
                        </template>
                        <template v-slot:body-cell-marks="props">
                            <q-td :props="props">
                                <div class="text-weight-bold text-white">{{ props.row.marks_obtained }} / {{ props.row.max_marks }}</div>
                                <q-linear-progress :value="props.row.percentage / 100" :color="getStatusColor(props.row.group, false)" class="q-mt-xs" />
                            </q-td>
                        </template>
                    </q-table>
                </q-card-section>
            </q-card>
        </div>

        <!-- Performance Analytics Section -->
        <div class="col-12 col-md-8">
            <q-card flat class="glass-modern chart-card h-full">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6 text-white text-weight-bold">Academic Performance Trend</div>
                    <q-tabs v-model="chartTab" dense class="text-indigo-2" active-color="white" indicator-color="white">
                        <q-tab name="marks" label="Marks" />
                        <q-tab name="ranks" label="Ranks" />
                    </q-tabs>
                </q-card-section>
                <q-card-section class="q-pa-md">
                    <apexchart 
                        v-if="chartTab === 'marks'"
                        type="area" 
                        height="350" 
                        :options="markChartOptions" 
                        :series="markChartSeries" 
                    />
                    <apexchart 
                        v-else
                        type="line" 
                        height="350" 
                        :options="rankChartOptions" 
                        :series="rankChartSeries" 
                    />
                </q-card-section>
            </q-card>
        </div>

        <!-- Peer Comparison Chart -->
        <div class="col-12 col-md-4">
            <q-card flat class="glass-modern chart-card h-full">
                <q-card-section>
                    <div class="text-h6 text-white text-weight-bold">Peer Comparison</div>
                    <div class="text-caption text-indigo-2 q-mb-md">Latest: {{ latestExamTitle }}</div>
                </q-card-section>
                <q-card-section class="flex flex-center">
                    <apexchart 
                        type="bar" 
                        height="350" 
                        width="100%"
                        :options="comparisonChartOptions" 
                        :series="comparisonChartSeries" 
                    />
                </q-card-section>
            </q-card>
        </div>

        <!-- Attendance Heatmap/Table -->
        <div class="col-12 col-md-6">
            <q-card flat class="glass-modern h-full">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6 text-white text-weight-bold">Attendance History</div>
                    <q-badge color="indigo-7">Last 10 Sessions</q-badge>
                </q-card-section>
                <q-card-section class="q-pa-none">
                    <q-list separator dark>
                        <q-item v-for="att in attendance" :key="att.id" class="q-py-md">
                            <q-item-section avatar>
                                <q-avatar :color="att.status === 'Present' ? 'green-9' : 'red-9'" text-color="white" icon="event" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-bold text-white">{{ formatDate(att.date) }}</q-item-label>
                                <q-item-label caption class="text-indigo-2">{{ att.class_name }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-chip dense :color="att.status === 'Present' ? 'green-4' : 'red-4'" text-color="black" class="text-weight-bold">
                                    {{ att.status }}
                                </q-chip>
                            </q-item-section>
                        </q-item>
                    </q-list>
                    <div v-if="attendance.length === 0" class="text-center q-pa-xl text-indigo-4">No records found.</div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Tutes & Materials -->
        <div class="col-12 col-md-6">
            <q-card flat class="glass-modern h-full">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6 text-white text-weight-bold">Tutorials & Materials</div>
                    <q-icon name="description" color="indigo-2" size="24px" />
                </q-card-section>
                <q-card-section class="q-pa-none">
                    <q-list separator dark>
                        <q-item v-for="tute in tutesList" :key="tute.id" class="q-py-md">
                            <q-item-section>
                                <q-item-label class="text-weight-bold text-white">{{ tute.title }}</q-item-label>
                                <q-item-label caption class="text-indigo-2">{{ tute.subject_name }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-chip 
                                    :color="isReceived(tute.id) ? 'green-9' : 'orange-9'" 
                                    :text-color="isReceived(tute.id) ? 'green-2' : 'orange-2'"
                                    :icon="isReceived(tute.id) ? 'check_circle' : 'pending'"
                                    class="text-weight-bold"
                                >
                                    {{ isReceived(tute.id) ? 'RECEIVED' : 'PENDING' }}
                                </q-chip>
                            </q-item-section>
                        </q-item>
                    </q-list>
                    <div v-if="tutesList.length === 0" class="text-center q-pa-xl text-indigo-4">No tutorials assigned yet.</div>
                </q-card-section>
            </q-card>
        </div>

      </div>

      <div class="text-center q-mt-xl text-indigo-4 text-caption q-pb-xl">
        &copy; 2026 ClassMaster v3.1 Premium - Institute Management Ecosystem
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { client, tutes, studentTutes } from 'src/api'
import VueApexCharts from 'vue3-apexcharts'

const apexchart = VueApexCharts

const $q = useQuasar()
const route = useRoute()
const studentId = ref('')
const loading = ref(false)
const studentData = ref(null)
const attendance = ref([])
const payments = ref([])
const tutesList = ref([])
const receivedTuteIds = ref([])
const examResultsList = ref([])

const chartTab = ref('marks')

onMounted(() => {
    if (route.query.id) {
        studentId.value = route.query.id
        fetchStudentStatus()
    }
})

const fetchStudentStatus = async () => {
    loading.value = true
    try {
        const data = await client.get(`students/public-portal/${studentId.value}`)
        if (!data) {
            $q.notify({ type: 'negative', message: 'Student ID not found!' })
            return
        }

        studentData.value = data.student
        attendance.value = data.attendance || []
        payments.value = data.payments || []
        examResultsList.value = (data.examResults || []).reverse() // Chronological for charts

        // Fetch tutes list for the student's grade/subjects
        const allTutes = await tutes.getAll({ grade: data.student.grade })
        tutesList.value = allTutes.filter(t => 
            data.student.subjects && data.student.subjects.includes(t.subject_name)
        )

        const history = await studentTutes.getAll({ student_id: data.student.id })
        receivedTuteIds.value = history.map(h => h.tute_id)

    } catch {
        $q.notify({ type: 'negative', message: 'Network synchronization failed.' })
    } finally {
        loading.value = false
    }
}

// Analytics Helpers
const attendanceRate = computed(() => {
    if (attendance.value.length === 0) return 0
    const present = attendance.value.filter(a => a.status === 'Present').length
    return Math.round((present / attendance.value.length) * 100)
})

const latestRank = computed(() => {
    if (examResultsList.value.length === 0) return '-'
    return examResultsList.value[examResultsList.value.length - 1].rank
})

const latestExamTitle = computed(() => {
    if (examResultsList.value.length === 0) return 'No Data'
    return examResultsList.value[examResultsList.value.length - 1].exam_title
})

const quickStats = computed(() => [
    { label: 'Total Exams', value: examResultsList.value.length, icon: 'edit_note', color: 'blue', desc: 'Participated' },
    { label: 'Average Marks', value: `${Math.round(avgMarks.value)}%`, icon: 'insights', color: 'purple', desc: 'Global Performance' },
    { label: 'Fee Status', value: pendingFees.value > 0 ? 'Pending' : 'Cleared', icon: 'payments', color: pendingFees.value > 0 ? 'orange' : 'green', desc: 'Monthly Billing' },
    { label: 'Pending Tutes', value: tutesList.value.length - receivedTuteIds.value.length, icon: 'inventory_2', color: 'indigo', desc: 'Physical Materials' },
])

const avgMarks = computed(() => {
    if (examResultsList.value.length === 0) return 0
    return examResultsList.value.reduce((acc, curr) => acc + curr.percentage, 0) / examResultsList.value.length
})

const pendingFees = computed(() => {
    // Basic logic: if 0 payments, show pending. In real app, check against months.
    return payments.value.length === 0 ? 1 : 0
})

// Charts Options & Series
const markChartSeries = computed(() => [{
    name: 'My Marks',
    data: examResultsList.value.map(r => Math.round(r.percentage))
}])

const markChartOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
    stroke: { curve: 'smooth', width: 3 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1 } },
    colors: ['#6366f1'],
    xaxis: { categories: examResultsList.value.map(r => r.exam_title), labels: { style: { colors: '#94a3b8' } } },
    yaxis: { min: 0, max: 100, labels: { style: { colors: '#94a3b8' } } },
    theme: { mode: 'dark' },
    grid: { borderColor: 'rgba(255,255,255,0.1)' }
}

const rankChartSeries = computed(() => [{
    name: 'Rank',
    data: examResultsList.value.map(r => r.rank)
}])

const rankChartOptions = {
    chart: { type: 'line', toolbar: { show: false } },
    stroke: { curve: 'stepline', width: 3 },
    colors: ['#a855f7'],
    xaxis: { categories: examResultsList.value.map(r => r.exam_title), labels: { style: { colors: '#94a3b8' } } },
    yaxis: { reversed: true, labels: { style: { colors: '#94a3b8' } } },
    theme: { mode: 'dark' },
    grid: { borderColor: 'rgba(255,255,255,0.1)' }
}

const comparisonChartSeries = computed(() => {
    if (examResultsList.value.length === 0) return []
    const latest = examResultsList.value[examResultsList.value.length - 1]
    return [{
        name: 'Marks',
        data: [
            { x: 'Me', y: Math.round(latest.percentage) },
            { x: 'Class Avg', y: Math.round(latest.average_marks) },
            { x: 'Highest', y: Math.round(latest.highest_marks) }
        ]
    }]
})

const comparisonChartOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 10, distributed: true, columnWidth: '60%' } },
    colors: ['#6366f1', '#94a3b8', '#10b981'],
    legend: { show: false },
    theme: { mode: 'dark' },
    xaxis: { labels: { style: { colors: '#94a3b8' } } },
    yaxis: { min: 0, max: 100, labels: { style: { colors: '#94a3b8' } } },
    grid: { show: false }
}

const isReceived = (id) => receivedTuteIds.value.includes(id)
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

const resultColumns = [
    { name: 'exam', align: 'left', label: 'Exam Title', field: 'exam_title' },
    { name: 'marks', align: 'left', label: 'Marks', field: 'marks_obtained' },
    { name: 'rank', align: 'center', label: 'Rank', field: 'rank' },
    { name: 'status', align: 'center', label: 'Status', field: 'group' }
]

const getStatusColor = (group, isBg) => {
    const colors = {
        green: { bg: 'green-9', text: 'green-2' },
        yellow: { bg: 'yellow-9', text: 'yellow-2' },
        blue: { bg: 'blue-9', text: 'blue-2' },
        red: { bg: 'red-9', text: 'red-2' }
    }
    const c = colors[group] || colors.red
    return isBg ? c.bg : c.text
}

const getGroupName = (group) => {
    const names = {
        green: 'Elite',
        yellow: 'Good',
        blue: 'Average',
        red: 'Needs Focus'
    }
    return names[group] || 'Unknown'
}

</script>

<style scoped lang="scss">
.portal-root {
    background: radial-gradient(circle at top right, #1e1b4b, #000);
    min-height: 100vh;
}

.portal-container {
    max-width: 1200px;
    margin: 0 auto;
}

.glass-modern {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    transition: all 0.3s ease;
    &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.2);
    }
}

.auth-card {
    width: 100%;
    max-width: 450px;
}

.profile-banner {
    position: relative;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
    .banner-accent {
        position: absolute;
        top: -50px;
        right: -50px;
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
        border-radius: 50%;
    }
}

.profile-avatar-glow {
    border: 4px solid rgba(99, 102, 241, 0.5);
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
}

.stat-pill {
    background: rgba(255, 255, 255, 0.05);
    padding: 6px 16px;
    border-radius: 100px;
    color: #e2e8f0;
    font-size: 0.9rem;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-mini-card {
    border-bottom: 4px solid transparent;
    &:hover {
        border-bottom-color: #6366f1;
    }
}

.chart-card {
    padding: 10px;
}

.id-input-field {
    :deep(.q-field__control) {
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
    }
}

.premium-btn {
    border-radius: 12px;
    transition: transform 0.2s;
    &:hover {
        transform: scale(1.02);
    }
}

.glow-shadow {
    filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.5));
}

.letter-spacing-tight { letter-spacing: -0.05em; }
.letter-spacing-wide { letter-spacing: 0.1em; }

@media (max-width: 600px) {
    .text-h3 { font-size: 2rem; }
    .profile-banner { text-align: center; }
    .profile-banner .q-avatar { margin: 0 0 20px 0; }
    .stat-mini-card { margin-bottom: 10px; }
}
</style>
