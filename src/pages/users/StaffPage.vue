<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <h1 class="text-h4 text-weight-bold text-grey-9 q-mb-none">Staff Management</h1>
      <q-btn color="primary" icon="person_add" label="Add Staff" unelevated no-caps @click="openAddDialog" />
    </div>

    <!-- Empty State -->
    <div v-if="rows.length === 0" class="flex flex-center bg-white rounded-borders q-pa-xl border-grey">
        <div class="text-center">
            <q-icon name="group_off" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">No staff members found</div>
            <p class="text-grey-5">Get started by adding a new staff member.</p>
            <q-btn color="primary" label="Add Staff" unelevated no-caps class="q-mt-sm" @click="openAddDialog" />
        </div>
    </div>

    <!-- Filters Row -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6">
        <q-select 
          outlined 
          dense 
          v-model="selectedRole" 
          :options="['All Roles', ...roleOptions]" 
          label="Filter by Role"
          bg-color="white"
        />
      </div>
      <div class="col-12 col-sm-6">
        <q-select 
          outlined 
          dense 
          v-model="selectedStatus" 
          :options="['All Status', 'Paid', 'Pending']" 
          label="Filter by Payment Status (This Month)"
          bg-color="white"
        />
      </div>
    </div>

    <q-card v-else flat bordered class="rounded-borders">
      <q-table
        flat
        :rows="filteredRows"
        :columns="columns"
        row-key="id"
        :filter="filter"
      >
        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filter" placeholder="Search Staff Members...">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <template v-slot:body-cell-role="props">
            <q-td :props="props">
                <q-chip dense :color="getRoleColor(props.value)" text-color="white" size="sm">
                    {{ props.value }}
                </q-chip>
            </q-td>
        </template>

        <template v-slot:body-cell-salary="props">
             <q-td :props="props">
                Rs. {{ props.value }}
            </q-td>
        </template>

        <template v-slot:body-cell-status="props">
             <q-td :props="props">
                <q-chip dense :color="props.row.isPaidThisMonth ? 'green-1' : 'orange-1'" :text-color="props.row.isPaidThisMonth ? 'green-9' : 'orange-9'" size="sm">
                    <q-icon :name="props.row.isPaidThisMonth ? 'check_circle' : 'pending'" size="14px" class="q-mr-xs" />
                    {{ props.row.isPaidThisMonth ? 'Paid (This Month)' : 'Pending' }}
                </q-chip>
                <div v-if="props.row.lastPaymentDate" class="text-caption text-grey-6" style="font-size: 11px">
                    Last: {{ props.row.lastPaymentDate }}
                </div>
            </q-td>
        </template>
        
        <template v-slot:body-cell-actions="props">
            <q-td :props="props" auto-width>
                <q-btn flat round dense color="purple-7" icon="history" @click="openHistoryDialog(props.row)" class="q-mr-sm">
                    <q-tooltip>View History</q-tooltip>
                </q-btn>
                <q-btn flat round dense color="green-7" icon="payments" @click="openPayDialog(props.row)" class="q-mr-sm">
                    <q-tooltip>Pay Salary</q-tooltip>
                </q-btn>
                <q-btn flat round dense color="blue-7" icon="edit" @click="openEditDialog(props.row)" class="q-mr-sm">
                     <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn flat round dense color="red-7" icon="delete" @click="deleteStaff(props.row.id)">
                     <q-tooltip>Remove</q-tooltip>
                </q-btn>
            </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog">
        <q-card style="min-width: 400px">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ isEdit ? 'Edit Staff' : 'Add New Staff' }}</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pt-lg">
                <q-form @submit="saveStaff" class="q-gutter-md">
                    <q-input outlined v-model="form.name" label="Full Name" :rules="[val => !!val || 'Name is required']" />
                    
                    <q-select 
                        outlined 
                        v-model="form.role" 
                        :options="roleOptions" 
                        label="Role" 
                        :rules="[val => !!val || 'Role is required']"
                    />

                    <q-input outlined v-model="form.whatsapp_number" label="WhatsApp Number" mask="##########" hint="Format: 07xxxxxxxx" :rules="[val => (val && val.replace(/\D/g, '').length === 10) || 'අංක 10ක් ඇතුළත් කරන්න']" />
                    
                    <q-input 
                        outlined 
                        v-model="form.salary" 
                        label="Base Salary (Rs.)" 
                        type="number" 
                        prefix="Rs."
                        :rules="[val => !!val || 'Salary is required']" 
                    />
                    
                    <div class="row justify-end q-mt-lg">
                        <q-btn label="Cancel" color="grey-7" flat v-close-popup class="q-mr-sm" />
                        <q-btn :label="isEdit ? 'Update' : 'Save'" type="submit" color="primary" unelevated :loading="loading" />
                    </div>
                </q-form>
            </q-card-section>
        </q-card>
    </q-dialog>

    <!-- Pay Salary Dialog -->
    <q-dialog v-model="showPayDialog">
        <q-card style="min-width: 400px">
            <q-card-section class="bg-green-1 text-green-9">
                <div class="text-h6">Pay Salary</div>
                <div class="text-subtitle2">To: {{ payForm.staffName }}</div>
            </q-card-section>

            <q-card-section class="q-pt-lg">
                <q-form @submit="processPayment" class="q-gutter-md">
                    <q-input 
                        outlined 
                        v-model="payForm.amount" 
                        label="Amount" 
                        type="number" 
                        prefix="Rs."
                        :rules="[val => !!val || 'Amount is required']" 
                    />

                    <q-input outlined v-model="payForm.date" label="Payment Date" type="date" />

                    <q-input outlined v-model="payForm.notes" label="Notes (Optional)" type="textarea" rows="2" />

                     <div class="row justify-end q-mt-lg">
                        <q-btn label="Cancel" color="grey-7" flat v-close-popup class="q-mr-sm" />
                        <q-btn label="Pay Now" type="submit" color="green-7" unelevated :loading="loading" />
                    </div>
                </q-form>
            </q-card-section>
        </q-card>
    </q-dialog>

    <!-- Salary History Dialog -->
    <q-dialog v-model="showHistoryDialog">
        <q-card style="min-width: 600px; max-width: 800px;">
            <q-card-section class="row items-center bg-grey-1">
                <div class="text-h6">Payment History</div>
                <q-space />
                <div class="text-subtitle2 text-grey-7 q-mr-md">{{ selectedStaffName }}</div>
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pa-none">
                <q-table
                    flat
                    :rows="historyRows"
                    :columns="historyColumns"
                    row-key="id"
                    :loading="loadingHistory"
                    hide-bottom
                >
                    <template v-slot:body-cell-amount="props">
                        <q-td :props="props" class="text-weight-bold">
                            Rs. {{ props.value }}
                        </q-td>
                    </template>
                </q-table>
                <div v-if="!loadingHistory && historyRows.length === 0" class="text-center q-pa-lg text-grey-5">
                    No payment history found.
                </div>
            </q-card-section>
        </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { client } from 'src/api'

