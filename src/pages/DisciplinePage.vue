<template>
  <q-page class="q-pa-lg bg-indigo-50">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <q-breadcrumbs class="text-grey-6 text-subtitle2 q-mb-xs">
          <q-breadcrumbs-el label="ClassMaster" />
          <q-breadcrumbs-el :label="t.administration" />
          <q-breadcrumbs-el :label="t.discipline" />
        </q-breadcrumbs>
        <h1 class="text-h3 text-weight-bold text-indigo-10 q-my-none flex items-center">
          <q-icon name="gavel" class="q-mr-md text-deep-purple-7" />
          {{ t.discipline }}
        </h1>
        <p class="text-grey-7 q-mt-sm text-subtitle1">
          {{ appStore.language === 'English' ? 'Monitor student behavior records, accolades, warnings, and interventions.' : 'සිසුන්ගේ විනය වාර්තා, ඇගයීම්, අවවාද කිරීම් සහ අනෙකුත් තොරතුරු මෙතැනින් කළමනාකරණය කරන්න.' }}
        </p>
      </div>
      <q-btn color="indigo" icon="add" :label="appStore.language === 'English' ? 'Log Behavior Incident' : 'නව විනය වාර්තාවක් එක් කරන්න'" unelevated no-caps class="rounded-button q-px-md shadow-2" @click="openAddDialog" />
    </div>

    <!-- Stats Summary -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-sm-3">
        <q-card class="glass-card q-pa-md shadow-3 relative-position overflow-hidden border-left-accolade">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-grey-6 uppercase">{{ appStore.language === 'English' ? 'Accolades' : 'ඇගයීම්' }}</div>
              <div class="text-h4 text-weight-bold text-green-7 q-mt-sm">{{ countByType('Achievement') }}</div>
            </div>
            <q-avatar size="44px" class="bg-green-1" text-color="green-7" icon="emoji_events" />
          </div>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card class="glass-card q-pa-md shadow-3 relative-position overflow-hidden border-left-warning">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-grey-6 uppercase">{{ appStore.language === 'English' ? 'Warnings' : 'අවවාද කිරීම්' }}</div>
              <div class="text-h4 text-weight-bold text-amber-8 q-mt-sm">{{ countByType('Warning') }}</div>
            </div>
            <q-avatar size="44px" class="bg-amber-1" text-color="amber-8" icon="report_problem" />
          </div>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card class="glass-card q-pa-md shadow-3 relative-position overflow-hidden border-left-infraction">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-grey-6 uppercase">{{ appStore.language === 'English' ? 'Infractions' : 'විනය කඩකිරීම්' }}</div>
              <div class="text-h4 text-weight-bold text-red-6 q-mt-sm">{{ countByType('Infraction') }}</div>
            </div>
            <q-avatar size="44px" class="bg-red-1" text-color="red-6" icon="error_outline" />
          </div>
        </q-card>
      </div>
      <div class="col-6 col-sm-3">
        <q-card class="glass-card q-pa-md shadow-3 relative-position overflow-hidden border-left-suspension">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-grey-6 uppercase">{{ appStore.language === 'English' ? 'Suspensions' : 'පන්ති තහනම්' }}</div>
              <div class="text-h4 text-weight-bold text-deep-purple-7 q-mt-sm">{{ countByType('Suspension') }}</div>
            </div>
            <q-avatar size="44px" class="bg-deep-purple-1" text-color="deep-purple-7" icon="block" />
          </div>
        </q-card>
      </div>
    </div>

    <!-- Filters & Main Panel -->
    <q-card class="glass-card shadow-4 rounded-borders overflow-hidden q-mb-lg">
      <q-card-section class="q-py-md bg-white border-bottom row items-center justify-between q-gutter-md">
        <div class="row items-center q-gutter-sm">
          <q-btn-toggle
            v-model="activeTab"
            toggle-color="indigo"
            flat
            stretch
            no-caps
            :options="tabOptions"
            class="text-grey-7"
          />
        </div>
        <div>
          <q-input 
            outlined 
            dense 
            v-model="filterText" 
            :placeholder="appStore.language === 'English' ? 'Search by student name...' : 'සිසුවාගේ නම සොයන්න...'"
            style="width: 250px;"
            class="search-input"
          >
            <template v-slot:prepend>
              <q-icon name="search" color="grey-5" />
            </template>
            <template v-slot:append v-if="filterText">
              <q-icon name="close" @click="filterText = ''" class="cursor-pointer" />
            </template>
          </q-input>
        </div>
      </q-card-section>

      <!-- Logs Card List -->
      <q-card-section class="q-pa-lg">
        <div v-if="loading" class="flex flex-center q-py-xl">
          <q-spinner-dots color="indigo" size="40px" />
        </div>
        
        <div v-else-if="filteredRecords.length === 0" class="text-center q-pa-xl text-grey-6">
          <q-icon name="gavel" size="64px" color="grey-4" class="q-mb-md" />
          <div class="text-h6 text-grey-5">{{ appStore.language === 'English' ? 'No behavior logs recorded' : 'කිසිදු විනය වාර්තාවක් හමු නොවිය' }}</div>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div v-for="record in filteredRecords" :key="record.id" class="col-12 col-md-6">
            <q-card flat bordered class="behavior-card rounded-borders transition hover-shadow flex column justify-between" :class="getCardBorderClass(record.type)">
              <q-card-section class="q-pb-xs">
                <div class="row justify-between items-start no-wrap">
                  <div class="row items-center q-gutter-sm">
                    <q-avatar size="36px" class="bg-indigo-1 text-indigo-9">
                      <span class="text-weight-bold">{{ record.student_name ? record.student_name.charAt(0).toUpperCase() : 'S' }}</span>
                    </q-avatar>
                    <div>
                      <div class="text-weight-bold text-indigo-10 text-subtitle1">{{ record.student_name }}</div>
                      <div class="text-caption text-grey-6 font-mono">{{ record.student_id_str }} | {{ record.student_grade }}</div>
                    </div>
                  </div>
                  <q-chip dense :color="getTypeColor(record.type)" text-color="white" class="text-weight-bold text-caption uppercase q-px-sm">
                    <q-icon :name="getTypeIcon(record.type)" size="14px" class="q-mr-xs" />
                    {{ record.type }}
                  </q-chip>
                </div>

                <div class="q-mt-md">
                  <span class="text-caption text-grey-6 text-weight-bold uppercase letter-spacing-wide">Category: </span>
                  <span class="text-weight-medium text-indigo-9">{{ record.category }}</span>
                </div>

                <div class="q-mt-sm text-indigo-10 text-body2 text-line-clamp-3">
                  {{ record.description }}
                </div>
              </q-card-section>

              <div>
                <q-separator class="q-mt-sm opacity-50" />
                <q-card-actions align="between" class="q-px-md q-py-sm text-grey-7 bg-grey-50">
                  <div class="row items-center">
                    <q-icon name="event" size="14px" class="q-mr-xs text-grey-5" />
                    <span class="text-caption">{{ record.date }}</span>
                  </div>
                  <div class="row q-gutter-xs">
                    <q-btn flat round dense color="primary" icon="edit" size="sm" @click="openEditDialog(record)" />
                    <q-btn flat round dense color="red" icon="delete" size="sm" @click="confirmDeleteRecord(record.id)" />
                  </div>
                </q-card-actions>
              </div>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Incident dialog (Add / Edit) -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="width: 500px; max-width: 95vw; border-radius: 16px;" class="glass-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-indigo-10 text-weight-bold">
            {{ isEdit ? (appStore.language === 'English' ? 'Update Behavior Incident' : 'විනය වාර්තාව යාවත්කාලීන කරන්න') : (appStore.language === 'English' ? 'Log Behavior Incident' : 'නව විනය වාර්තාවක් එක් කරන්න') }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="grey-6" />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="saveRecord" class="q-gutter-md">
            
            <!-- Student Autocomplete select -->
            <q-select
              outlined
              dense
              v-model="form.student"
              use-input
              input-debounce="300"
              :label="appStore.language === 'English' ? 'Select Student' : 'සිසුවා තෝරන්න'"
              :options="studentOptions"
              @filter="filterStudents"
              option-label="name"
              option-value="id"
              :rules="[val => !!val || 'Student selection required']"
              :disable="isEdit"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No active students found
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ scope.opt.name }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.student_id }} | {{ scope.opt.grade }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-select
                  outlined
                  dense
                  v-model="form.type"
                  :label="appStore.language === 'English' ? 'Incident Type' : 'ක්‍රියාකාරකම් වර්ගය'"
                  :options="['Achievement', 'Warning', 'Infraction', 'Suspension']"
                  :rules="[val => !!val || 'Required']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  outlined
                  dense
                  v-model="form.category"
                  :label="appStore.language === 'English' ? 'Category / Tag' : 'වර්ගය / ලේබලය'"
                  placeholder="e.g. Excellent Exam, Late Arrival"
                  :rules="[val => !!val || 'Required']"
                />
              </div>
            </div>

            <q-input
              outlined
              dense
              v-model="form.date"
              type="date"
              :label="appStore.language === 'English' ? 'Incident Date' : 'දිනය'"
              :rules="[val => !!val || 'Date required']"
            />

            <q-input
              outlined
              v-model="form.description"
              type="textarea"
              :label="appStore.language === 'English' ? 'Detailed Description' : 'විස්තරය'"
              placeholder="Provide a clear description of the incident or award..."
              rows="4"
              :rules="[val => !!val || 'Description required']"
            />

            <div class="row justify-end q-mt-xl">
              <q-btn label="Cancel" flat v-close-popup class="q-mr-sm rounded-button" />
              <q-btn :label="isEdit ? 'Update' : 'Submit'" type="submit" color="indigo" unelevated :loading="saving" class="rounded-button q-px-md" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { discipline, client } from 'src/api'
import { useAppStore } from 'src/store/app'
import layoutTranslations from 'src/i18n/layout'

const appStore = useAppStore()
const t = computed(() => layoutTranslations[appStore.language])
const $q = useQuasar()

const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const isEdit = ref(false)
const filterText = ref('')
const activeTab = ref('All')

const records = ref([])
const allStudents = ref([])
const studentOptions = ref([])

const form = ref({
  id: null,
  student: null,
  type: 'Warning',
  category: '',
  date: '',
  description: ''
})

const tabOptions = computed(() => [
  { label: appStore.language === 'English' ? 'All Logs' : 'සියල්ල', value: 'All' },
  { label: appStore.language === 'English' ? 'Accolades' : 'ඇගයීම්', value: 'Achievement' },
  { label: appStore.language === 'English' ? 'Warnings' : 'අවවාද කිරීම්', value: 'Warning' },
  { label: appStore.language === 'English' ? 'Infractions/Suspensions' : 'විනය ගැටළු', value: 'InfractionOrSuspension' }
])

const filteredRecords = computed(() => {
  return records.value.filter(r => {
    // Tab Filter
    if (activeTab.value === 'Achievement' && r.type !== 'Achievement') return false
    if (activeTab.value === 'Warning' && r.type !== 'Warning') return false
    if (activeTab.value === 'InfractionOrSuspension' && r.type !== 'Infraction' && r.type !== 'Suspension') return false
    
    // Search Filter
    if (filterText.value) {
      const query = filterText.value.toLowerCase()
      const matchesName = r.student_name?.toLowerCase().includes(query)
      const matchesId = r.student_id_str?.toLowerCase().includes(query)
      const matchesCategory = r.category?.toLowerCase().includes(query)
      return matchesName || matchesId || matchesCategory
    }
    
    return true
  })
})

onMounted(() => {
  fetchRecords()
  fetchActiveStudents()
})

const fetchRecords = async () => {
  loading.value = true
  try {
    const data = await discipline.getAll()
    records.value = data || []
  } catch (error) {
    console.error('Error fetching discipline logs:', error)
    $q.notify({ type: 'negative', message: 'Failed to fetch behavior logs' })
  } finally {
    loading.value = false
  }
}

const fetchActiveStudents = async () => {
  try {
    const data = await client.get('students?status=Active')
    allStudents.value = data || []
  } catch (e) {
    console.error('Failed to load active students list', e)
  }
}

const filterStudents = (val, update) => {
  if (val === '') {
    update(() => {
      studentOptions.value = allStudents.value
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    studentOptions.value = allStudents.value.filter(s => 
      s.name.toLowerCase().includes(needle) || 
      s.student_id.toLowerCase().includes(needle)
    )
  })
}

const countByType = (type) => {
  return records.value.filter(r => r.type === type).length
}

const openAddDialog = () => {
  isEdit.value = false
  form.value = {
    id: null,
    student: null,
    type: 'Warning',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  }
  dialogOpen.value = true
}

const openEditDialog = (record) => {
  isEdit.value = true
  form.value = {
    id: record.id,
    student: { id: record.student_id, name: record.student_name, student_id: record.student_id_str },
    type: record.type,
    category: record.category,
    date: record.date,
    description: record.description
  }
  dialogOpen.value = true
}

const saveRecord = async () => {
  saving.value = true
  try {
    const payload = {
      student_id: form.value.student.id,
      type: form.value.type,
      category: form.value.category,
      date: form.value.date,
      description: form.value.description
    }

    if (isEdit.value && form.value.id) {
      await discipline.update(form.value.id, payload)
      $q.notify({ type: 'positive', message: 'Discipline log updated successfully!' })
    } else {
      await discipline.create(payload)
      $q.notify({ type: 'positive', message: 'Discipline record logged successfully!' })
    }
    
    dialogOpen.value = false
    fetchRecords()
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error saving discipline log: ' + e.message })
  } finally {
    saving.value = false
  }
}

const confirmDeleteRecord = (id) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: 'Are you sure you want to permanently delete this behavior record?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await discipline.delete(id)
      $q.notify({ type: 'positive', message: 'Record deleted.' })
      fetchRecords()
    } catch {
      $q.notify({ type: 'negative', message: 'Delete failed.' })
    }
  })
}

