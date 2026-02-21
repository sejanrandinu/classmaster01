<template>
  <q-page class="q-pa-lg bg-grey-1">
    <!-- Page Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h3 text-weight-bolder text-grey-9 q-mb-xs mt-0">Messaging Center</h1>
        <div class="text-subtitle1 text-grey-6">Send updates, reminders, and announcements to your students.</div>
      </div>
    </div>

    <div class="row q-col-gutter-xl">
      <!-- Left side: Compose Message -->
      <div class="col-12 col-md-5">
        <q-card flat class="glass-modern q-pa-xl overflow-hidden">
            <h2 class="text-h5 text-weight-bold q-mb-lg row items-center">
                <q-icon name="send" color="primary" class="q-mr-sm" />
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
                            {label: 'Individual Student', value: 'Student', icon: 'person'},
                            {label: 'Entire Class', value: 'Class', icon: 'groups'}
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
                    maxlength="160"
                    :rules="[val => !!val || 'Message cannot be empty']"
                >
                    <template v-slot:hint>
                        Click to generate WhatsApp direct link
                    </template>
                </q-input>

                <div class="row q-mt-xl">
                    <q-btn 
                        type="submit" 
                        color="green-7" 
                        label="Send via WhatsApp" 
                        icon="fa-brands fa-whatsapp" 
                        unelevated 
                        class="full-width premium-btn h-50"
                        :loading="loading"
                    />
                </div>
                
                <div class="text-caption text-grey-6 text-center q-mt-md">
                    <q-icon name="info" size="xs" /> Messages will open in WhatsApp. Ensure the recipient's number is correct.
                </div>
            </q-form>
        </q-card>
      </div>

      <!-- Right side: Message Log -->
      <div class="col-12 col-md-7">
        <q-card flat class="glass-modern overflow-hidden">
            <q-card-section class="q-pa-lg">
                <div class="text-h6 text-weight-bold">Communication Log</div>
            </q-card-section>
            
            <q-separator />

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

                <template v-slot:body-cell-status="props">
                    <q-td :props="props">
                        <q-chip dense color="green-1" text-color="green-8" icon="fa-brands fa-whatsapp" size="sm">
                            {{ props.row.method }}
                        </q-chip>
                    </q-td>
                </template>

                <template v-slot:body-cell-actions="props">
                    <q-td :props="props" auto-width>
                        <q-btn 
                            flat 
                            round 
                            dense 
                            color="red-7" 
                            icon="delete_outline" 
                            @click="deleteLog(props.row)"
                        >
                            <q-tooltip>Delete Log Entry</q-tooltip>
                        </q-btn>
                    </q-td>
                </template>

                <template v-slot:no-data>
                    <div class="full-width row flex-center text-grey-5 q-pa-xl">
                        <q-icon name="history" size="48px" class="q-mb-md" />
                        <div class="text-h6 full-width text-center">No messages sent yet</div>
                    </div>
                </template>
            </q-table>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { client } from 'src/api'

const $q = useQuasar()
const loading = ref(false)
const loadingLogs = ref(false)

// Select options
const rawStudents = ref([])
const studentOptions = ref([])
const classOptions = ref([])
const messageLog = ref([])

const selectedRecipient = ref(null)

const msgForm = ref({
    recipient_type: 'Student',
    method: 'WhatsApp',
    content: ''
})

const logColumns = [
    { name: 'date', align: 'left', label: 'Date/Time', field: row => new Date(row.sent_at).toLocaleString() },
    { name: 'recipient', align: 'left', label: 'Recipient', field: 'recipient_name' },
    { name: 'content', align: 'left', label: 'Message', field: 'content' },
    { name: 'status', align: 'center', label: 'Status', field: 'status' },
    { name: 'actions', align: 'center', label: 'Actions', field: 'actions' }
]

onMounted(() => {
    loadBaseData()
    fetchMessageLog()
})

// Reset recipient when type changes
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
                grade: c.grade
            }))
        }
    } catch {
        // Ignore
    }
}

const filterStudents = (val, update) => {
    update(() => {
        const needle = val.toLowerCase()
        studentOptions.value = rawStudents.value
            .filter(v => v.name.toLowerCase().indexOf(needle) > -1 || v.student_id.toLowerCase().indexOf(needle) > -1)
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
        if (data) messageLog.value = data.map(m => ({
            ...m,
            method: 'WhatsApp'
        }))
    } catch {
        // Ignore
    } finally {
        loadingLogs.value = false
    }
}

const deleteLog = (log) => {
    $q.dialog({
        title: 'Delete History',
        message: 'Remove this message from the communication log permanently?',
        cancel: true,
        persistent: true,
        ok: { color: 'red-7', flat: true, label: 'Remove Forever' }
    }).onOk(async () => {
        loadingLogs.value = true
        try {
            await client.delete(`messages/${log.id}`)
            $q.notify({ type: 'positive', message: 'History record deleted' })
            fetchMessageLog()
        } catch {
            $q.notify({ type: 'negative', message: 'Failed to delete log' })
        } finally {
            loadingLogs.value = false
        }
    })
}

const sendMessage = async () => {
    loading.value = true
    
    let targetNumbers = []
    let recipientName = selectedRecipient.value.label

    try {
        if (msgForm.value.recipient_type === 'Student') {
            targetNumbers = [selectedRecipient.value.contact]
        } else {
            const grade = selectedRecipient.value.grade
            const studentsInClass = rawStudents.value.filter(s => s.grade === grade && s.contact)
            targetNumbers = studentsInClass.map(s => s.contact)
            recipientName = `${selectedRecipient.value.label} (${targetNumbers.length} students)`
        }

        const payload = {
            recipient_type: msgForm.value.recipient_type,
            recipient_id: selectedRecipient.value.value,
            recipient_name: recipientName,
            content: msgForm.value.content,
            status: 'Sent',
            metadata: { method: 'WhatsApp' }
        }

        if (msgForm.value.recipient_type === 'Student') {
            let phone = targetNumbers[0]
            if (phone) {
                if (phone.startsWith('0')) phone = '94' + phone.substring(1)
                phone = phone.replace(/\D/g, '')
                const url = `https://wa.me/${phone}?text=${encodeURIComponent(msgForm.value.content)}`
                window.open(url, '_blank')
            }
        } else {
            $q.notify({ 
                type: 'warning', 
                message: 'Bulk WhatsApp sending is not supported via direct links. Please send to individuals.' 
            })
            loading.value = false
            return
        }

        await client.post('messages', payload)

        $q.notify({ 
            type: 'positive', 
            message: 'Message dispatched successfully',
            icon: 'auto_awesome',
            caption: targetNumbers.length === 1 
                ? `Sent to: ${targetNumbers[0]}` 
                : `Sent to ${targetNumbers.length} students in class`
        })
        
        msgForm.value.content = ''
        selectedRecipient.value = null
        fetchMessageLog()
    } catch {
        $q.notify({ type: 'negative', message: 'Message dispatch failed' })
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

.premium-btn {
    border-radius: 12px;
    font-weight: 700;
}

.h-50 { height: 50px; }

.max-width-text {
    max-width: 250px;
}
</style>
