<template>
  <q-page class="q-pa-lg bg-grey-1">
    <!-- Page Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h3 text-weight-bolder text-grey-9 q-mb-xs mt-0">Messaging Center</h1>
        <div class="text-subtitle1 text-grey-6">Send updates, reminders, and announcements to your students.</div>
      </div>
      <div class="bg-white rounded-borders q-pa-sm shadow-1">
        <q-tabs
            v-model="activeTab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
        >
            <q-tab name="compose" label="Compose" icon="send" />
            <q-tab name="reminders" label="Fee Reminders" icon="notifications_active" />
            <q-tab name="logs" label="History" icon="history" />
        </q-tabs>
      </div>
    </div>

    <q-tab-panels v-model="activeTab" animated class="bg-transparent">
      <!-- COMPOSE TAB -->
      <q-tab-panel name="compose" class="q-pa-none">
        <div class="row q-col-gutter-xl">
            <div class="col-12 col-md-5">
                <q-card flat class="glass-modern q-pa-xl overflow-hidden">
                    <h2 class="text-h5 text-weight-bold q-mb-lg row items-center">
                        <q-icon name="edit_note" color="primary" class="q-mr-sm" />
                        Compose New Message
                    </h2>

                    <q-form @submit="sendMessage" class="q-gutter-lg">
                        <!-- Recipient Type -->
                        <div class="bg-grey-1 q-pa-sm rounded-borders">
                            <q-btn-toggle
                                v-model="msgForm.recipient_type"
                                spread
                                no-caps
                                unelevated
                                toggle-color="primary"
                                color="white"
                                text-color="grey-7"
                                :options="[
                                    {label: 'Individual', value: 'Student', icon: 'person'},
                                    {label: 'Class Broadcast', value: 'Class', icon: 'groups'}
                                ]"
                            />
                        </div>
                        
                        <!-- Dependent Recipient Selection -->
                        <q-select
                            v-if="msgForm.recipient_type === 'Student'"
                            filled
                            v-model="selectedRecipient"
                            use-input
                            input-debounce="300"
                            label="Search Student"
                            :options="studentOptions"
                            @filter="filterStudents"
                            :rules="[val => !!val || 'Required']"
                        >
                            <template v-slot:prepend><q-icon name="person_search" color="primary" /></template>
                        </q-select>

                        <q-select
                            v-else
                            filled
                            v-model="selectedRecipient"
                            :options="classOptions"
                            label="Select Class"
                            :rules="[val => !!val || 'Required']"
                        >
                            <template v-slot:prepend><q-icon name="class" color="primary" /></template>
                        </q-select>

                        <!-- Message Content -->
                        <q-input
                            filled
                            v-model="msgForm.content"
                            type="textarea"
                            label="Message Content"
                            placeholder="Type your message here..."
                            rows="6"
                            counter
                            maxlength="500"
                            :rules="[val => !!val || 'Message cannot be empty']"
                        >
                            <template v-slot:hint>
                                Use WhatsApp to send directly.
                            </template>
                        </q-input>

                        <div class="row q-mt-xl">
                            <q-btn 
                                type="submit" 
                                color="green-7" 
                                :label="msgForm.recipient_type === 'Student' ? 'Send via WhatsApp' : 'Open Broadcast Tabs'" 
                                icon="fa-brands fa-whatsapp" 
                                unelevated 
                                class="full-width premium-btn h-50"
                                :loading="loading"
                            />
                        </div>
                    </q-form>
                </q-card>
            </div>
            
            <div class="col-12 col-md-7">
                <q-card flat class="glass-modern q-pa-lg text-center flex flex-center" style="min-height: 400px">
                    <div class="opacity-40">
                        <q-icon name="forum" size="120px" color="grey-4" />
                        <div class="text-h5 q-mt-md">Quick Templates</div>
                        <div class="row q-gutter-sm q-mt-md justify-center">
                            <q-btn outline dense color="primary" label="Class Cancelled" no-caps @click="msgForm.content = 'Sorry, today\'s class has been cancelled. We will reschedule soon.'" />
                            <q-btn outline dense color="primary" label="Exam Result" no-caps @click="msgForm.content = 'Hello, the results for the recent exam are now available at the office.'" />
                            <q-btn outline dense color="primary" label="Holiday Notice" no-caps @click="msgForm.content = 'Dear Students, please note that the institute will be closed for the upcoming holidays.'" />
                        </div>
                    </div>
                </q-card>
            </div>
        </div>
      </q-tab-panel>

      <!-- REMINDERS TAB -->
      <q-tab-panel name="reminders" class="q-pa-none">
        <div class="row q-col-gutter-lg">
            <div class="col-12 col-md-4">
                <q-card flat class="glass-modern q-pa-lg">
                    <div class="text-h6 text-weight-bold q-mb-md">Pending Fees Finder</div>
                    <div class="q-gutter-md">
                        <q-select 
                            filled 
                            v-model="reminderForm.class_id" 
                            :options="classOptions" 
                            label="Select Class" 
                            emit-value 
                            map-options 
                        />
                        <q-select 
                            filled 
                            v-model="reminderForm.month" 
                            :options="monthOptions" 
                            label="Check for Month" 
                        />
                        <q-btn 
                            color="primary" 
                            label="Find Unpaid Students" 
                            unelevated 
                            class="full-width" 
                            icon="search"
                            :loading="loadingReminders"
                            @click="fetchUnpaidStudents"
                        />
                    </div>
                </q-card>
            </div>
            
            <div class="col-12 col-md-8">
                <q-card flat class="glass-modern overflow-hidden">
                    <q-table
                        flat
                        :rows="unpaidStudents"
                        :columns="unpaidColumns"
                        row-key="id"
                        :loading="loadingReminders"
                    >
                        <template v-slot:body-cell-actions="props">
                            <q-td :props="props" auto-width>
                                <q-btn 
                                    flat 
                                    round 
                                    color="green-7" 
                                    icon="fa-brands fa-whatsapp" 
                                    @click="sendFeeReminder(props.row)"
                                >
                                    <q-tooltip>Send Reminder</q-tooltip>
                                </q-btn>
                            </q-td>
                        </template>
                        <template v-slot:no-data>
                            <div class="full-width text-center q-pa-xl text-grey-5">
                                Select a class and month to find students who haven't paid.
                            </div>
                        </template>
                    </q-table>
                </q-card>
            </div>
        </div>
      </q-tab-panel>

      <!-- LOGS TAB -->
      <q-tab-panel name="logs" class="q-pa-none">
        <q-card flat class="glass-modern overflow-hidden">
            <q-table
                flat
                :rows="messageLog"
                :columns="logColumns"
                row-key="id"
                :loading="loadingLogs"
                :pagination="{ rowsPerPage: 10 }"
            >
                <template v-slot:body-cell-recipient="props">
                    <q-td :props="props">
                        <div class="row items-center">
                            <q-icon 
                                :name="props.row.recipient_type === 'Student' ? 'person' : 'groups'" 
                                size="xs" 
                                color="grey-6" 
                                class="q-mr-xs" 
                            />
                            <div class="text-weight-medium">{{ props.row.recipient_name }}</div>
                        </div>
                    </q-td>
                </template>
                <template v-slot:body-cell-content="props">
                    <q-td :props="props" class="max-width-text">
                        <div class="ellipsis">{{ props.value }}</div>
                        <q-tooltip class="bg-primary">{{ props.value }}</q-tooltip>
                    </q-td>
                </template>
                <template v-slot:body-cell-actions="props">
                    <q-td :props="props" auto-width>
                        <q-btn flat round dense color="red-7" icon="delete_outline" @click="deleteLog(props.row)" />
                    </q-td>
                </template>
            </q-table>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { client } from 'src/api'

