<template>
  <q-page class="q-pa-lg bg-grey-1">
    <!-- Page Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h3 text-weight-bolder text-grey-9 q-mb-xs mt-0">Attendance Tracker</h1>
        <div class="text-subtitle1 text-grey-6">Mark and monitor student attendance for your classes.</div>
      </div>
    </div>

    <!-- Filters Section -->
    <q-card flat class="glass-modern q-pa-lg q-mb-xl">
        <div class="row q-col-gutter-lg items-end">
            <div class="col-12 col-md-4">
                <q-select 
                    filled 
                    v-model="selectedClass" 
                    :options="classOptions" 
                    label="Select Class" 
                    emit-value
                    map-options
                    @update:model-value="fetchAttendanceData"
                >
                    <template v-slot:prepend><q-icon name="class" color="primary" /></template>
                </q-select>
            </div>
            <div class="col-12 col-md-3">
                <q-input filled v-model="selectedDate" label="Session Date" type="date" stack-label @update:model-value="fetchAttendanceData">
                    <template v-slot:prepend><q-icon name="event" color="primary" /></template>
                </q-input>
            </div>
            <div class="col-12 col-md-5">
                <div class="row q-gutter-sm justify-end">
                    <q-btn 
                        color="green-7" 
                        outline 
                        icon="fa-brands fa-whatsapp" 
                        label="Notify All Present" 
                        no-caps 
                        class="rounded-borders"
                        :disable="students.length === 0"
                        @click="notifyAllPresent"
                    >
                        <q-tooltip>Send WhatsApp to all present students</q-tooltip>
                    </q-btn>
                    <q-btn 
                        color="secondary" 
                        outline 
                        icon="history" 
                        label="View History" 
                        to="/dashboard/attendance-history" 
                        no-caps 
                        class="rounded-borders"
                    />
                    <q-btn 
                        color="primary" 
                        icon="check_circle" 
                        label="Save Attendance" 
                        unelevated 
                        no-caps 
                        class="premium-btn q-px-lg"
                        :loading="loading"
                        @click="saveAttendance"
                    />
                </div>
            </div>
        </div>
    </q-card>

    <!-- Content Area -->
    <div v-if="!selectedClass" class="flex flex-center q-pa-xl empty-container">
        <div class="text-center">
            <q-icon name="arrow_upward" size="64px" color="grey-4" />
            <div class="text-h5 text-grey-5 q-mt-md">Please select a class to begin</div>
        </div>
    </div>

    <div v-else-if="students.length === 0 && !loading" class="flex flex-center q-pa-xl empty-container">
        <div class="text-center">
            <q-icon name="group_off" size="64px" color="grey-4" />
            <div class="text-h5 text-grey-5 q-mt-md">No students found for this grade</div>
            <p class="text-grey-6">Only students in {{ selectedClassGrade }} will appear here.</p>
        </div>
    </div>

    <div v-else class="row q-col-gutter-lg">
        <div class="col-12">
            <q-card flat class="glass-modern overflow-hidden">
                <q-table
                    flat
                    :rows="students"
                    :columns="columns"
                    row-key="id"
                    :pagination="{ rowsPerPage: 0 }"
                    hide-bottom
                >
                    <template v-slot:body-cell-status="props">
                        <q-td :props="props">
                            <q-btn-toggle
                                v-model="props.row.attendanceStatus"
                                spread
                                no-caps
                                unelevated
                                toggle-color="primary"
                                color="grey-2"
                                text-color="grey-7"
                                size="sm"
                                class="attendance-toggle"
                                :options="[
                                    { label: 'Present', value: 'Present', slot: 'present' },
                                    { label: 'Absent', value: 'Absent', slot: 'absent' }
                                ]"
                            >
                                <template v-slot:present>
                                    <q-icon name="check" size="16px" class="q-mr-xs" /> Present
                                </template>
                                <template v-slot:absent>
                                    <q-icon name="close" size="16px" class="q-mr-xs" /> Absent
                                </template>
                            </q-btn-toggle>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-student_id="props">
                        <q-td :props="props">
                           <span class="text-weight-bold text-primary">{{ props.value }}</span>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-name="props">
                        <q-td :props="props">
                            <div class="row items-center">
                                <q-avatar size="28px" color="blue-1" text-color="primary" class="q-mr-sm">
                                    {{ props.row.name.charAt(0) }}
                                </q-avatar>
                                <span class="text-weight-medium">{{ props.row.name }}</span>
                            </div>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-notify="props">
                        <q-td :props="props" class="text-center">
                            <q-btn 
                                v-if="props.row.attendanceStatus === 'Present'"
                                flat 
                                round 
                                color="green-7" 
                                icon="fa-brands fa-whatsapp" 
                                size="sm"
                                @click="sendWA(props.row)"
                            >
                                <q-tooltip>Notify via WhatsApp</q-tooltip>
                            </q-btn>
                            <div v-else class="text-grey-4">-</div>
                        </q-td>
                    </template>
                </q-table>
            </q-card>
        </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { client } from 'src/api'
