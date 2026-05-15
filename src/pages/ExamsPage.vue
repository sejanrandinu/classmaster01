<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 text-weight-bold text-grey-9 q-mb-none">Exams & Results</h1>
        <p class="text-grey-6">Track student performance and manage exam records.</p>
      </div>
      <q-btn color="primary" icon="add" label="New Exam" unelevated no-caps @click="openExamDialog" />
    </div>

    <!-- Exams List -->
    <div v-if="examsList.length === 0 && !loading" class="flex flex-center bg-white rounded-borders q-pa-xl border-grey">
        <div class="text-center">
            <q-icon name="assignment" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">No exams recorded yet</div>
            <p class="text-grey-5">Create your first exam to start tracking student marks.</p>
            <q-btn color="primary" label="New Exam" unelevated no-caps class="q-mt-sm" @click="openExamDialog" />
        </div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div v-for="exam in examsList" :key="exam.id" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="rounded-borders hover-shadow transition">
          <q-card-section>
            <div class="row justify-between items-start">
              <div>
                <div class="text-h6 text-weight-bold">{{ exam.title }}</div>
                <div class="text-caption text-primary text-weight-bold">{{ exam.class_name }} | {{ exam.subject_name }}</div>
              </div>
              <q-btn flat round dense icon="more_vert">
                <q-menu auto-close>
                  <q-list style="min-width: 100px">
                    <q-item clickable @click="editExam(exam)">
                      <q-item-section avatar><q-icon name="edit" size="20px" /></q-item-section>
                      <q-item-section>Edit</q-item-section>
                    </q-item>
                    <q-item clickable class="text-red" @click="confirmDeleteExam(exam.id)">
                      <q-item-section avatar><q-icon name="delete" size="20px" color="red" /></q-item-section>
                      <q-item-section>Delete</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
            
            <div class="q-mt-md row items-center text-grey-7">
              <q-icon name="event" size="16px" class="q-mr-xs" />
              <span>{{ exam.date }}</span>
              <q-separator vertical class="q-mx-md" />
              <q-icon name="grade" size="16px" class="q-mr-xs" />
              <span>Max: {{ exam.max_marks }}</span>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat color="primary" label="Enter Marks" icon="edit_note" no-caps @click="enterMarks(exam)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Exam Dialog -->
    <q-dialog v-model="examDialog" persistent>
      <q-card style="width: 450px; max-width: 95vw; border-radius: 12px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEdit ? 'Edit Exam' : 'New Exam' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveExam" class="q-gutter-md">
            <q-input outlined v-model="form.title" label="Exam Title" placeholder="e.g. Monthly Test - May" :rules="[val => !!val || 'Title required']" />
            
            <div class="row q-col-gutter-sm">
                <div class="col-12">
                    <q-select 
                        outlined 
                        v-model="form.class_id" 
                        :options="classOptions" 
                        option-label="name" 
                        option-value="id" 
                        emit-value 
                        map-options
                        label="Select Class"
                        :rules="[val => !!val || 'Class required']"
                    />
                </div>
                <div class="col-12 col-sm-6">
                    <q-input outlined v-model="form.subject_name" label="Subject" placeholder="e.g. Mathematics" />
                </div>
                <div class="col-12 col-sm-6">
                    <q-input outlined v-model="form.max_marks" type="number" label="Max Marks" />
                </div>
            </div>

            <q-input outlined v-model="form.date" type="date" label="Exam Date" :rules="[val => !!val || 'Date required']" />

            <div class="row justify-end q-mt-lg">
              <q-btn label="Cancel" flat v-close-popup class="q-mr-sm" />
              <q-btn :label="isEdit ? 'Update' : 'Create'" type="submit" color="primary" unelevated :loading="saving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Marks Entry Dialog -->
    <q-dialog v-model="marksDialog" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-1">
        <q-bar class="bg-primary text-white q-py-lg">
          <div class="text-h6">{{ activeExam?.title }} - Marks Entry</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="q-pa-md">
            <div class="container-md">
                <div class="row q-col-gutter-md">
                    <div class="col-12">
                        <q-card flat bordered class="rounded-borders q-pa-md bg-white">
                            <div class="row items-center justify-between">
                                <div>
                                    <div class="text-h5 text-weight-bold text-grey-9">{{ activeExam?.title }}</div>
                                    <div class="text-subtitle2 text-grey-6">{{ activeExam?.class_name }} | Max Marks: {{ activeExam?.max_marks }}</div>
                                </div>
                                <div class="row q-gutter-sm">
                                    <q-btn outline color="primary" icon="download" label="Export Template" no-caps />
                                    <q-btn color="green-7" icon="save" label="Save All Marks" unelevated no-caps @click="saveMarks" :loading="savingMarks" />
                                </div>
                            </div>
                        </q-card>
                    </div>

                    <div class="col-12">
                        <q-card flat bordered class="rounded-borders bg-white overflow-hidden">
                            <q-table
                                flat
                                :rows="marksRows"
                                :columns="marksColumns"
                                row-key="student_id"
                                :pagination="{ rowsPerPage: 0 }"
                                hide-bottom
                            >
                                <template v-slot:body-cell-marks="props">
                                    <q-td :props="props" style="width: 150px">
                                        <q-input 
                                            dense 
                                            outlined 
                                            v-model.number="props.row.marks_obtained" 
                                            type="number"
                                            :max="activeExam?.max_marks"
                                            min="0"
                                            class="text-weight-bold"
                                            :bg-color="getGroupColor(props.row.marks_obtained, activeExam?.max_marks, true)"
                                        >
                                            <template v-slot:append>
                                                <span class="text-caption text-grey-6">/{{ activeExam?.max_marks }}</span>
                                            </template>
                                        </q-input>
                                    </q-td>
                                </template>

                                <template v-slot:body-cell-group="props">
                                    <q-td :props="props">
                                        <q-chip 
                                            v-if="props.row.marks_obtained !== null && props.row.marks_obtained !== undefined"
                                            :color="getGroupColor(props.row.marks_obtained, activeExam?.max_marks)" 
                                            text-color="white" 
                                            size="sm"
                                            class="text-weight-bold"
                                        >
                                            {{ getGroupName(props.row.marks_obtained, activeExam?.max_marks) }}
                                        </q-chip>
                                        <span v-else class="text-grey-4">-</span>
                                    </q-td>
                                </template>

                                <template v-slot:body-cell-remarks="props">
                                    <q-td :props="props">
                                        <q-input dense borderless v-model="props.row.remarks" placeholder="Add remark..." />
                                    </q-td>
                                </template>

                                <template v-slot:body-cell-notify="props">
                                    <q-td :props="props" class="text-center">
                                        <q-btn 
                                            v-if="props.row.marks_obtained !== null"
                                            flat 
                                            round 
                                            color="green-7" 
                                            icon="fa-brands fa-whatsapp" 
                                            size="sm"
                                            @click="sendMarksWA(props.row)"
                                        >
                                            <q-tooltip>Notify Results via WhatsApp</q-tooltip>
                                        </q-btn>
                                        <div v-else class="text-grey-4">-</div>
                                    </q-td>
                                </template>
                            </q-table>
                        </q-card>
                    </div>
                </div>
            </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { exams, examResults, client } from 'src/api'
