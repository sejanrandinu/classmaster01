<template>
  <q-page class="bg-indigo-10 flex flex-center q-pa-md">
    <div class="portal-container">
      <div class="text-center q-mb-xl">
        <q-avatar size="80px" class="q-mb-md">
          <img src="/favicon.svg">
        </q-avatar>
        <h1 class="text-h4 text-white text-weight-bold q-mb-xs">Student Portal</h1>
        <p class="text-indigo-1">Check your Attendance, Fees, and Tutes</p>
      </div>

      <q-card v-if="!studentData" flat bordered class="auth-card q-pa-lg shadow-24">
        <q-form @submit="fetchStudentStatus" class="q-gutter-md">
          <div class="text-subtitle1 text-grey-8 text-center q-mb-md">Enter your Student ID to continue</div>
          <q-input 
            outlined 
            v-model="studentId" 
            label="Student ID" 
            placeholder="e.g. ST-2024-001"
            :rules="[val => !!val || 'Student ID is required']"
            bg-color="white"
          >
            <template v-slot:prepend><q-icon name="badge" color="indigo" /></template>
          </q-input>
          <q-btn 
            type="submit" 
            color="indigo-7" 
            label="View My Status" 
            unelevated 
            no-caps 
            class="full-width q-py-md text-weight-bold"
            :loading="loading"
          />
        </q-form>
      </q-card>

      <div v-else class="row q-col-gutter-lg">
        <!-- Student Info -->
        <div class="col-12">
            <q-card flat class="bg-white q-pa-md rounded-borders shadow-2">
                <div class="row items-center justify-between">
                    <div class="row items-center">
                        <q-avatar size="60px" color="indigo-1" text-color="indigo-10">
                            {{ studentData.name.charAt(0) }}
                        </q-avatar>
                        <div class="q-ml-md">
                            <div class="text-h6 text-weight-bold">{{ studentData.name }}</div>
                            <div class="text-caption text-grey-7">{{ studentData.student_id }} | {{ studentData.grade }}</div>
                        </div>
                    </div>
                    <q-btn flat color="grey-7" icon="logout" label="Change ID" @click="studentData = null" no-caps />
                </div>
            </q-card>
        </div>

        <!-- Attendance & Fees -->
        <div class="col-12 col-md-6">
            <q-card flat bordered class="bg-white full-height rounded-borders">
                <q-card-section class="bg-blue-1 text-blue-10 text-weight-bold">
                    <q-icon name="history" class="q-mr-xs" /> Attendance History
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-none">
                    <q-list separator>
                        <q-item v-for="att in attendance" :key="att.id">
                            <q-item-section>
                                <q-item-label class="text-weight-bold">{{ formatDate(att.date) }}</q-item-label>
                                <q-item-label caption>{{ att.class_name }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-badge :color="att.status === 'Present' ? 'green' : 'red'">{{ att.status }}</q-badge>
                            </q-item-section>
                        </q-item>
                        <div v-if="attendance.length === 0" class="text-center q-pa-lg text-grey-5">No records found.</div>
                    </q-list>
                </q-card-section>
            </q-card>
        </div>

        <div class="col-12 col-md-6">
            <q-card flat bordered class="bg-white full-height rounded-borders">
                <q-card-section class="bg-green-1 text-green-10 text-weight-bold">
                    <q-icon name="payments" class="q-mr-xs" /> Fees Status
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-none">
                    <q-list separator>
                        <q-item v-for="pay in payments" :key="pay.id">
                            <q-item-section>
                                <q-item-label class="text-weight-bold">{{ pay.month }}</q-item-label>
                                <q-item-label caption>Rs. {{ pay.amount }} | {{ pay.payment_method }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-badge color="green">Paid</q-badge>
                            </q-item-section>
                        </q-item>
                        <div v-if="payments.length === 0" class="text-center q-pa-lg text-grey-5">No payment records found.</div>
                    </q-list>
                </q-card-section>
            </q-card>
        </div>

        <!-- Tutes -->
        <div class="col-12 col-md-6">
            <q-card flat bordered class="bg-white full-height rounded-borders">
                <q-card-section class="bg-indigo-1 text-indigo-10 text-weight-bold">
                    <q-icon name="description" class="q-mr-xs" /> Physical Tutes & Materials
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-none">
                    <q-list separator>
                        <q-item v-for="tute in tutesList" :key="tute.id">
                            <q-item-section>
                                <q-item-label class="text-weight-bold">{{ tute.title }}</q-item-label>
                                <q-item-label caption>{{ tute.subject_name }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-chip 
                                    :color="isReceived(tute.id) ? 'green-1' : 'orange-1'" 
                                    :text-color="isReceived(tute.id) ? 'green-8' : 'orange-8'"
                                    :icon="isReceived(tute.id) ? 'check' : 'pending'"
                                    size="sm"
                                    class="text-weight-bold"
                                >
                                    {{ isReceived(tute.id) ? 'Received' : 'Pending' }}
                                </q-chip>
                            </q-item-section>
                        </q-item>
                        <div v-if="tutesList.length === 0" class="text-center q-pa-lg text-grey-5">No tutorials assigned yet.</div>
                    </q-list>
                </q-card-section>
            </q-card>
        </div>

        <!-- Exam Performance -->
        <div class="col-12 col-md-6">
            <q-card flat bordered class="bg-white full-height rounded-borders">
                <q-card-section class="bg-purple-1 text-purple-10 text-weight-bold">
                    <q-icon name="analytics" class="q-mr-xs" /> Exam Performance
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-none">
                    <q-list separator>
                        <q-item v-for="result in examResultsList" :key="result.id" class="q-py-md">
                            <q-item-section avatar>
                                <q-avatar :color="getPerfColor(result.group, true)" :text-color="getPerfColor(result.group)">
                                    {{ Math.round(result.percentage) }}%
                                </q-avatar>
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-bold">{{ result.exam_title }}</q-item-label>
                                <q-item-label caption>
                                    Rank: {{ result.rank }} / {{ result.total_students }} 
                                    <q-separator vertical inline class="q-mx-xs" />
                                    Avg: {{ Math.round(result.average_marks) }}
                                </q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-badge :color="getPerfColor(result.group)" class="q-pa-xs">
                                    {{ getGroupName(result.group) }}
                                </q-badge>
                            </q-item-section>
                        </q-item>
                        <div v-if="examResultsList.length === 0" class="text-center q-pa-lg text-grey-5">No exam results published yet.</div>
                    </q-list>
                </q-card-section>
            </q-card>
        </div>
      </div>

      <div class="text-center q-mt-xl text-indigo-2 text-caption">
        &copy; 2024 ClassMaster - Premium Institute Management System
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { client, tutes, studentTutes } from 'src/api'

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
        examResultsList.value = data.examResults || []

        // Fetch tutes list for the student's grade/subjects
        const allTutes = await tutes.getAll({ grade: data.student.grade })
        tutesList.value = allTutes.filter(t => 
            data.student.subjects && data.student.subjects.includes(t.subject_name)
        )

        // Fetch tutes history for tracking received status
        const history = await studentTutes.getAll({ student_id: data.student.id })
        receivedTuteIds.value = history.map(h => h.tute_id)

    } catch {
        $q.notify({ type: 'negative', message: 'Error fetching status. Please try again.' })
    } finally {
        loading.value = false
    }
}

const getPerfColor = (group, isBg = false) => {
    const colors = {
        green: isBg ? 'green-1' : 'green-7',
        blue: isBg ? 'blue-1' : 'blue-7',
        yellow: isBg ? 'yellow-1' : 'yellow-8',
        red: isBg ? 'red-1' : 'red-7'
    }
    return colors[group] || 'grey'
}

const getGroupName = (group) => {
    const names = {
        green: 'Elite (Green)',
        blue: 'Advanced (Blue)',
        yellow: 'Average (Yellow)',
        red: 'Focus (Red)'
    }
    return names[group] || 'Unknown'
}

const isReceived = (id) => receivedTuteIds.value.includes(id)

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.portal-container {
    width: 100%;
    max-width: 800px;
}
.auth-card {
    border-radius: 20px;
}
</style>
