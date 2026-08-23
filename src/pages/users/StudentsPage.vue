<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <h1 class="text-h4 text-weight-bold text-grey-9 q-mb-none">Students</h1>
      <q-btn color="primary" icon="add" label="Add Student" unelevated no-caps @click="openAddDialog" />
    </div>

    <!-- Filters Row -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-3">
        <q-select 
          outlined 
          dense 
          v-model="selectedGrade" 
          :options="['All Grades', ...gradeOptions]" 
          label="Filter by Grade"
          bg-color="white"
        />
      </div>
      <div class="col-12 col-sm-3">
        <q-select 
          outlined 
          dense 
          v-model="selectedSubject" 
          :options="['All Subjects', ...subjectOptions]" 
          label="Filter by Subject"
          bg-color="white"
        />
      </div>
      <div class="col-12 col-sm-3">
        <q-select 
          outlined 
          dense 
          v-model="selectedStatus" 
          :options="['All Status', 'Active', 'Inactive']" 
          label="Filter by Status"
          bg-color="white"
        />
      </div>
      <div class="col-12 col-sm-3">
        <q-input 
          outlined 
          dense 
          v-model="selectedSchool" 
          label="Filter by Institute"
          bg-color="white"
          debounce="300"
        >
          <template v-slot:append><q-icon name="business" /></template>
        </q-input>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="rows.length === 0" class="flex flex-center bg-white rounded-borders q-pa-xl border-grey">
        <div class="text-center">
            <q-icon name="group_off" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">No students found</div>
            <p class="text-grey-5">Get started by adding a new student.</p>
            <q-btn color="primary" label="Add Student" unelevated no-caps class="q-mt-sm" @click="openAddDialog" />
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
          <q-input borderless dense debounce="300" v-model="filter" placeholder="Search students...">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
        
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-chip 
              size="sm" 
              :color="props.row.status === 'Active' ? 'green-1' : 'red-1'" 
              :text-color="props.row.status === 'Active' ? 'green-8' : 'red-8'"
            >
              {{ props.row.status || 'N/A' }}
            </q-chip>
          </q-td>
        </template>
        
        <template v-slot:body-cell-grade="props">
            <q-td :props="props">
                {{ props.row.grade || 'N/A' }}
            </q-td>
        </template>
        
        <template v-slot:body-cell-actions="props">
            <q-td :props="props" auto-width>
                <q-btn flat round dense color="grey-7" icon="more_vert">
                    <q-menu cover auto-close>
                        <q-list>
                            <q-item clickable class="text-primary" @click="generateQR(props.row)">
                                <q-item-section avatar>
                                    <q-icon name="qr_code_2" />
                                </q-item-section>
                                <q-item-section>View ID Card</q-item-section>
                            </q-item>
                            <q-item v-if="props.row.whatsapp_group_url" clickable class="text-green-7" :href="props.row.whatsapp_group_url" target="_blank">
                                <q-item-section avatar>
                                    <q-icon name="fa-brands fa-whatsapp" />
                                </q-item-section>
                                <q-item-section>WhatsApp Group</q-item-section>
                            </q-item>
                            <q-item clickable class="text-indigo-7" @click="openTutesDialog(props.row)">
                                <q-item-section avatar>
                                    <q-icon name="description" />
                                </q-item-section>
                                <q-item-section>Tutes Status</q-item-section>
                            </q-item>
                            <q-item clickable @click="openEditDialog(props.row)">
                                <q-item-section avatar>
                                    <q-icon name="edit" />
                                </q-item-section>
                                <q-item-section>Edit</q-item-section>
                            </q-item>
                            <q-item clickable class="text-red" @click="deleteStudent(props.row.id)">
                                <q-item-section avatar>
                                    <q-icon name="delete" />
                                </q-item-section>
                                <q-item-section>Delete</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
        <q-card style="width: 550px; max-width: 95vw; border-radius: 15px;">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ isEdit ? 'Edit Student' : 'Add New Student' }}</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pt-lg">
                <q-form @submit="saveStudent" class="q-gutter-md">
                    <q-input outlined v-model="form.name" label="Full Name" :rules="[val => !!val || 'Name is required']" />
                    <q-input outlined v-model="form.contact" label="WhatsApp Number" placeholder="e.g. 0702838364" :rules="[val => (val && val.replace(/\D/g, '').length >= 9) || (appStore.language === 'English' ? 'Please enter a valid phone number' : 'කරුණාකර වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න')]" />
                    <q-input outlined v-model="form.school" label="Institute" hint="e.g. Royal Institute" />
                    <q-select outlined v-model="form.grade" :options="['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13']" label="Grade" :rules="[val => !!val || 'Grade is required']" />
                    <div class="q-mb-md">
                        <div class="text-subtitle2 q-mb-xs text-grey-7">Select Subjects</div>
                        <div class="row q-col-gutter-sm">
                            <div v-for="sub in subjectOptions" :key="sub" class="col-6 col-sm-4">
                                <q-checkbox 
                                    v-model="form.subjects" 
                                    :val="sub" 
                                    :label="sub" 
                                    color="primary"
                                    dense
                                />
                            </div>
                        </div>
                    </div>
                    <q-select outlined v-model="form.status" :options="['Active', 'Inactive']" label="Status" :rules="[val => !!val || 'Status is required']" />
                    
                    <div class="q-pa-md bg-indigo-1 rounded-borders q-mb-md">
                        <div class="text-subtitle2 q-mb-xs text-indigo">Student Photo</div>
                        <q-file 
                            outlined 
                            v-model="pickedFile" 
                            label="Choose Photo / Take Picture" 
                            accept="image/*"
                            @update:model-value="onFilePicked"
                            class="bg-white"
                        >
                            <template v-slot:prepend><q-icon name="add_a_photo" color="indigo" /></template>
                        </q-file>
                        <div v-if="form.image_url" class="q-mt-sm row justify-center">
                            <q-avatar size="100px" rounded>
                                <img :src="form.image_url">
                            </q-avatar>
                        </div>
                    </div>
                    
                    <div class="row justify-end q-mt-lg">
                        <q-btn label="Cancel" color="grey-7" flat v-close-popup class="q-mr-sm" />
                        <q-btn :label="isEdit ? 'Update' : 'Save'" type="submit" color="primary" unelevated />
                    </div>
                </q-form>
            </q-card-section>
        </q-card>
    </q-dialog>

    <!-- QR Code Dialog -->
    <q-dialog v-model="showQRDialog" transition-show="scale" transition-hide="scale">
        <q-card style="width: 500px; max-width: 95vw; overflow: hidden;" class="id-card-container bg-transparent no-shadow">
            <div class="id-card-scale-wrapper">
                <div id="student-id-card" class="student-card shadow-24" :style="globalSettings.card_background_url ? `background-image: url(${globalSettings.card_background_url}); background-size: cover; background-position: center;` : ''">
                <div class="card-gradient" :style="globalSettings.card_theme_color ? `background: linear-gradient(135deg, ${globalSettings.card_theme_color}${globalSettings.card_background_url ? 'aa' : ''} 0%, ${globalSettings.card_theme_color}${globalSettings.card_background_url ? '99' : ''} 100%)` : ''"></div>
                <!-- Card Inner Content -->
                <div class="card-content relative-position full-height q-pa-lg text-white">
                    <!-- Branding Row -->
                    <div class="row justify-between items-center q-mb-sm">
                        <div class="brand-name flex items-center">
                            <q-avatar size="24px" class="q-mr-sm">
                                <img src="/favicon.svg">
                            </q-avatar>
                            <div class="text-overline text-weight-bold letter-spacing-2">CLASSMASTER</div>
                        </div>
                        <div class="card-type text-indigo-1 text-weight-bold text-caption">STUDENT IDENTIFICATION</div>
                    </div>

                    <!-- Main Content Row -->
                    <div class="row q-col-gutter-md items-center" style="margin-top: 5px;">
                        <!-- Student Photo or QR Fallback -->
                        <div class="col-auto">
                            <div class="photo-wrapper-premium" :class="globalSettings.card_layout_type === 'compact' ? 'compact-size' : ''">
                                <div class="photo-inner bg-white">
                                    <q-img v-if="qrStudent?.image_url" :src="qrStudent.image_url" class="student-photo-img" />
                                    <div v-else class="full-height flex flex-center">
                                        <qrcode-vue 
                                            :value="getPortalUrl(qrStudent?.student_id)" 
                                            :size="globalSettings.card_layout_type === 'compact' ? 80 : 100" 
                                            level="H" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Mini QR if photo exists -->
                        <div v-if="qrStudent?.image_url" class="col-auto">
                            <div class="qr-container-premium mini-qr">
                                <div class="qr-wrapper bg-white q-pa-xs">
                                    <qrcode-vue 
                                        :value="getPortalUrl(qrStudent?.student_id)" 
                                        :size="60" 
                                        level="H" 
                                        render-as="canvas"
                                        id="qr-canvas-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Right: Student Details -->
                        <div class="col">
                            <div class="q-pl-lg">
                                <div class="text-h4 text-weight-bolder text-uppercase text-shadow-sm text-white no-margin letter-spacing-1">{{ qrStudent?.name }}</div>
                                <div class="details-grid q-mt-sm">
                                    <div class="row q-col-gutter-sm">
                                        <div class="col-6">
                                            <div class="text-caption text-indigo-2 text-uppercase font-size-10 text-weight-bold">Grade / Class</div>
                                            <div class="text-subtitle1 text-weight-bold no-line-height">{{ qrStudent?.grade }}</div>
                                        </div>
                                        <div class="col-6">
                                            <div class="text-caption text-indigo-2 text-uppercase font-size-10 text-weight-bold">Student ID</div>
                                            <div class="text-subtitle1 text-weight-bold no-line-height text-yellow-7">{{ qrStudent?.student_id }}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="row q-col-gutter-sm q-mt-xs">
                                        <div class="col-6">
                                            <div class="text-caption text-indigo-2 text-uppercase font-size-10 text-weight-bold">WhatsApp</div>
                                            <div class="text-subtitle1 text-weight-bold flex items-center no-line-height">
                                                <q-icon name="fab fa-whatsapp" size="14px" color="light-green-13" class="q-mr-xs" />
                                                {{ qrStudent?.contact }}
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="text-caption text-indigo-2 text-uppercase font-size-10 text-weight-bold">Institute</div>
                                            <div class="text-subtitle2 text-weight-medium text-indigo-1">
                                                {{ qrStudent?.school }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Bottom Decorative Accents -->
                    <div v-if="globalSettings.card_show_visuals" class="card-accents absolute-bottom-right">
                      <div class="accent-blob-1"></div>
                      <div class="accent-blob-2"></div>
                    </div>
                    <div v-if="globalSettings.card_show_visuals" class="card-pattern absolute-full" style="opacity: 0.1; pointer-events: none;"></div>
                </div>
                </div>
            </div>

            <q-card-actions align="center" class="q-py-md bg-white">
                <q-btn flat label="Close" color="grey-7" v-close-popup />
                <q-btn color="indigo-10" icon="download" label="Download Premium ID" unelevated @click="downloadCard" />
            </q-card-actions>
        </q-card>
    </q-dialog>

    <!-- Tutes Status Dialog -->
    <q-dialog v-model="showTutesDialog">
        <q-card style="width: 500px; max-width: 95vw; border-radius: 15px;">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Tutes Delivery: {{ tuteStudent?.name }}</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pa-md">
                <div v-if="availableTutes.length === 0" class="text-center q-pa-xl text-grey-6">
                    <q-icon name="description" size="48px" class="q-mb-md" />
                    <div>No tutorials found for this student's grade/subjects.</div>
                </div>
                <q-list v-else bordered separator class="rounded-borders">
                    <q-item v-for="tute in availableTutes" :key="tute.id">
                        <q-item-section>
                            <q-item-label class="text-weight-bold">{{ tute.title }}</q-item-label>
                            <q-item-label caption>{{ tute.subject_name }} | {{ tute.file_type }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <q-btn 
                                :color="isTuteReceived(tute.id) ? 'green' : 'grey-4'" 
                                :text-color="isTuteReceived(tute.id) ? 'white' : 'grey-9'"
                                :icon="isTuteReceived(tute.id) ? 'check_circle' : 'radio_button_unchecked'" 
                                :label="isTuteReceived(tute.id) ? 'Received' : 'Mark Received'" 
                                unelevated 
                                no-caps
                                size="sm"
                                :loading="tuteLoading === tute.id"
                                @click="toggleTuteStatus(tute.id)"
                            />
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-card-section>
            
            <q-card-actions align="right" class="q-pa-md">
                <q-btn flat label="Done" color="primary" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { client, tutes, studentTutes } from 'src/api'
import QrcodeVue from 'qrcode.vue'
import html2canvas from 'html2canvas'
import { useAppStore } from 'src/store/app'
import { useSubscriptionStore } from 'src/store/subscription'

const $q = useQuasar()
const appStore = useAppStore()
const subStore = useSubscriptionStore()
const filter = ref('')
const showDialog = ref(false)
const isEdit = ref(false)
const loading = ref(false)

// New Filter State
const selectedGrade = ref('All Grades')
const selectedSubject = ref('All Subjects')
const selectedStatus = ref('All Status')
const selectedSchool = ref('')
const gradeOptions = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13']

import { computed } from 'vue'

const filteredRows = computed(() => {
    return rows.value.filter(row => {
        const matchGrade = selectedGrade.value === 'All Grades' || row.grade === selectedGrade.value
        const matchStatus = selectedStatus.value === 'All Status' || row.status === selectedStatus.value
        const matchSchool = !selectedSchool.value || (row.school && row.school.toLowerCase().includes(selectedSchool.value.toLowerCase()))
        const matchSubject = selectedSubject.value === 'All Subjects' || (row.subjects && row.subjects.includes(selectedSubject.value))
        
        return matchGrade && matchStatus && matchSchool && matchSubject
    })
})

// Tute Tracking State
const showTutesDialog = ref(false)
const tuteStudent = ref(null)
const availableTutes = ref([])
const receivedTutes = ref([])
const tuteLoading = ref(null)

const openTutesDialog = async (student) => {
    tuteStudent.value = student
    showTutesDialog.value = true
    fetchAvailableTutes(student)
}

const fetchAvailableTutes = async (student) => {
    try {
        const [allTutes, studentTuteHistory] = await Promise.all([
            tutes.getAll({ grade: student.grade }),
            studentTutes.getAll({ student_id: student.id })
        ])
        
        // Filter tutes by student's subjects
        availableTutes.value = allTutes.filter(t => 
            student.subjects && student.subjects.includes(t.subject_name)
        )
        receivedTutes.value = studentTuteHistory.map(h => h.tute_id)
    } catch (e) {
        console.error('Error fetching tutes for student:', e)
    }
}

const isTuteReceived = (tuteId) => receivedTutes.value.includes(tuteId)

const toggleTuteStatus = async (tuteId) => {
    tuteLoading.value = tuteId
    try {
        if (isTuteReceived(tuteId)) {
            await studentTutes.remove(tuteStudent.value.id, tuteId)
            receivedTutes.value = receivedTutes.value.filter(id => id !== tuteId)
        } else {
            await studentTutes.markReceived(tuteStudent.value.id, tuteId)
            receivedTutes.value.push(tuteId)
        }
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to update status' })
    } finally {
        tuteLoading.value = null
    }
}

// QR State
const showQRDialog = ref(false)
const qrStudent = ref(null)
import { getStudentPortalUrl } from 'src/utils/url'

const getPortalUrl = (id) => {
    return getStudentPortalUrl(id)
}
const globalSettings = ref({
    card_background_url: '',
    card_theme_color: '#0d124d',
    card_layout_type: 'standard',
    card_show_visuals: 1
})

const fetchGlobalSettings = async () => {
    const data = await client.get('me')
    if (data) globalSettings.value = data
}

const pickedFile = ref(null)

const onFilePicked = async (file) => {
    if (!file) return
    
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target.result
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 800
                    const MAX_HEIGHT = 800
                    let width = img.width
                    let height = img.height
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }
                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx.drawImage(img, 0, 0, width, height)
                    resolve(canvas.toDataURL('image/jpeg', 0.8))
                }
            }
        })
    }

    try {
        $q.loading.show({ message: 'Processing photo...' })
        form.value.image_url = await compressImage(file)
    } catch (e) {
        console.error('Compression error:', e)
    } finally {
        $q.loading.hide()
    }
}