import { notificationService } from 'src/utils/notifications'
import { useAppStore } from 'src/store/app'

const $q = useQuasar()
const appStore = useAppStore()
const loading = ref(false)
const saving = ref(false)
const savingMarks = ref(false)
const examsList = ref([])
const classOptions = ref([])

const examDialog = ref(false)
const isEdit = ref(false)
const form = ref({
  id: null,
  title: '',
  class_id: null,
  subject_name: '',
  date: '',
  max_marks: 100
})

const marksDialog = ref(false)
const activeExam = ref(null)
const marksRows = ref([])

const marksColumns = [
    { name: 'id', label: 'ID', field: 'student_id_str', align: 'left', sortable: true },
    { name: 'name', label: 'Student Name', field: 'student_name', align: 'left', sortable: true },
    { name: 'marks', label: 'Marks Obtained', field: 'marks_obtained', align: 'center' },
    { name: 'group', label: 'Group', align: 'center' },
    { name: 'remarks', label: 'Remarks', field: 'remarks', align: 'left' },
    { name: 'notify', label: 'Notify', align: 'center' }
]

onMounted(() => {
  fetchExams()
  fetchClasses()
})

const fetchExams = async () => {
  loading.value = true
  try {
    examsList.value = await exams.getAll()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to fetch exams' })
  } finally {
    loading.value = false
  }
}

const fetchClasses = async () => {
    try {
        classOptions.value = await client.get('classes')
    } catch { /* ignore */ }
}

const openExamDialog = () => {
  isEdit.value = false
  form.value = { id: null, title: '', class_id: null, subject_name: '', date: new Date().toISOString().split('T')[0], max_marks: 100 }
  examDialog.value = true
}

