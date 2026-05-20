<template>
  <q-page class="q-pa-lg bg-indigo-50">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <q-breadcrumbs class="text-grey-6 text-subtitle2 q-mb-xs">
          <q-breadcrumbs-el label="ClassMaster" />
          <q-breadcrumbs-el :label="appStore.language === 'English' ? 'Students' : 'සිසුන්'" />
          <q-breadcrumbs-el :label="t.inactiveStudents" />
        </q-breadcrumbs>
        <h1 class="text-h3 text-weight-bold text-indigo-10 q-my-none flex items-center">
          <q-icon name="person_off" class="q-mr-md text-red-5" />
          {{ t.inactiveStudents }}
        </h1>
        <p class="text-grey-7 q-mt-sm text-subtitle1">
          {{ appStore.language === 'English' ? 'Manage and reactivate or delete inactive student profiles.' : 'අක්‍රිය කරන ලද ශිෂ්‍ය ගිණුම් කළමනාකරණය, සක්‍රිය කිරීම හෝ ඉවත් කිරීම මෙතැනින් සිදු කරන්න.' }}
        </p>
      </div>
    </div>

    <!-- Stats summary -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-card class="glass-card q-pa-md shadow-3 relative-position overflow-hidden border-left-inactive">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-grey-6 uppercase">{{ appStore.language === 'English' ? 'Total Inactive' : 'මුළු අක්‍රිය ශිෂ්‍ය සංඛ්‍යාව' }}</div>
              <div class="text-h3 text-weight-bold text-indigo-9 q-mt-sm">{{ rows.length }}</div>
            </div>
            <q-avatar size="56px" class="bg-indigo-1" text-color="indigo-9" icon="person_off" />
          </div>
          <div class="card-accents absolute-bottom-right">
            <div class="accent-blob-1"></div>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card class="glass-card q-pa-md shadow-3 relative-position overflow-hidden border-left-selected">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-grey-6 uppercase">{{ appStore.language === 'English' ? 'Selected For Action' : 'ක්‍රියාකාරකම සඳහා තෝරාගත්' }}</div>
              <div class="text-h3 text-weight-bold text-amber-9 q-mt-sm">{{ selected.length }}</div>
            </div>
            <q-avatar size="56px" class="bg-amber-1" text-color="amber-9" icon="rule" />
          </div>
          <div class="card-accents absolute-bottom-right">
            <div class="accent-blob-2"></div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Main Table Card -->
    <q-card class="glass-card shadow-5 rounded-borders overflow-hidden">
      <!-- Table Filter Header -->
      <q-card-section class="q-py-md bg-white border-bottom row items-center justify-between q-gutter-md">
        <div class="row items-center q-gutter-sm">
          <q-input 
            outlined 
            dense 
            v-model="filter" 
            :placeholder="appStore.language === 'English' ? 'Filter by name, ID or school...' : 'නම, හැඳුනුම්පත හෝ පාසලෙන් පෙරන්න...'"
            style="width: 320px;"
            class="search-input"
          >
            <template v-slot:prepend>
              <q-icon name="search" color="grey-5" />
            </template>
            <template v-slot:append v-if="filter">
              <q-icon name="close" @click="filter = ''" class="cursor-pointer" />
            </template>
          </q-input>
          
          <q-select
            outlined
            dense
            v-model="gradeFilter"
            :options="gradeOptions"
            :label="appStore.language === 'English' ? 'Grade' : 'ශ්‍රේණිය'"
            style="width: 150px;"
            emit-value
            map-options
          />
        </div>

        <div class="row items-center q-gutter-sm">
          <q-btn 
            outline 
            color="grey-7" 
            icon="refresh" 
            :label="appStore.language === 'English' ? 'Refresh' : 'නැවුම් කරන්න'" 
            @click="fetchInactiveStudents" 
            :loading="loading"
            class="rounded-button"
          />
        </div>
      </q-card-section>

      <!-- Glassmorphic Quasar Table -->
      <q-card-section class="q-pa-none">
        <q-table
          :rows="filteredRows"
          :columns="columns"
          row-key="id"
          selection="multiple"
          v-model:selected="selected"
          :loading="loading"
          :filter="filter"
          class="bg-transparent text-indigo-10 custom-glass-table"
          flat
          bordered
          no-data-label="No inactive students found"
        >
          <template v-slot:body-cell-student_id="props">
            <q-td :props="props">
              <span class="text-weight-bold font-mono text-indigo-9">{{ props.row.student_id }}</span>
            </q-td>
          </template>

          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-sm">
                <q-avatar size="32px" class="bg-indigo-1 text-indigo-10">
                  <img v-if="props.row.image_url" :src="props.row.image_url">
                  <span v-else class="text-weight-bold">{{ props.row.name.charAt(0).toUpperCase() }}</span>
                </q-avatar>
                <div>
                  <div class="text-weight-bold">{{ props.row.name }}</div>
                  <div class="text-caption text-grey-6">{{ props.row.school }}</div>
                </div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-contact="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-xs">
                <span>{{ props.row.contact }}</span>
                <q-btn 
                  v-if="props.row.contact" 
                  flat 
                  round 
                  dense 
                  color="green" 
                  icon="chat" 
                  size="sm"
                  @click="openWhatsApp(props.row.contact)"
                >
                  <q-tooltip>Message on WhatsApp</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge outline color="red" class="q-py-xs q-px-sm uppercase text-weight-bold">
                {{ appStore.language === 'English' ? 'Inactive' : 'අක්‍රිය' }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="row justify-end q-gutter-xs">
                <q-btn 
                  flat 
                  round 
                  dense 
                  color="primary" 
                  icon="autorenew" 
                  @click="confirmReactivateSingle(props.row)"
                >
                  <q-tooltip>{{ appStore.language === 'English' ? 'Reactivate Student' : 'සිසුවා සක්‍රිය කරන්න' }}</q-tooltip>
                </q-btn>
                <q-btn 
                  flat 
                  round 
                  dense 
                  color="red" 
                  icon="delete_outline" 
                  @click="confirmDeleteSingle(props.row)"
                >
                  <q-tooltip>{{ appStore.language === 'English' ? 'Delete Permanently' : 'ස්ථිරවම ඉවත් කරන්න' }}</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- Bulk Action Bar -->
      <transition enter-active-class="animated slideInUp" leave-active-class="animated slideOutDown">
        <q-card-section v-if="selected.length > 0" class="bg-indigo-900 text-white q-py-md q-px-lg row items-center justify-between border-top">
          <div class="row items-center q-gutter-md">
            <span class="text-subtitle1 text-weight-medium">
              {{ selected.length }} {{ appStore.language === 'English' ? 'student(s) selected' : 'සිසුවා(න්) තෝරාගෙන ඇත' }}
            </span>
          </div>
          <div class="row items-center q-gutter-sm">
            <q-btn 
              unelevated 
              color="teal" 
              icon="autorenew" 
              :label="appStore.language === 'English' ? 'Reactivate Selected' : 'තෝරාගත් සිසුන් සක්‍රිය කරන්න'" 
              @click="confirmReactivateBulk" 
              class="q-px-md"
            />
            <q-btn 
              unelevated 
              color="red-7" 
              icon="delete" 
              :label="appStore.language === 'English' ? 'Delete Permanently' : 'ස්ථිරවම ඉවත් කරන්න'" 
              @click="confirmDeleteBulk" 
              class="q-px-md"
            />
          </div>
        </q-card-section>
      </transition>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { client, studentsBulk } from 'src/api'
import { useAppStore } from 'src/store/app'
import layoutTranslations from 'src/i18n/layout'

const appStore = useAppStore()
const t = computed(() => layoutTranslations[appStore.language])
const $q = useQuasar()

const loading = ref(false)
const filter = ref('')
const selected = ref([])
const rows = ref([])

const gradeFilter = ref('All Grades')
const gradeOptions = ['All Grades', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13']

const columns = [
  { name: 'student_id', align: 'left', label: 'Student ID', field: 'student_id', sortable: true },
  { name: 'name', align: 'left', label: 'Name', field: 'name', sortable: true },
  { name: 'grade', align: 'left', label: 'Grade', field: 'grade', sortable: true },
  { name: 'contact', align: 'left', label: 'WhatsApp', field: 'contact' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', sortable: true },
  { name: 'actions', align: 'right', label: 'Actions', field: 'actions' }
]

const filteredRows = computed(() => {
  return rows.value.filter(row => {
    const matchGrade = gradeFilter.value === 'All Grades' || row.grade === gradeFilter.value
    return matchGrade
  })
})

onMounted(() => {
  fetchInactiveStudents()
})

const fetchInactiveStudents = async () => {
  loading.value = true
  selected.value = []
  try {
    const data = await client.get('students?status=Inactive')
    rows.value = data || []
  } catch (error) {
    console.error('Error fetching inactive students:', error)
    $q.notify({
      type: 'negative',
      message: appStore.language === 'English' ? 'Failed to fetch inactive students' : 'අක්‍රිය සිසුන් ලබා ගැනීම අසාර්ථක විය'
    })
  } finally {
    loading.value = false
  }
}

// Single actions
const confirmReactivateSingle = (student) => {
  $q.dialog({
    title: appStore.language === 'English' ? 'Reactivate Student' : 'සිසුවා සක්‍රිය කරන්න',
    message: appStore.language === 'English' 
      ? `Are you sure you want to reactivate student "${student.name}"?` 
      : `"${student.name}" සිසුවාව නැවත සක්‍රිය කිරීමට අවශ්‍ය බව තහවුරු කරන්න.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await studentsBulk.bulkReactivate([student.id])
      $q.notify({
        type: 'positive',
        message: appStore.language === 'English' ? 'Student successfully reactivated!' : 'සිසුවාව සාර්ථකව සක්‍රිය කරන ලදී!'
      })
      fetchInactiveStudents()
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: 'Failed to reactivate: ' + e.message
      })
    }
  })
}

const confirmDeleteSingle = (student) => {
  $q.dialog({
    title: appStore.language === 'English' ? 'Security Warning' : 'ආරක්ෂක අනතුරු ඇඟවීම',
    message: appStore.language === 'English'
      ? `This will PERMANENTLY delete student "${student.name}" and all associated data (grades, attendance, payments). This cannot be undone. Type the student name to confirm:`
      : `මෙමඟින් "${student.name}" සිසුවාව සහ අදාළ සියලුම දත්ත (ලකුණු, පැමිණීම, ගෙවීම්) ස්ථිරවම මකා දැමෙනු ඇත. මෙය නැවත වෙනස් කළ නොහැක. තහවුරු කිරීමට ශිෂ්‍යයාගේ නම ටයිප් කරන්න:`,
    prompt: {
      model: '',
      type: 'text',
      isValid: val => val === student.name
    },
    cancel: true,
    persistent: true,
    ok: {
      color: 'red-7',
      label: appStore.language === 'English' ? 'Delete Permanently' : 'ස්ථිරවම ඉවත් කරන්න'
    }
  }).onOk(async () => {
    try {
      await studentsBulk.bulkDelete([student.id])
      $q.notify({
        type: 'positive',
        message: appStore.language === 'English' ? 'Student permanently deleted.' : 'සිසුවාව ස්ථිරවම ඉවත් කරන ලදී.'
      })
      fetchInactiveStudents()
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: 'Failed to delete student: ' + e.message
      })
    }
  })
}

// Bulk actions
const confirmReactivateBulk = () => {
  const ids = selected.value.map(s => s.id)
  $q.dialog({
    title: appStore.language === 'English' ? 'Reactivate Students' : 'සිසුන් සක්‍රිය කරන්න',
    message: appStore.language === 'English'
      ? `Are you sure you want to reactivate ${selected.value.length} selected student(s)?`
      : `තෝරාගත් සිසුන් ${selected.value.length} දෙනා නැවත සක්‍රිය කිරීමට අවශ්‍ය බව තහවුරු කරන්න.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await studentsBulk.bulkReactivate(ids)
      $q.notify({
        type: 'positive',
        message: appStore.language === 'English' ? 'Selected students reactivated successfully!' : 'තෝරාගත් සිසුන් සාර්ථකව සක්‍රිය කරන ලදී!'
      })
      fetchInactiveStudents()
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: 'Reactivation failed: ' + e.message
      })
    }
  })
}

