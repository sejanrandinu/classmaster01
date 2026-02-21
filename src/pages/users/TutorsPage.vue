<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <h1 class="text-h4 text-weight-bold text-grey-9 q-mb-none">Tutors</h1>
      <q-btn color="primary" icon="person_add" label="Add Tutor" unelevated no-caps @click="openAddDialog" />
    </div>

    <!-- Empty State -->
    <div v-if="rows.length === 0" class="flex flex-center bg-white rounded-borders q-pa-xl border-grey">
        <div class="text-center">
            <q-icon name="person_off" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">No tutors found</div>
            <p class="text-grey-5">Get started by adding a new tutor.</p>
            <q-btn color="primary" label="Add Tutor" unelevated no-caps class="q-mt-sm" @click="openAddDialog" />
        </div>
    </div>

    <q-card v-else flat bordered class="rounded-borders">
      <q-table
        flat
        :rows="rows"
        :columns="columns"
        row-key="id"
        :filter="filter"
      >
        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filter" placeholder="Search Tutors">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <template v-slot:body-cell-subject="props">
            <q-td :props="props">
                <q-badge color="blue-1" text-color="primary">
                    {{ props.value }}
                </q-badge>
            </q-td>
        </template>

        <template v-slot:body-cell-grades="props">
            <q-td :props="props">
                <div class="row q-gutter-xs">
                    <q-chip v-for="grade in props.value" :key="grade" size="xs" dense color="grey-2" text-color="grey-9">
                        {{ grade }}
                    </q-chip>
                    <span v-if="!props.value || props.value.length === 0" class="text-grey-4 text-caption">No grades</span>
                </div>
            </q-td>
        </template>
        
        <template v-slot:body-cell-actions="props">
            <q-td :props="props" auto-width>
                <q-btn flat round dense color="grey-7" icon="more_vert">
                    <q-menu cover auto-close>
                        <q-list>
                            <q-item clickable>
                                <q-item-section>View Profile</q-item-section>
                            </q-item>
                            <q-item clickable @click="openEditDialog(props.row)">
                                <q-item-section>Edit</q-item-section>
                            </q-item>
                            <q-item clickable class="text-red" @click="deleteTutor(props.row.id)">
                                <q-item-section>Remove</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog">
        <q-card style="min-width: 400px">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ isEdit ? 'Edit Tutor' : 'Add New Tutor' }}</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pt-lg">
                <q-form @submit="saveTutor" class="q-gutter-md">
                    <q-input outlined v-model="form.name" label="Full Name" :rules="[val => !!val || 'Name is required']" />
                    <q-select outlined v-model="form.subject" :options="subjectOptions" label="Subject" :loading="loading" :rules="[val => !!val || 'Subject is required']" />
                    
                    <div class="q-mt-md">
                        <div class="text-subtitle2 text-grey-7 q-mb-xs">Grade Ranges</div>
                        <div class="row q-col-gutter-xs">
                            <div v-for="g in 13" :key="g" class="col-4 col-sm-3">
                                <q-checkbox 
                                    v-model="form.grades" 
                                    :val="'Grade ' + g" 
                                    :label="'Grade ' + g" 
                                    color="primary"
                                    dense
                                />
                            </div>
                        </div>
                    </div>

                    <q-input outlined v-model="form.email" label="Email" type="email" class="q-mt-md" />
                    <q-input outlined v-model="form.phone" label="Phone Number" mask="##########" hint="Format: 0771234567" :rules="[val => (val && val.replace(/\D/g, '').length === 10) || 'අංක 10ක් ඇතුළත් කරන්න']" />
                    
                    <q-separator class="q-my-md" />
                    <div class="text-subtitle2 text-grey-7 q-mb-sm">Bank Details (Optional - For Payments)</div>
                    <q-input outlined v-model="form.bank_name" label="Bank Name (Optional)" dense hint="Leave empty if not needed" />
                    <q-input outlined v-model="form.bank_account_name" label="Bank Account Name (Optional)" dense hint="Leave empty if not needed" />
                    <q-input outlined v-model="form.bank_account_number" label="Bank Account Number (Optional)" dense hint="Leave empty if not needed" />
                    <q-input outlined v-model="form.bank_branch" label="Bank Branch (Optional)" dense hint="Leave empty if not needed" />
                    
                    <div class="row justify-end q-mt-lg">
                        <q-btn label="Cancel" color="grey-7" flat v-close-popup class="q-mr-sm" />
                        <q-btn :label="isEdit ? 'Update' : 'Save'" type="submit" color="primary" unelevated />
                    </div>
                </q-form>
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
const isEdit = ref(false)
const loading = ref(false)