const $q = useQuasar()
const activeTab = ref('compose')
const loading = ref(false)
const loadingLogs = ref(false)
const loadingReminders = ref(false)

// Data refs
const rawStudents = ref([])
const studentOptions = ref([])
const classOptions = ref([])
const messageLog = ref([])
const unpaidStudents = ref([])

const selectedRecipient = ref(null)

const msgForm = ref({
    recipient_type: 'Student',
    content: ''
})

const reminderForm = ref({
    class_id: null,
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
})

const monthOptions = computed(() => {
    const months = []
    const date = new Date()
    for (let i = -2; i < 3; i++) {
        const d = new Date(date.getFullYear(), date.getMonth() + i, 1)
        months.push(d.toLocaleString('default', { month: 'long', year: 'numeric' }))
    }
    return months
})

const logColumns = [
    { name: 'date', align: 'left', label: 'Date/Time', field: row => new Date(row.sent_at).toLocaleString() },
    { name: 'recipient', align: 'left', label: 'Recipient', field: 'recipient_name' },
    { name: 'content', align: 'left', label: 'Message', field: 'content' },
    { name: 'actions', align: 'center', label: 'Actions', field: 'actions' }
]

const unpaidColumns = [
    { name: 'name', align: 'left', label: 'Student Name', field: 'name', sortable: true },
    { name: 'contact', align: 'left', label: 'WhatsApp Number', field: 'contact' },
    { name: 'actions', align: 'center', label: 'Action', field: 'id' }
]

onMounted(() => {
    loadBaseData()
    fetchMessageLog()
})

watch(() => msgForm.value.recipient_type, () => {
    selectedRecipient.value = null
})

