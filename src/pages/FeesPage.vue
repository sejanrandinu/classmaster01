<template>
  <q-page class="q-pa-lg bg-grey-1">
    <!-- Page Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h3 text-weight-bolder text-grey-9 q-mb-xs mt-0">Collect Fees</h1>
        <div class="text-subtitle1 text-grey-6">Manage student payments and generate digital receipts.</div>
      </div>
    </div>

    <div class="row q-col-gutter-xl">
      <!-- Left side: Collection Form -->
      <div class="col-12 col-md-5">
        <q-card flat class="glass-modern q-pa-xl overflow-hidden">
            <div class="absolute-top-right q-pa-md rotate-12 opacity-10">
                <q-icon name="payments" size="120px" color="primary" />
            </div>

            <h2 class="text-h5 text-weight-bold q-mb-lg row items-center">
                <q-icon name="add_card" color="primary" class="q-mr-sm" />
                New Payment Record
            </h2>

            <q-form @submit="processPayment" class="q-gutter-lg">
                <!-- Student Selection -->
                <q-select
                    filled
                    v-model="selectedStudent"
                    use-input
                    input-debounce="300"
                    label="Search Student"
                    :options="studentOptions"
                    @filter="filterStudents"
                    @update:model-value="onStudentSelect"
                    lazy-rules
                    :rules="[val => !!val || 'Please select a student']"
                >
                    <template v-slot:prepend><q-icon name="person_search" color="primary" /></template>
                    <template v-slot:no-option>
                        <q-item><q-item-section class="text-grey">No students found</q-item-section></q-item>
                    </template>
                </q-select>

                <!-- Class Selection -->
                <q-select
                    filled
                    v-model="paymentForm.class_id"
                    :options="filteredClassOptions"
                    label="Select Class"
                    emit-value
                    map-options
                    @update:model-value="onClassSelect"
                    :hint="!selectedStudent ? 'Find a student first' : ''"
                    :rules="[val => !!val || 'Required']"
                >
                    <template v-slot:prepend><q-icon name="business" color="primary" /></template>
                </q-select>

                <div class="row q-col-gutter-md">
                    <!-- Month Selection -->
                    <div class="col-12 col-sm-6">
                        <q-select
                            filled
                            v-model="paymentForm.month"
                            :options="monthOptions"
                            label="For Month"
                            :rules="[val => !!val || 'Required']"
                        />
                    </div>
                    <!-- Amount -->
                    <div class="col-12 col-sm-6">
                        <q-input
                            filled
                            v-model.number="paymentForm.amount"
                            label="Amount (LKR)"
                            type="number"
                            prefix="Rs."
                            class="text-weight-bolder"
                            :rules="[val => val > 0 || 'Invalid amount']"
                        />
                    </div>
                </div>

                <!-- Payment Method -->
                <div class="bg-grey-1 q-pa-md rounded-borders">
                    <div class="text-caption text-grey-7 q-mb-sm">Payment Method</div>
                    <q-btn-toggle
                        v-model="paymentForm.payment_method"
                        spread
                        no-caps
                        unelevated
                        toggle-color="primary"
                        color="white"
                        text-color="grey-7"
                        :options="[
                            {label: 'Cash', value: 'Cash'},
                            {label: 'Bank Transfer or Deposit', value: 'Bank Transfer or Deposit'}
                        ]"
                    />
                </div>

                <!-- Tutor Bank Details Display -->
                <transition
                    appear
                    enter-active-class="animated fadeIn"
                    leave-active-class="animated fadeOut"
                >
                    <div v-if="paymentForm.payment_method === 'Bank Transfer or Deposit' && selectedTutor" class="q-mt-lg">
                        <q-card flat bordered class="bg-blue-50 border-blue">
                            <q-card-section class="q-pa-md">
                                <div class="text-subtitle2 text-primary q-mb-sm row items-center">
                                    <q-icon name="account_balance" class="q-mr-xs" />
                                    Tutor Bank Details
                                </div>
                                <div class="q-gutter-y-xs">
                                    <div class="row"><span class="col-5 text-grey-7">Bank:</span> <span class="col-7 text-weight-bold">{{ selectedTutor.bank_name || 'Not Provided' }}</span></div>
                                    <div class="row"><span class="col-5 text-grey-7">Acc Name:</span> <span class="col-7 text-weight-bold">{{ selectedTutor.bank_account_name || 'Not Provided' }}</span></div>
                                    <div class="row"><span class="col-5 text-grey-7">Acc No:</span> <span class="col-7 text-weight-bold text-primary">{{ selectedTutor.bank_account_number || 'Not Provided' }}</span></div>
                                    <div class="row"><span class="col-5 text-grey-7">Branch:</span> <span class="col-7 text-weight-bold">{{ selectedTutor.bank_branch || 'Not Provided' }}</span></div>
                                </div>
                            </q-card-section>
                        </q-card>
                    </div>
                </transition>

                <div class="row q-mt-xl">
                    <q-btn 
                        type="submit" 
                        color="primary" 
                        label="Collect Fee & Sync" 
                        icon="check_circle" 
                        unelevated 
                        class="full-width premium-btn h-50"
                        :loading="loading"
                    />
                </div>
            </q-form>
        </q-card>
      </div>

      <!-- Right side: Recent History -->
      <div class="col-12 col-md-7">
        <q-card flat class="glass-modern overflow-hidden">
            <q-card-section class="row items-center justify-between q-pa-lg">
                <div class="text-h6 text-weight-bold">Recent Collections</div>
                <q-btn flat round icon="refresh" color="grey-6" @click="fetchRecentPayments" />
            </q-card-section>
            
            <q-separator />

            <q-table
                flat
                :rows="recentPayments"
                :columns="historyColumns"
                row-key="id"
                :loading="loading"
                :pagination="{ rowsPerPage: 10 }"
                class="payment-history-table"
            >
                <template v-slot:body-cell-student="props">
                    <q-td :props="props">
                        <div class="text-weight-medium">{{ props.row.student_name }}</div>
                        <div class="text-caption text-grey-6">{{ props.row.student_id_str }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-amount="props">
                    <q-td :props="props">
                        <div class="text-weight-bolder text-grey-9">LKR {{ props.value.toLocaleString() }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-month="props">
                    <q-td :props="props">
                        <q-badge color="blue-1" text-color="primary" class="q-pa-xs px-sm text-weight-bold">
                            {{ props.value }}
                        </q-badge>
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
                            @click="deletePayment(props.row)"
                        >
                            <q-tooltip>Delete Record</q-tooltip>
                        </q-btn>
                    </q-td>
                </template>

                <template v-slot:no-data>
                    <div class="full-width row flex-center text-grey-5 q-pa-xl">
                        <q-icon name="receipt_long" size="48px" class="q-mb-md" />
                        <div class="text-h6 full-width text-center">No transactions yet today</div>
                    </div>
                </template>
            </q-table>
        </q-card>
      </div>
    </div>
    
    <!-- Financial Reports Section -->
    <div class="row q-mt-xl">
        <div class="col-12">
            <q-card flat class="glass-modern q-pa-lg">
                <div class="row items-center justify-between q-mb-md">
                    <div class="text-h6 text-weight-bold row items-center">
                        <q-icon name="summarize" color="primary" class="q-mr-sm" />
                        Financial Reports & Exports
                    </div>
                </div>
                <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-4">
                        <q-btn 
                            outline 
                            color="primary" 
                            icon="download" 
                            label="Download Payment History" 
                            class="full-width premium-btn" 
                            @click="exportPayments"
                            :loading="exporting"
                        />
                    </div>
                    <div class="col-12 col-sm-4">
                        <q-btn 
                            outline 
                            color="green-7" 
                            icon="file_download" 
                            label="Monthly Collection Report" 
                            class="full-width premium-btn"
                            @click="exportMonthlyReport"
                            :loading="exporting"
                        />
                    </div>
                    <div class="col-12 col-sm-4">
                        <q-btn 
                            outline 
                            color="orange-8" 
                            icon="assessment" 
                            label="Tutor Salary Summary" 
                            class="full-width premium-btn"
                            @click="exportSalarySummary"
                            :loading="exporting"
                        />
                    </div>
                </div>
                <div class="q-mt-md text-caption text-grey-6">
                    <q-icon name="info" class="q-mr-xs" /> Reports will be downloaded in CSV format which can be opened in Excel or Google Sheets.
                </div>
            </q-card>
        </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { client } from 'src/api'
import { exportToCSV } from 'src/utils/export'
import { useAppStore } from 'src/store/app'

const $q = useQuasar()
const appStore = useAppStore()
const route = useRoute()
const loading = ref(false)
const exporting = ref(false)

// Data refs
const studentsList = ref([]) // Raw list for filtering
const studentOptions = ref([]) // Displayed in select
const allClasses = ref([])
const recentPayments = ref([])
const selectedTutor = ref(null)

const selectedStudent = ref(null)

const paymentForm = ref({
    student_id: null,
    class_id: null,
    amount: 0,
    month: '',
    payment_method: 'Cash'
})

// Auto-generate month options
const monthOptions = computed(() => {
    const months = []
    const date = new Date()
    for (let i = -3; i < 7; i++) {
        const d = new Date(date.getFullYear(), date.getMonth() + i, 1)
        months.push(d.toLocaleString('default', { month: 'long', year: 'numeric' }))
    }
    return months
})

// Filter classes based on student grade
const filteredClassOptions = computed(() => {
    if (!selectedStudent.value) return []
    const grade = selectedStudent.value.grade
    return allClasses.value
        .filter(c => c.grade === grade)
        .map(c => ({
            label: `${c.class_name} (${c.subject})`,
            value: c.id,
            fee: c.fee
        }))
})

const historyColumns = [
    { name: 'date', align: 'left', label: 'Date', field: row => new Date(row.payment_date).toLocaleDateString() },
    { name: 'student', align: 'left', label: 'Student', field: 'student_name' },
    { name: 'class', align: 'left', label: 'Class', field: 'class_name' },
    { name: 'month', align: 'center', label: 'For Month', field: 'month' },
    { name: 'amount', align: 'right', label: 'Amount', field: 'amount', sortable: true },
    { name: 'actions', align: 'center', label: 'Actions', field: 'actions' }
]

const sendWhatsAppReceipt = (student, amount, month, receiptNo) => {
    if (!appStore.whatsappEnabled) return
    
    // Find the full student record for contact number and student_id
    const fullStudent = studentsList.value.find(s => s.id === student.value)
    if (!fullStudent || !fullStudent.contact) return

    let phone = fullStudent.contact
    if (phone.startsWith('0')) phone = '94' + phone.substring(1)
    phone = phone.replace(/\D/g, '')

    const portalLink = `${window.location.origin}/student-portal?id=${fullStudent.student_id}`
    const message = `ආයුබෝවන් ${fullStudent.name}, ${month} මාසය සඳහා රු. ${amount.toLocaleString()} පන්ති ගාස්තු ගෙවීම සාර්ථකව සටහන් කර ගත්තා.

ලැබීම් අංකය: ${receiptNo}
ඔබේ සියලුම ගෙවීම් වාර්තා මෙතැනින් බලන්න: ${portalLink}

ස්තූතියි!`
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

onMounted(async () => {
    await loadBaseData()
    fetchRecentPayments()
    paymentForm.value.month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

    // Check if coming from QR Scanner
    if (route.query.student_id) {
        const sid = route.query.student_id
        const student = studentsList.value.find(s => s.student_id === sid || s.id == sid)
        if (student) {
            selectedStudent.value = {
                label: `${student.name} (${student.student_id})`,
                value: student.id,
                grade: student.grade
            }
            onStudentSelect(selectedStudent.value)
        }
    }
})

const loadBaseData = async () => {
    try {
        const [stdRes, clsRes] = await Promise.all([
            client.get('students'),
            client.get('classes')
        ])

        if (stdRes) studentsList.value = stdRes.filter(s => s.status === 'Active')
        if (clsRes) allClasses.value = clsRes.filter(c => c.status === 'Active')
        
    } catch (error) {
        console.error('Error loading base data:', error)
        $q.notify({ type: 'negative', message: 'Failed to load base data' })
    }
}

const filterStudents = (val, update) => {
    if (val === '') {
        update(() => {
            studentOptions.value = studentsList.value.map(s => ({
                label: `${s.name} (${s.student_id})`,
                value: s.id,
                grade: s.grade
            }))
        })
        return
    }

    update(() => {
        const needle = val.toLowerCase()
        studentOptions.value = studentsList.value
            .filter(v => v.name.toLowerCase().indexOf(needle) > -1 || v.student_id.toLowerCase().indexOf(needle) > -1)
            .map(s => ({
                label: `${s.name} (${s.student_id})`,
                value: s.id,
                grade: s.grade
            }))
    })
}

const onStudentSelect = (val) => {
    if (val) {
        paymentForm.value.student_id = val.value
        paymentForm.value.class_id = null
        paymentForm.value.amount = 0
    }
}

const onClassSelect = async (val) => {
    const cls = allClasses.value.find(c => c.id === val)
    if (cls) {
        paymentForm.value.amount = cls.fee
        if (cls.tutor) {
            try {
                const tutors = await client.get('tutors')
                selectedTutor.value = tutors.find(t => t.name === cls.tutor) || null
            } catch {
                selectedTutor.value = null
            }
        } else {
            selectedTutor.value = null
        }
    }
}

const fetchRecentPayments = async () => {
    loading.value = true
    try {
        const data = await client.get('payments?limit=20')
        recentPayments.value = (data || []).map(p => ({
            id: p.id,
            amount: p.amount,
            month: p.month,
            payment_date: p.payment_date,
            student_name: p.student_name || 'Unknown',
            student_id_str: p.student_id_str || 'N/A',
            class_name: p.class_name || 'General'
        }))
    } catch (error) {
        console.error('Error fetching payments:', error)
    } finally {
        loading.value = false
    }
}

const deletePayment = (payment) => {
    $q.dialog({
        title: 'Confirm Deletion',
        message: `Delete payment of Rs. ${payment.amount} for ${payment.student_name}?`,
        cancel: true,
        persistent: true,
        ok: { color: 'red-7', flat: true, label: 'Delete Forever' }
    }).onOk(async () => {
        loading.value = true
        try {
            await client.delete(`payments/${payment.id}`)
            $q.notify({ type: 'positive', message: 'Payment record deleted' })
            fetchRecentPayments()
        } catch (e) {
            console.error('Delete error:', e)
            $q.notify({ type: 'negative', message: 'Delete failed' })
        } finally {
            loading.value = false
        }
    })
}

const processPayment = async () => {
    loading.value = true
    const receiptNo = 'R-' + Date.now().toString().slice(-8)
    
    try {
        await client.post('payments', {
            student_id: paymentForm.value.student_id,
            class_id: paymentForm.value.class_id,
            amount: paymentForm.value.amount,
            month: paymentForm.value.month,
            payment_method: paymentForm.value.payment_method,
            receipt_no: receiptNo
        })

        $q.notify({ 
            type: 'positive', 
            message: 'Payment collected successfully!',
            caption: `Receipt: ${receiptNo}`,
            icon: 'verified'
        })

        sendWhatsAppReceipt(selectedStudent.value, paymentForm.value.amount, paymentForm.value.month, receiptNo);
        paymentForm.value.amount = 0
        paymentForm.value.class_id = null
        fetchRecentPayments()
    } catch (e) {
        console.error('Payment error:', e)
        const msg = e.response?.data?.details || e.message || 'Payment failed'
        $q.notify({ type: 'negative', message: msg })
    } finally {
        loading.value = false
    }
}

const exportPayments = async () => {
    exporting.value = true
    try {
        const data = await client.get('payments')
        if (!data || data.length === 0) {
            $q.notify({ type: 'warning', message: 'No payments found to export' })
            return
        }
        
        const exportCols = [
            { label: 'Date', field: row => new Date(row.payment_date).toLocaleString() },
            { label: 'Student Name', field: 'student_name' },
            { label: 'Student ID', field: 'student_id_str' },
            { label: 'Class', field: 'class_name' },
            { label: 'Month', field: 'month' },
            { label: 'Amount (LKR)', field: 'amount' },
            { label: 'Payment Method', field: 'payment_method' },
            { label: 'Receipt No', field: 'receipt_no' }
        ]
        
        exportToCSV(data, 'Payment_History', exportCols)
        $q.notify({ type: 'positive', message: 'Payment history exported successfully' })
    } catch (e) {
        console.error('Export error:', e)
        $q.notify({ type: 'negative', message: 'Export failed' })
    } finally {
        exporting.value = false
    }
}

const exportMonthlyReport = async () => {
    exporting.value = true
    try {
        await client.get('stats') // Keeping the call to ensure data is fresh/server is up, but removing unused assignment
        const payments = await client.get('payments')
        
        // Simple aggregation by month
        const monthlyData = {}
        payments.forEach(p => {
            if (!monthlyData[p.month]) {
                monthlyData[p.month] = { month: p.month, total: 0, count: 0 }
            }
            monthlyData[p.month].total += p.amount
            monthlyData[p.month].count += 1
        })
        
        const reportData = Object.values(monthlyData)
        const exportCols = [
            { label: 'Month', field: 'month' },
            { label: 'Total Collections', field: 'total' },
            { label: 'Transaction Count', field: 'count' }
        ]
        
        exportToCSV(reportData, 'Monthly_Collection_Summary', exportCols)
        $q.notify({ type: 'positive', message: 'Monthly report exported' })
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to generate report' })
    } finally {
        exporting.value = false
    }
}

const exportSalarySummary = async () => {
    exporting.value = true
    try {
        // Fetch tutors and classes to estimate salaries or fetch from salary table if exists
        // For now, let's export tutor bank details and subjects as a starting point for finance
        const tutors = await client.get('tutors')
        
        const exportCols = [
            { label: 'Tutor Name', field: 'name' },
            { label: 'Subject', field: 'subject' },
            { label: 'Phone', field: 'phone' },
            { label: 'Bank Name', field: 'bank_name' },
            { label: 'Account Name', field: 'bank_account_name' },
            { label: 'Account Number', field: 'bank_account_number' },
            { label: 'Branch', field: 'bank_branch' }
        ]
        
        exportToCSV(tutors, 'Tutor_Financial_Details', exportCols)
        $q.notify({ type: 'positive', message: 'Tutor data exported' })
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to export tutor data' })
    } finally {
        exporting.value = false
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
    transition: all 0.3s ease;
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(var(--q-primary), 0.3);
    }
}

.h-50 { height: 50px; }

.bg-blue-50 {
    background-color: #f0f7ff;
}

.border-blue {
    border: 1px solid rgba(25, 118, 210, 0.2) !important;
}

.opacity-10 { opacity: 0.05; }

.rotate-12 { transform: rotate(12deg); }

.payment-history-table {
    :deep(thead tr th) {
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 11px;
        color: #888;
    }
}
</style>