const editExam = (exam) => {
  isEdit.value = true
  form.value = { ...exam }
  examDialog.value = true
}

const saveExam = async () => {
  saving.value = true
  try {
    if (isEdit.value) {
      await exams.update(form.value.id, form.value)
    } else {
      await exams.create(form.value)
    }
    $q.notify({ type: 'positive', message: `Exam ${isEdit.value ? 'updated' : 'created'} successfully` })
    examDialog.value = false
    fetchExams()
  } catch {
    $q.notify({ type: 'negative', message: 'Error saving exam' })
  } finally {
    saving.value = false
  }
}

const confirmDeleteExam = (id) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: 'All marks recorded for this exam will also be deleted. Proceed?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await exams.delete(id)
      $q.notify({ type: 'positive', message: 'Exam deleted' })
      fetchExams()
    } catch {
      $q.notify({ type: 'negative', message: 'Delete failed' })
    }
  })
}

const enterMarks = async (exam) => {
    activeExam.value = exam
    $q.loading.show({ message: 'Loading students and existing marks...' })
    try {
        // 1. Fetch students in this class
        const students = await client.get(`students?class_id=${exam.class_id}`)
        
        // 2. Fetch existing marks for this exam
        const existingMarks = await examResults.getAll({ exam_id: exam.id })
        
        // 3. Map students to rows
        marksRows.value = students.map(s => {
            const mark = existingMarks.find(m => m.student_id === s.id)
            return {
                student_id: s.id,
                student_name: s.name,
                student_id_str: s.student_id,
                contact: s.contact,
                marks_obtained: mark ? mark.marks_obtained : null,
                remarks: mark ? mark.remarks : ''
            }
        })
        
        marksDialog.value = true
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to load marks entry data' })
    } finally {
        $q.loading.hide()
    }
}

const saveMarks = async () => {
    savingMarks.value = true
    try {
        // Only save rows with marks
        const resultsToSave = marksRows.value.filter(r => r.marks_obtained !== null && r.marks_obtained !== undefined)
        await examResults.upsert({
            exam_id: activeExam.value.id,
            results: resultsToSave
        })
        $q.notify({ type: 'positive', message: 'All marks saved successfully!' })
        notificationService.send('Marks Saved', { body: `Results for ${activeExam.value.title} have been updated.` })
        marksDialog.value = false
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to save marks' })
    } finally {
        savingMarks.value = false
    }
}

const sendMarksWA = async (row) => {
    if (!appStore.whatsappEnabled) return
    if (!row.contact) {
        $q.notify({ type: 'warning', message: 'Student contact not found' })
        return
    }

    let phone = row.contact
    if (phone.startsWith('0')) phone = '94' + phone.substring(1)
    phone = phone.replace(/\D/g, '')

    const portalLink = `${window.location.origin}/#/student-portal?id=${row.student_id_str}`
    const group = getGroupName(row.marks_obtained, activeExam.value.max_marks)
    const message = `ආයුබෝවන් ${row.student_name}, ${activeExam.value.title} විභාගයේ ප්‍රතිඵල නිකුත් කර ඇත.

Marks: ${row.marks_obtained}/${activeExam.value.max_marks}
Status: ${group}

ඔබේ සියලුම ප්‍රතිඵල සහ වාර්තා මෙතැනින් බලන්න: ${portalLink}

ස්තූතියි!`

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
}

const getGroupColor = (marks, maxMarks, isBg = false) => {
    if (marks === null || marks === undefined) return isBg ? 'white' : 'grey'
    const percentage = (marks / maxMarks) * 100
    if (percentage >= 75) return isBg ? 'green-1' : 'green-7'
    if (percentage >= 65) return isBg ? 'yellow-1' : 'yellow-8'
    if (percentage >= 55) return isBg ? 'blue-1' : 'blue-7'
    return isBg ? 'red-1' : 'red-7'
}

const getGroupName = (marks, maxMarks) => {
    if (marks === null || marks === undefined) return 'N/A'
    const percentage = (marks / maxMarks) * 100
    if (percentage >= 75) return 'Green (Elite)'
    if (percentage >= 65) return 'Yellow (Good)'
    if (percentage >= 55) return 'Blue (Average)'
    return 'Red (Needs Focus)'
}
</script>

<style scoped>
.hover-shadow:hover {
  box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
  transform: translateY(-2px);
}
.transition {
  transition: all 0.3s ease;
}
</style>