import { useQuasar } from 'quasar'
import { useAppStore } from 'src/store/app'

const $q = useQuasar()
const appStore = useAppStore()
const loading = ref(false)
const selectedClass = ref(null)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const classOptions = ref([])
const students = ref([])
const allClasses = ref([])

const columns = [
  { name: 'student_id', align: 'left', label: 'ID', field: 'student_id', sortable: true },
  { name: 'name', align: 'left', label: 'Student Name', field: 'name', sortable: true },
  { name: 'status', align: 'center', label: 'Attendance Status', field: 'id' },
  { name: 'notify', align: 'center', label: 'Notify', field: 'id' }
]

const selectedClassGrade = computed(() => {
    const cls = allClasses.value.find(c => c.id === selectedClass.value)
    return cls ? cls.grade : ''
})

onMounted(() => {
    loadClasses()
})

const loadClasses = async () => {
    try {
        const data = await client.get('classes')
        if (data) {
            allClasses.value = data.filter(c => c.status === 'Active')
            classOptions.value = allClasses.value.map(c => ({
                label: `${c.class_name} (${c.grade})`,
                value: c.id
            }))
        }
    } catch {
        // Silently fail
    }
}

const fetchAttendanceData = async () => {
    if (!selectedClass.value || !selectedDate.value) return

    loading.value = true
    try {
        // Fetch students and existing attendance
        const [studentData, existingAttendance] = await Promise.all([
            client.get('students'),
            client.get(`attendance?class_id=${selectedClass.value}&date=${selectedDate.value}`)
        ])

        if (studentData) {
            const cls = allClasses.value.find(c => c.id === selectedClass.value)
            const classSubject = cls ? cls.subject : ''
            
            const gradeStudents = studentData.filter(s => {
                const sameGrade = s.grade === selectedClassGrade.value;
                const takesSubject = s.subjects && s.subjects.includes(classSubject);
                return sameGrade && takesSubject && s.status === 'Active';
            })

            students.value = gradeStudents.map(s => {
                const marked = existingAttendance?.find(a => a.student_id === s.id)
                return {
                    ...s,
                    attendanceStatus: marked ? marked.status : 'Present'
                }
            })
        }
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to load attendance data' })
    } finally {
        loading.value = false
    }
}

const saveAttendance = async () => {
    if (!selectedClass.value || !selectedDate.value) {
        $q.notify({ type: 'warning', message: 'Please select class and date' })
        return
    }

    loading.value = true
    const attendanceRecords = students.value.map(s => ({
        student_id: s.id,
        class_id: selectedClass.value,
        date: selectedDate.value,
        status: s.attendanceStatus
    }))

    try {
        await client.post('attendance/upsert', { records: attendanceRecords })
        $q.notify({ type: 'positive', message: 'Attendance records saved successfully' })
    } catch {
        $q.notify({ type: 'negative', message: 'Save failed' })
    } finally {
        loading.value = false
    }
}

const notifyAllPresent = () => {
    if (!appStore.whatsappEnabled) return
    const presentStudents = students.value.filter(s => s.attendanceStatus === 'Present' && s.contact)
    if (presentStudents.length === 0) return

    $q.dialog({
        title: 'Notify All Present',
        message: `Open WhatsApp for ${presentStudents.length} students?`,
        cancel: true,
        ok: { label: 'Start', color: 'green' }
    }).onOk(() => {
        presentStudents.forEach((student, index) => {
            setTimeout(() => sendWA(student), index * 1000)
        })
    })
}

const sendWA = (student) => {
    if (!appStore.whatsappEnabled) return
    if (!student.contact) return
    
    let phone = student.contact
    if (phone.startsWith('0')) phone = '94' + phone.substring(1)
    phone = phone.replace(/\D/g, '')

    const portalLink = `${window.location.origin}/#/student-portal?id=${student.student_id}`
    const message = `ආයුබෝවන් ${student.name}, අද පන්තියට පැමිණි බව අපි සටහන් කර ගත්තා. ඔබේ පැමිණීම සහ වාර්තා මෙතැනින් බලන්න: ${portalLink}`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
}
</script>

<style scoped lang="scss">
.glass-modern {
    background: white;
    border-radius: 20px;
    border: 1px solid rgba(0,0,0,0.05);
    box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05);
}

.premium-btn {
    border-radius: 12px;
    font-weight: 700;
}

.attendance-toggle {
    border-radius: 10px;
    overflow: hidden;
    width: 200px;
}

.empty-container {
    min-height: 300px;
    background: rgba(255,255,255,0.5);
    border-radius: 30px;
    border: 2px dashed rgba(0,0,0,0.05);
}

.border-dashed {
    border: 1px dashed rgba(0,0,0,0.1);
}
</style>