// Form Data
const form = ref({
  id: null,
  name: '',
  subject: '',
  email: '',
  phone: '',
  grades: [],
  bank_name: '',
  bank_account_name: '',
  bank_account_number: '',
  bank_branch: ''
})

const columns = [
  { name: 'name', align: 'left', label: 'Name', field: 'name', sortable: true },
  { name: 'subject', align: 'left', label: 'Subject', field: 'subject', sortable: true },
  { name: 'grades', align: 'left', label: 'Grades', field: 'grades' },
  { name: 'email', align: 'left', label: 'Email', field: 'email' },
  { name: 'phone', align: 'left', label: 'Phone', field: 'phone' },
  { name: 'actions', align: 'right', label: 'Actions', field: 'actions' }
]

const rows = ref([])
const subjectOptions = ref([])

onMounted(() => {
    fetchTutors()
    fetchSubjects()
})

const fetchSubjects = async () => {
    try {
        const data = await client.get('subjects')
        if (data) subjectOptions.value = data.map(s => s.name)
    } catch {
        console.warn('Could not fetch subjects')
    }
}

const fetchTutors = async () => {
    loading.value = true
    try {
        const data = await client.get('tutors')
        rows.value = data || []
    } catch {
        $q.notify({ 
            type: 'negative', 
            message: 'ගුරුවරුන්ගේ ලැයිස්තුව ලබා ගැනීමට අපොහොසත් විය',
            actions: [{ label: 'නැවත උත්සාහ කරන්න', color: 'white', handler: () => fetchTutors() }]
        })
    } finally {
        loading.value = false
    }
}

// Actions
const openAddDialog = () => {
    isEdit.value = false
    form.value = { id: null, name: '', subject: '', email: '', phone: '', grades: [], bank_name: '', bank_account_name: '', bank_account_number: '', bank_branch: '' }
    showDialog.value = true
}

const openEditDialog = (row) => {
    isEdit.value = true
    form.value = { ...row, grades: row.grades || [] }
    showDialog.value = true
}

const saveTutor = async () => {
    loading.value = true
    const tutorData = {
        name: form.value.name,
        subject: form.value.subject,
        email: form.value.email,
        phone: form.value.phone,
        grades: form.value.grades,
        bank_name: form.value.bank_name,
        bank_account_name: form.value.bank_account_name,
        bank_account_number: form.value.bank_account_number,
        bank_branch: form.value.bank_branch
    }

    try {
        if (isEdit.value && form.value.id) {
            await client.put(`tutors/${form.value.id}`, tutorData)
        } else {
            await client.post('tutors', tutorData)
        }
        $q.notify({ type: 'positive', message: isEdit.value ? 'Tutor updated' : 'Tutor added' })
        showDialog.value = false
        fetchTutors()
    } catch {
        $q.notify({ type: 'negative', message: 'Error saving tutor' })
    } finally {
        loading.value = false
    }
}

const deleteTutor = (id) => {
    $q.dialog({
        title: 'Confirm',
        message: 'Are you sure you want to delete this tutor?',
        cancel: true,
        persistent: true
    }).onOk(async () => {
        loading.value = true
        try {
            await client.delete(`tutors/${id}`)
            $q.notify({ type: 'positive', message: 'Tutor deleted successfully' })
            fetchTutors()
        } catch {
            $q.notify({ type: 'negative', message: 'Error deleting tutor' })
        } finally {
            loading.value = false
        }
    })
}
</script>