const $q = useQuasar()
const filter = ref('')
const showDialog = ref(false)
const showPayDialog = ref(false)
const showHistoryDialog = ref(false)
const isEdit = ref(false)
const loading = ref(false)
const loadingHistory = ref(false)

// Filter State
const selectedRole = ref('All Roles')
const selectedStatus = ref('All Status')

import { computed } from 'vue'

const filteredRows = computed(() => {
    return rows.value.filter(row => {
        const matchRole = selectedRole.value === 'All Roles' || row.role === selectedRole.value
        const matchStatus = selectedStatus.value === 'All Status' || 
            (selectedStatus.value === 'Paid' ? row.isPaidThisMonth : !row.isPaidThisMonth)
        return matchRole && matchStatus
    })
})

// Form Data
const form = ref({
  id: null,
  name: '',
  role: '',
  whatsapp_number: '',
  salary: ''
})

const payForm = ref({
    staffId: null,
    staffName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
})

const selectedStaffName = ref('')
const historyRows = ref([])

const columns = [
  { name: 'name', align: 'left', label: 'Name', field: 'name', sortable: true },
  { name: 'role', align: 'left', label: 'Role', field: 'role', sortable: true },
  { name: 'whatsapp_number', align: 'left', label: 'WhatsApp', field: 'whatsapp_number' },
  { name: 'salary', align: 'right', label: 'Salary (Rs.)', field: 'salary', sortable: true },
  { name: 'status', align: 'center', label: 'Payment Status', field: 'status' },
  { name: 'actions', align: 'right', label: 'Actions', field: 'actions' }
]