// Styling helpers
const getTypeColor = (type) => {
  if (type === 'Achievement') return 'green-7'
  if (type === 'Warning') return 'amber-8'
  if (type === 'Infraction') return 'red-6'
  return 'deep-purple-7'
}

const getTypeIcon = (type) => {
  if (type === 'Achievement') return 'emoji_events'
  if (type === 'Warning') return 'report_problem'
  if (type === 'Infraction') return 'error_outline'
  return 'block'
}

const getCardBorderClass = (type) => {
  if (type === 'Achievement') return 'border-left-accolade'
  if (type === 'Warning') return 'border-left-warning'
  if (type === 'Infraction') return 'border-left-infraction'
  return 'border-left-suspension'
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
}

.rounded-button {
  border-radius: 8px;
}

.search-input :deep(.q-field__control) {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
}

.border-left-accolade {
  border-left: 5px solid #2e7d32 !important;
}

.border-left-warning {
  border-left: 5px solid #ff8f00 !important;
}

.border-left-infraction {
  border-left: 5px solid #d32f2f !important;
}

.border-left-suspension {
  border-left: 5px solid #5e35b1 !important;
}

.behavior-card {
  height: 240px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.hover-shadow:hover {
  box-shadow: 0 8px 20px rgba(0,0,0,0.08) !important;
  transform: translateY(-2px);
}

.transition {
  transition: all 0.3s ease;
}

.letter-spacing-wide {
  letter-spacing: 0.05em;
}

.text-line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