// Form Data
const form = ref({
  id: null,
  student_id: '',
  name: '',
  school: '',
  grade: '',
  contact: '',
  status: 'Active',
  image_url: '',
  color_theme: '#0d124d',
  layout_type: 'standard',
  show_visuals: 1,
  subjects: []
})

const subjectOptions = ref([])

const fetchSubjects = async () => {
    try {
        // This endpoint should be added to the worker as well
        const data = await client.get('subjects')
        if (data) subjectOptions.value = data.map(s => s.name)
    } catch {
        console.warn('Could not fetch subjects')
    }
}


const columns = [
  { name: 'student_id', align: 'left', label: 'Student ID', field: 'student_id', sortable: true },
  { name: 'name', align: 'left', label: 'Name', field: 'name', sortable: true },
  { name: 'school', align: 'left', label: 'Institute', field: 'school', sortable: true },
  { name: 'grade', align: 'left', label: 'Grade', field: 'grade', sortable: true },
  { name: 'contact', align: 'left', label: 'WhatsApp Number', field: 'contact' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', sortable: true },
  { name: 'actions', align: 'right', label: 'Actions', field: 'actions' }
]

const rows = ref([])

onMounted(() => {
    fetchStudents()
    fetchSubjects()
    fetchGlobalSettings()
})

const fetchStudents = async () => {
    loading.value = true
    try {
        const data = await client.get('students')
        rows.value = data || []
    } catch (error) {
        console.error('Error fetching students:', error)
        $q.notify({ 
            type: 'negative', 
            message: 'Failed to load list: ' + (error.message || 'Unknown error'),
            actions: [{ label: 'Retry', handler: () => fetchStudents() }]
        })
    } finally {
        loading.value = false
    }
}

// Actions
const generateQR = (student) => {
    qrStudent.value = student
    showQRDialog.value = true
}

const downloadCard = async () => {
    const card = document.getElementById('student-id-card')
    if (!card) return
    
    $q.loading.show({
        message: 'Generating ID Card...'
    })

    try {
        const canvas = await html2canvas(card, {
            scale: 3, // Higher resolution
            useCORS: true,
            backgroundColor: null,
            width: 500,
            height: 280,
            onclone: (clonedDoc) => {
                const clonedCard = clonedDoc.getElementById('student-id-card')
                if (clonedCard) {
                    clonedCard.style.transform = 'none'
                    clonedCard.style.margin = '0'
                }
            }
        })
        
        const link = document.createElement('a')
        link.download = `ID_${qrStudent.value.student_id}_${qrStudent.value.name}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        
        $q.notify({
            type: 'positive',
            message: 'ID Card downloaded successfully',
            icon: 'download'
        })
    } catch (error) {
        console.error('Error generating card:', error)
        $q.notify({
            type: 'negative',
            message: 'Failed to generate ID card'
        })
    } finally {
        $q.loading.hide()
    }
}

const openAddDialog = () => {
    if (!subStore.canAddStudent(rows.value.length)) {
        $q.notify({
            type: 'negative',
            icon: 'lock',
            message: `Student limit reached for your ${subStore.currentPackage.name} (Max ${subStore.studentLimit} students). Please upgrade your plan!`,
            actions: [{ label: 'Upgrade', color: 'yellow', handler: () => $q.dialog({ title: 'Upgrade Required', message: 'Go to Packages & Pricing to upgrade your plan.', ok: { label: 'Open Pricing', color: 'indigo' } }).onOk(() => {}) }],
            timeout: 6000
        })
        return
    }
    isEdit.value = false
    const nextId = 'ST-2026' + Math.floor(Math.random() * 10000)
    form.value = { id: null, student_id: nextId, name: '', school: '', grade: '', contact: '', status: 'Active', photo_url: '', subjects: [] }
    showDialog.value = true
}

const openEditDialog = (row) => {
    isEdit.value = true
    form.value = { ...row, subjects: row.subjects || [] }
    showDialog.value = true
}

const saveStudent = async () => {
    loading.value = true
    
    const studentData = {
        student_id: form.value.student_id,
        name: form.value.name,
        school: form.value.school,
        grade: form.value.grade,
        contact: form.value.contact,
        status: form.value.status,
        subjects: form.value.subjects,
        image_url: form.value.image_url,
        color_theme: form.value.color_theme,
        layout_type: form.value.layout_type,
        show_visuals: form.value.show_visuals ? 1 : 0
    }

    try {
        if (isEdit.value && form.value.id) {
            await client.put(`students/${form.value.id}`, studentData)
        } else {
            await client.post('students', studentData)
        }
        $q.notify({ type: 'positive', message: isEdit.value ? 'Student updated' : 'Student added' })
        showDialog.value = false
        fetchStudents()
    } catch (error) {
        console.error('Error saving student:', error)
        $q.notify({ type: 'negative', message: 'Error saving student' })
    } finally {
        loading.value = false
    }
}

const deleteStudent = (id) => {
    $q.dialog({
        title: 'Confirm',
        message: 'Are you sure you want to delete this student?',
        cancel: true,
        persistent: true
    }).onOk(async () => {
        loading.value = true
        try {
            await client.delete(`students/${id}`)
            $q.notify({ type: 'positive', message: 'Student deleted successfully' })
            fetchStudents()
        } catch (error) {
            console.error('Error deleting student:', error)
            $q.notify({ type: 'negative', message: `Error deleting student: ${error.message}` })
        } finally {
            loading.value = false
        }
    })
}

</script>

<style scoped>
.color-swatch-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.ring-2 { box-shadow: 0 0 0 2px #3f51b5 !important; }

.student-card {
  width: 500px;
  height: 280px;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  background: #0d124d;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.card-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #0d124d 0%, #1a237e 50%, #283593 100%);
  z-index: 0;
}

.card-content {
  z-index: 2;
}

.qr-wrapper {
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.letter-spacing-2 {
  letter-spacing: 2px;
}

.text-weight-bolder {
  font-weight: 800;
}

.text-shadow-sm {
  text-shadow: 0 3px 6px rgba(0,0,0,0.4);
}

.font-size-10 {
  font-size: 10px;
}

.accent-blob-1 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(63, 81, 181, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  position: absolute;
  bottom: -150px;
  right: -100px;
  z-index: 1;
}

.accent-blob-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  border-radius: 50%;
  position: absolute;
  top: -100px;
  left: -50px;
  z-index: 1;
}

.card-pattern {
  background-image: 
    radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 20px 20px, 40px 40px, 40px 40px;
}

.id-card-container {
    perspective: 1000px;
}

.photo-wrapper-premium {
    width: 120px;
    height: 120px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    overflow: hidden;
}

.photo-inner {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    background: #1a237e;
}

.student-photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.mini-qr {
    transform: scale(0.9);
    transform-origin: left center;
}

.no-line-height {
    line-height: normal;
}

#student-id-card {
    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    margin: 0 auto;
}

#student-id-card:hover {
    transform: translateY(-10px) rotateX(4deg) rotateY(-2deg);
    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
}

.id-card-scale-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: visible;
}

@media (max-width: 540px) {
    .id-card-scale-wrapper {
        height: 220px; /* Reduced height to account for scaling */
        padding: 0;
    }
    
    .student-card {
        transform: scale(0.65); /* Scale down to fit mobile screens */
        transform-origin: center center;
        flex-shrink: 0;
    }
    
    .id-card-container {
        max-width: 95vw !important;
    }
}

/* Ensure high quality rendering for QR canvas */
#qr-canvas-full {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
}
</style>