const loadBaseData = async () => {
    try {
        const [stds, cls] = await Promise.all([
            client.get('students'),
            client.get('classes')
        ])
        
        if (stds) rawStudents.value = stds.filter(s => s.status === 'Active')
        if (cls) {
            classOptions.value = cls.filter(c => c.status === 'Active').map(c => ({
                label: `${c.class_name} (${c.grade})`,
                value: c.id,
                grade: c.grade,
                subject: c.subject
            }))
        }
    } catch (e) {
        console.error('Load Error:', e)
    }
}

const filterStudents = (val, update) => {
    update(() => {
        const needle = val.toLowerCase()
        studentOptions.value = rawStudents.value
            .filter(v => v.name.toLowerCase().indexOf(needle) > -1)
            .map(s => ({
                label: `${s.name} (${s.contact || 'No No.'})`,
                value: s.id,
                contact: s.contact
            }))
    })
}

const fetchMessageLog = async () => {
    loadingLogs.value = true
    try {
        const data = await client.get('messages?limit=20')
        if (data) messageLog.value = data
    } catch {
        // Ignore
    } finally {
        loadingLogs.value = false
    }
}

const fetchUnpaidStudents = async () => {
    if (!reminderForm.value.class_id || !reminderForm.value.month) {
        $q.notify({ type: 'warning', message: 'Select class and month' })
        return
    }
    loadingReminders.value = true
    try {
        const data = await client.get(`reminders/unpaid?class_id=${reminderForm.value.class_id}&month=${reminderForm.value.month}`)
        unpaidStudents.value = data || []
        if (unpaidStudents.value.length === 0) {
            $q.notify({ type: 'positive', message: 'Everyone has paid for this month!' })
        }
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to fetch reminders' })
    } finally {
        loadingReminders.value = false
    }
}

const deleteLog = (log) => {
    $q.dialog({
        title: 'Delete History',
        message: 'Remove this message from log?',
        cancel: true,
        ok: { color: 'red-7', flat: true, label: 'Delete' }
    }).onOk(async () => {
        try {
            await client.delete(`messages/${log.id}`)
            fetchMessageLog()
        } catch {
            $q.notify({ type: 'negative', message: 'Failed to delete' })
        }
    })
}

const sendWA = (phone, text) => {
    if (!phone) return
    let num = phone
    if (num.startsWith('0')) num = '94' + num.substring(1)
    num = num.replace(/\D/g, '')
    const url = `https://wa.me/${num}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
}

const sendFeeReminder = (student) => {
    const cls = classOptions.value.find(c => c.value === reminderForm.value.class_id)
    const msg = `Halo ${student.name}, reminder එකක් විදිහට මේ පණිවිඩය එවන්නේ. ${cls.label} පන්තිය සඳහා ${reminderForm.value.month} මාසයේ ගාස්තුව තවම ලැබී නැත. කරුණාකර හැකි ඉක්මනින් ගෙවීම් කටයුතු සිදු කරන්න. ස්තූතියි!`
    sendWA(student.contact, msg)
}

const sendMessage = async () => {
    if (!selectedRecipient.value) return
    loading.value = true
    
    try {
        if (msgForm.value.recipient_type === 'Student') {
            sendWA(selectedRecipient.value.contact, msgForm.value.content)
            await client.post('messages', {
                recipient_type: 'Student',
                recipient_id: selectedRecipient.value.value,
                recipient_name: selectedRecipient.value.label,
                content: msgForm.value.content,
                status: 'Sent'
            })
        } else {
            const classData = classOptions.value.find(c => c.value === selectedRecipient.value.value)
            const studentsInClass = rawStudents.value.filter(s => 
                s.grade === classData.grade && 
                s.subjects && s.subjects.includes(classData.subject) &&
                s.contact
            )
            
            if (studentsInClass.length === 0) {
                $q.notify({ type: 'warning', message: 'No students found in this class with contact numbers' })
                loading.value = false
                return
            }

            $q.notify({ type: 'info', message: `Opening ${studentsInClass.length} WhatsApp tabs...` })
            
            studentsInClass.forEach((s, i) => {
                setTimeout(() => sendWA(s.contact, msgForm.value.content), i * 1500)
            })

            await client.post('messages', {
                recipient_type: 'Class',
                recipient_id: classData.value,
                recipient_name: classData.label,
                content: msgForm.value.content,
                status: 'Sent'
            })
        }

        $q.notify({ type: 'positive', message: 'Message sequence started' })
        msgForm.value.content = ''
        selectedRecipient.value = null
        fetchMessageLog()
    } catch (e) {
        console.error(e)
        $q.notify({ type: 'negative', message: 'Error sending message' })
    } finally {
        loading.value = false
    }
}
</script>

<style scoped lang="scss">
.glass-modern {
    background: white;
    border-radius: 24px;
    border: 1px solid rgba(0,0,0,0.05);
    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.04);
}
.premium-btn { border-radius: 12px; font-weight: 700; }
.h-50 { height: 50px; }
.max-width-text { max-width: 250px; }
</style>
