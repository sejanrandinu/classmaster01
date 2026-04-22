<template>
  <q-page class="q-pa-lg bg-grey-1">
    <!-- Page Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h3 text-weight-bolder text-grey-9 q-mb-xs mt-0">Attendance History</h1>
        <div class="text-subtitle1 text-grey-6">View and export past attendance records.</div>
      </div>
      <q-btn 
        color="primary" 
        outline 
        icon="arrow_back" 
        label="Back to Mark Attendance" 
        to="/dashboard/attendance" 
        no-caps 
      />
    </div>

    <!-- Filters -->
    <q-card flat class="glass-modern q-pa-lg q-mb-lg">
      <div class="row q-col-gutter-md items-end">
        <div class="col-12 col-md-4">
          <q-select 
            filled 
            v-model="selectedClass" 
            :options="classOptions" 
            label="Filter by Class" 
            emit-value
            map-options
            clearable
            @update:model-value="fetchHistory"
          >
            <template v-slot:prepend><q-icon name="class" color="primary" /></template>
          </q-select>
        </div>
        <div class="col-12 col-md-3">
          <q-input filled v-model="startDate" label="From" type="date" stack-label @update:model-value="fetchHistory">
            <template v-slot:prepend><q-icon name="event" color="primary" /></template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
          <q-input filled v-model="endDate" label="To" type="date" stack-label @update:model-value="fetchHistory">
            <template v-slot:prepend><q-icon name="event" color="primary" /></template>
          </q-input>
        </div>
        <div class="col-12 col-md-2">
            <q-btn 
                color="secondary" 
                icon="download" 
                label="Export CSV" 
                unelevated 
                no-caps 
                class="full-width" 
                @click="exportCSV"
                :disabled="rows.length === 0"
            />
        </div>
      </div>
    </q-card>

    <!-- History Table -->
    <q-card flat class="glass-modern overflow-hidden">
      <q-table
        flat
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :filter="filter"
        :pagination="pagination"
      >
        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filter" placeholder="Search students...">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props" class="text-center">
            <q-chip 
              :color="props.row.status === 'Present' ? 'green-1' : 'red-1'" 
              :text-color="props.row.status === 'Present' ? 'green-9' : 'red-9'"
              size="sm"
              class="text-weight-bold"
            >
              {{ props.row.status }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-date="props">
            <q-td :props="props">
                <div class="text-weight-medium">{{ formatDate(props.row.date) }}</div>
            </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <q-btn 
              flat 
              round 
              dense 
              color="red-7" 
              icon="delete_outline" 
              @click="deleteRecord(props.row)"
            >
              <q-tooltip>Delete Record</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { client } from 'src/api'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const filter = ref('')
const rows = ref([])
const classOptions = ref([])
const selectedClass = ref(null)

// Date range: default to last 30 days
const today = new Date().toISOString().split('T')[0]
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const startDate = ref(thirtyDaysAgo)
const endDate = ref(today)

const pagination = ref({
    rowsPerPage: 20
})

const columns = [
  { name: 'date', align: 'left', label: 'Date', field: 'date', sortable: true },
  { name: 'student_name', align: 'left', label: 'Student Name', field: 'student_name', sortable: true },
  { name: 'student_id', align: 'left', label: 'Student ID', field: 'student_id_str', sortable: true },
  { name: 'class_name', align: 'left', label: 'Class', field: 'class_name', sortable: true },
  { name: 'status', align: 'center', label: 'Status', field: 'status', sortable: true },
  { name: 'actions', align: 'center', label: 'Actions', field: 'actions' }
]

onMounted(() => {
    loadClasses()
    fetchHistory()
})

const loadClasses = async () => {
    try {
        const data = await client.get('classes')
        if (data) {
            classOptions.value = data.map(c => ({
                label: `${c.class_name} (${c.grade})`,
                value: c.id
            }))
        }
    } catch {
        // Ignore
    }
}

const fetchHistory = async () => {
    loading.value = true
    try {
        let url = `attendance?start=${startDate.value}&end=${endDate.value}`
        if (selectedClass.value) url += `&class_id=${selectedClass.value}`
        
        const data = await client.get(url)
        rows.value = data || []
    } catch (e) {
        console.error('History error:', e)
        $q.notify({ type: 'negative', message: 'Failed to load history' })
    } finally {
        loading.value = false
    }
}

const deleteRecord = (record) => {
  $q.dialog({
    title: 'Confirm Deletion',
    message: `Delete attendance record for ${record.student_name} on ${formatDate(record.date)}?`,
    cancel: true,
    persistent: true,
    ok: { color: 'red-7', flat: true, label: 'Delete Forever' }
  }).onOk(async () => {
    loading.value = true
    try {
        await client.delete(`attendance/${record.id}`)
        $q.notify({ type: 'positive', message: 'Attendance record deleted' })
        fetchHistory()
    } catch {
        $q.notify({ type: 'negative', message: 'Delete failed' })
    } finally {
        loading.value = false
    }
  })
}

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}

const exportCSV = () => {
    const header = ['Date', 'Student ID', 'Student Name', 'Class', 'Status']
    const content = rows.value.map(r => [
        r.date,
        r.student_id_str,
        r.student_name,
        r.class_name,
        r.status
    ].join(','))
    
    const csv = [header.join(','), ...content].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Attendance_History_${startDate.value}_to_${endDate.value}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
}
</script>

<style scoped>
.glass-modern {
    background: white;
    border-radius: 20px;
    border: 1px solid rgba(0,0,0,0.05);
    box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05);
}
</style>