const confirmDeleteBulk = () => {
  const ids = selected.value.map(s => s.id)
  $q.dialog({
    title: appStore.language === 'English' ? 'DANGER: Bulk Delete' : 'අනතුර: තොග වශයෙන් මකා දැමීම',
    message: appStore.language === 'English'
      ? `You are about to PERMANENTLY delete ${selected.value.length} student(s) and all their history. Type "DELETE" to confirm this action:`
      : `ඔබ තෝරාගත් සිසුන් ${selected.value.length} දෙනා සහ ඔවුන්ගේ සියලු ඉතිහාසය ස්ථිරවම මකා දැමීමට සූදානම් වේ. මෙම ක්‍රියාව තහවුරු කිරීමට "DELETE" ලෙස ටයිප් කරන්න:`,
    prompt: {
      model: '',
      type: 'text',
      isValid: val => val === 'DELETE'
    },
    cancel: true,
    persistent: true,
    ok: {
      color: 'red-9',
      label: appStore.language === 'English' ? 'DELETE ALL' : 'සියල්ල මකා දමන්න'
    }
  }).onOk(async () => {
    try {
      await studentsBulk.bulkDelete(ids)
      $q.notify({
        type: 'positive',
        message: appStore.language === 'English' ? 'Selected students permanently deleted.' : 'තෝරාගත් සිසුන් ස්ථිරවම ඉවත් කරන ලදී.'
      })
      fetchInactiveStudents()
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: 'Failed to delete students: ' + e.message
      })
    }
  })
}