const historyColumns = [
    { name: 'payment_date', align: 'left', label: 'Date', field: 'payment_date', sortable: true },
    { name: 'amount', align: 'left', label: 'Amount', field: 'amount', sortable: true },
    { name: 'notes', align: 'left', label: 'Notes', field: 'notes' }
]

const rows = ref([])
const roleOptions = ref([])
const rolesMap = ref({})

onMounted(() => {
    fetchStaff()
    fetchRoles()
})

const fetchRoles = async () => {
    try {
        const data = await client.get('roles')
        if (data) {
            roleOptions.value = data.map(r => r.name)
            data.forEach(r => {
                rolesMap.value[r.name] = r.color
            })
        }
    } catch {
        // Fallback or ignore
    }
    
    if (roleOptions.value.length === 0) {
        const defaultRoles = ['Manager', 'Clerk', 'Cleaner', 'Security', 'Other']
        roleOptions.value = defaultRoles
    }
}

const getRoleColor = (role) => {
    return rolesMap.value[role] || 'grey'
}

const fetchStaff = async () => {
    loading.value = true
    try {
        // Updated API call to fetch with payments if needed, or process from results
        const data = await client.get('staff')
        if (data) {
            const currentMonth = new Date().getMonth()
            const currentYear = new Date().getFullYear()

            rows.value = data.map(staff => {
                const payments = staff.salary_payments || []
                payments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
                
                const lastPayment = payments[0]
                let isPaidThisMonth = false
                
                if (lastPayment) {
                    const payDate = new Date(lastPayment.payment_date)
                    if (payDate.getMonth() === currentMonth && payDate.getFullYear() === currentYear) {
                        isPaidThisMonth = true
                    }
                }

                return {
                    ...staff,
                    isPaidThisMonth,
                    lastPaymentDate: lastPayment ? lastPayment.payment_date : null
                }
            })
        }
    } catch (e) {
        console.error('Error fetching staff:', e)
    } finally {
        loading.value = false
    }
}

const openAddDialog = () => {
    isEdit.value = false
    form.value = { id: null, name: '', role: '', whatsapp_number: '', salary: '' }
    showDialog.value = true
}

const openEditDialog = (row) => {
    isEdit.value = true
    form.value = { ...row }
    showDialog.value = true
}

const saveStaff = async () => {
    loading.value = true
    const staffData = {
        name: form.value.name,
        role: form.value.role,
        whatsapp_number: form.value.whatsapp_number,
        salary: form.value.salary
    }

    try {
        if (isEdit.value && form.value.id) {
            await client.put(`staff/${form.value.id}`, staffData)
        } else {
            await client.post('staff', staffData)
        }
        $q.notify({ type: 'positive', message: 'Staff saved successfully' })
        showDialog.value = false
        fetchStaff()
    } catch {
        $q.notify({ type: 'negative', message: 'Error saving staff' })
    } finally {
        loading.value = false
    }
}

const deleteStaff = (id) => {
    $q.dialog({
        title: 'Confirm',
        message: 'Delete this staff member?',
        cancel: true,
        persistent: true
    }).onOk(async () => {
        try {
            await client.delete(`staff/${id}`)
            $q.notify({ type: 'positive', message: 'Staff deleted' })
            fetchStaff()
        } catch {
             $q.notify({ type: 'negative', message: 'Error deleting staff' })
        }
    })
}

const openPayDialog = (row) => {
    payForm.value = {
        staffId: row.id,
        staffName: row.name,
        amount: row.salary, 
        date: new Date().toISOString().split('T')[0],
        notes: ''
    }
    showPayDialog.value = true
}

const processPayment = async () => {
    loading.value = true
    try {
        await client.post('salary_payments', {
            staff_id: payForm.value.staffId,
            amount: payForm.value.amount,
            payment_date: payForm.value.date,
            notes: payForm.value.notes
        })
        $q.notify({ type: 'positive', message: 'Payment recorded successfully' })
        showPayDialog.value = false
        fetchStaff()
    } catch {
        $q.notify({ type: 'negative', message: 'Payment failed' })
    } finally {
        loading.value = false
    }
}

const openHistoryDialog = async (row) => {
    selectedStaffName.value = row.name
    historyRows.value = []
    showHistoryDialog.value = true
    loadingHistory.value = true

    try {
        const data = await client.get(`staff/${row.id}/payments`)
        if (data) historyRows.value = data
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to load history' })
    } finally {
        loadingHistory.value = false
    }
}
</script>