const openWhatsApp = (phone) => {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '94' + cleaned.substring(1)
  }
  window.open(`https://wa.me/${cleaned}`, '_blank')
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
}

.bg-indigo-900 {
  background-color: #0c1142 !important;
}

.border-left-inactive {
  border-left: 5px solid #ef5350 !important;
}

.border-left-selected {
  border-left: 5px solid #ffb300 !important;
}

.custom-glass-table :deep(.q-table__container) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.custom-glass-table :deep(thead tr th) {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: #3f51b5;
  background: rgba(238, 242, 255, 0.5) !important;
  border-bottom: 2px solid rgba(224, 224, 224, 0.5);
}

.custom-glass-table :deep(tbody tr) {
  transition: all 0.3s ease;
  background: transparent;
}

.custom-glass-table :deep(tbody tr:hover) {
  background: rgba(238, 242, 255, 0.4) !important;
}

.custom-glass-table :deep(tbody tr td) {
  border-bottom: 1px solid rgba(224, 224, 224, 0.3);
  font-size: 14px;
}

.rounded-button {
  border-radius: 8px;
}

.search-input :deep(.q-field__control) {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
}

.card-accents {
  pointer-events: none;
}

.accent-blob-1 {
  position: absolute;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(239, 83, 80, 0.15) 0%, transparent 70%);
  bottom: -40px;
  right: -40px;
  border-radius: 50%;
}

.accent-blob-2 {
  position: absolute;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(255, 179, 0, 0.15) 0%, transparent 70%);
  bottom: -40px;
  right: -40px;
  border-radius: 50%;
}
</style>
