<template>
  <q-page class="q-pa-lg bg-indigo-50">
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h3 text-weight-bold text-indigo-10 q-my-none flex items-center">
          <q-icon name="assignment" class="q-mr-md text-primary" />
          Exams & Results
        </h1>
        <p class="text-grey-7 q-mt-sm text-subtitle1">Track student performance, manage sub-subjects, and approve tutor drafts.</p>
      </div>
      <div class="row q-gutter-sm items-center">
        <q-btn-toggle
          v-model="sortOrder"
          toggle-color="indigo"
          no-caps
          dense
          unelevated
          :options="[
            { label: '📅 Oldest First', value: 'asc' },
            { label: '📅 Newest First', value: 'desc' }
          ]"
          class="rounded-button"
        />
        <q-btn color="primary" icon="add" label="New Exam" unelevated no-caps class="rounded-button q-px-md" @click="openExamDialog" />
      </div>
    </div>

    <!-- Exams List -->
    <div v-if="examsList.length === 0 && !loading" class="flex flex-center bg-white rounded-borders q-pa-xl shadow-2">
        <div class="text-center">
            <q-icon name="assignment" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">No exams recorded yet</div>
            <p class="text-grey-5">Create your first exam to start tracking student marks.</p>
            <q-btn color="primary" label="New Exam" unelevated no-caps class="q-mt-sm rounded-button" @click="openExamDialog" />
        </div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div v-for="exam in sortedExams" :key="exam.id" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="rounded-borders hover-shadow transition glass-card">
          <q-card-section>
            <div class="row justify-between items-start">
              <div>
                <div class="text-h6 text-weight-bold text-indigo-10">{{ exam.title }}</div>
                <div class="text-caption text-primary text-weight-bold">{{ exam.class_name }} | {{ exam.subject_name }}</div>
              </div>
              <q-btn flat round dense icon="more_vert" color="grey-7">
                <q-menu auto-close class="rounded-borders shadow-3">
                  <q-list style="min-width: 120px">
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
              <q-separator vertical class="q-mx-md" />
              <q-icon name="emoji_events" size="16px" class="q-mr-xs" />
              <span>Pass: {{ exam.certificate_cutoff ?? 50 }}</span>
            </div>

            <!-- Draft marks badge -->
            <div v-if="exam.draft_count > 0" class="q-mt-sm">
              <q-chip dense color="amber-2" text-color="amber-9" icon="edit_note" class="text-weight-bold">
                {{ exam.draft_count }} tutor draft{{ exam.draft_count === 1 ? '' : 's' }} pending
              </q-chip>
            </div>

            <!-- Sub subjects tags -->
            <div v-if="parseSubSubjects(exam.sub_subjects_json).length > 0" class="q-mt-md row q-gutter-xs">
              <q-chip 
                v-for="(ss, idx) in parseSubSubjects(exam.sub_subjects_json)" 
                :key="idx" 
                dense 
                outline 
                color="indigo" 
                text-color="indigo" 
                size="sm"
              >
                {{ ss.name }} ({{ ss.max }})
              </q-chip>
            </div>
          </q-card-section>

          <q-separator style="background-color: rgba(224, 224, 224, 0.3)" />

          <q-card-actions align="right" class="q-px-md q-py-sm">
            <q-btn flat color="primary" label="Enter Marks" icon="edit_note" no-caps class="rounded-button" @click="enterMarks(exam)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Exam Dialog (Create / Edit) -->
    <q-dialog v-model="examDialog" persistent>
      <q-card style="width: 500px; max-width: 95vw; border-radius: 16px;" class="glass-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-indigo-10 text-weight-bold">{{ isEdit ? 'Edit Exam' : 'New Exam' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="grey-6" />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="saveExam" class="q-gutter-md">
            <q-input outlined dense v-model="form.title" label="Exam Title" placeholder="e.g. Monthly Test - May" :rules="[val => !!val || 'Title required']" />
            
            <div class="row q-col-gutter-sm">
                <div class="col-12">
                    <q-select 
                        outlined 
                        dense
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
                    <q-input outlined dense v-model="form.subject_name" label="Subject" placeholder="e.g. Mathematics" />
                </div>
                <div class="col-12 col-sm-6">
                    <q-input 
                      outlined 
                      dense 
                      v-model.number="form.max_marks" 
                      type="number" 
                      label="Max Marks" 
                      :disable="form.sub_subjects.length > 0"
                      hint="Calculated automatically if sub-subjects exist"
                    />
                </div>
            </div>

            <q-input outlined dense v-model="form.date" type="date" label="Exam Date" :rules="[val => !!val || 'Date required']" />

            <!-- Certificate Pass Mark -->
            <q-input 
              outlined 
              dense 
              v-model.number="form.certificate_cutoff"
              type="number"
              label="Certificate Pass Mark"
              hint="Minimum marks needed to qualify for an achievement certificate"
              min="0"
              :max="form.max_marks"
            >
              <template v-slot:prepend>
                <q-icon name="emoji_events" color="amber-7" />
              </template>
            </q-input>

            <!-- Sub Subjects List Builder -->
            <div class="border-indigo-light q-pa-md rounded-borders q-mt-sm">
              <div class="row justify-between items-center q-mb-sm">
                <div class="text-subtitle2 text-indigo-10 text-weight-bold">Sub-Subjects (Optional)</div>
                <q-btn size="sm" color="indigo" icon="add" label="Add Sub-Subject" flat no-caps @click="addSubSubjectField" />
              </div>

              <div v-if="form.sub_subjects.length === 0" class="text-caption text-grey-6 text-center q-py-sm">
                No sub-subjects defined. Marks will be entered as a single score.
              </div>

              <div v-for="(ss, idx) in form.sub_subjects" :key="idx" class="row q-col-gutter-xs items-center q-mb-xs">
                <div class="col-7">
                  <q-input outlined dense v-model="ss.name" label="Sub-Subject Name" placeholder="e.g. Theory" size="sm" :rules="[val => !!val || 'Name required']" hide-bottom-space />
                </div>
                <div class="col-4">
                  <q-input outlined dense v-model.number="ss.max" type="number" label="Max" @update:model-value="recalculateExamMax" :rules="[val => !!val && val > 0 || 'Required']" hide-bottom-space />
                </div>
                <div class="col-1 text-center">
                  <q-btn flat round dense color="red" icon="delete" size="sm" @click="removeSubSubjectField(idx)" />
                </div>
              </div>
            </div>

            <div class="row justify-end q-mt-xl">
              <q-btn label="Cancel" flat v-close-popup class="q-mr-sm rounded-button" />
              <q-btn :label="isEdit ? 'Update' : 'Create'" type="submit" color="primary" unelevated :loading="saving" class="rounded-button" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Marks Entry Dialog (Maximized Glassmorphism Drawer) -->
    <q-dialog v-model="marksDialog" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-indigo-50">
        <q-bar class="bg-indigo-900 text-white q-py-lg">
          <q-icon name="assignment" class="q-mr-sm" />
          <div class="text-h6 text-weight-bold">{{ activeExam?.title }} - Marks Entry</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup color="white">
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="q-pa-lg">
            <div class="container-xl">
                <!-- Info Header and Alerts -->
                <div class="row q-col-gutter-md q-mb-lg">
                    <div class="col-12">
                        <q-card class="glass-card shadow-3 q-pa-md bg-white">
                            <div class="row items-center justify-between q-col-gutter-sm">
                                <div>
                                    <div class="text-h4 text-weight-bold text-indigo-10">{{ activeExam?.title }}</div>
                                    <div class="text-subtitle1 text-grey-7">
                                        {{ activeExam?.class_name }} | Max Marks: <span class="text-indigo-9 text-weight-bold">{{ activeExam?.max_marks }}</span>
                                        <span v-if="activeExam?.subSubjects?.length > 0" class="text-caption text-grey-6 q-ml-sm">
                                            (Breakdown: {{ activeExam.subSubjects.map(s => `${s.name}: ${s.max}`).join(', ') }})
                                        </span>
                                    </div>
                                </div>
                                <div class="row q-gutter-sm">
                                    <q-btn v-if="hasTutorDrafts" color="indigo-10" icon="copy_all" label="Prefill from Tutor Drafts" unelevated no-caps class="rounded-button" @click="prefillFromTutorDrafts">
                                      <q-tooltip>Copies all draft marks entered by teachers into official scores</q-tooltip>
                                    </q-btn>
                                    <q-btn outline color="primary" icon="download" label="Export Marks" no-caps class="rounded-button" @click="exportMarks" />
                                    <q-btn color="green-7" icon="save" label="Save All Marks" unelevated no-caps class="rounded-button q-px-md" @click="saveMarks" :loading="savingMarks" />
                                </div>
                            </div>
                        </q-card>
                    </div>

                    <!-- Notice banner if tutor drafts are present -->
                    <div v-if="hasTutorDrafts" class="col-12">
                      <q-banner dense inline-actions class="bg-amber-1 text-amber-9 border-amber rounded-borders q-py-sm">
                        <template v-slot:avatar>
                          <q-icon name="warning" color="amber-9" />
                        </template>
                        <span class="text-weight-medium">
                          The tutor has submitted draft marks. Click the "Prefill from Tutor Drafts" button to copy their scores instantly, or review each draft entry under the students' rows.
                        </span>
                      </q-banner>
                    </div>
                </div>

                <!-- Marks Table -->
                <div class="row">
                    <div class="col-12">
                        <q-card class="glass-card shadow-3 overflow-hidden rounded-borders bg-white">
                            <q-table
                                flat
                                :rows="marksRows"
                                :columns="marksColumns"
                                row-key="student_id"
                                :pagination="{ rowsPerPage: 0 }"
                                hide-bottom
                                class="custom-glass-table text-indigo-10"
                            >
                                <!-- Dynamic Sub Subject inputs -->
                                <template v-slot:[`body-cell-sub_subject_${idx}`]="props" v-for="(ss, idx) in (activeExam?.subSubjects || [])" :key="'sub-subject-' + idx">
                                  <q-td :props="props" style="width: 130px">
                                      <q-input 
                                          dense 
                                          outlined 
                                          v-model.number="props.row.sub_marks[ss.name]" 
                                          type="number"
                                          :max="ss.max"
                                          min="0"
                                          class="text-weight-bold text-center"
                                          bg-color="indigo-50"
                                          @update:model-value="calculateTotalMark(props.row)"
                                      >
                                          <template v-slot:append>
                                              <span class="text-caption text-grey-5">/{{ ss.max }}</span>
                                          </template>
                                      </q-input>
                                      <!-- Tutor draft sub mark -->
                                      <div v-if="props.row.tutor_sub_marks?.[ss.name] !== undefined" class="text-caption text-indigo-8 text-weight-bold text-center q-mt-xs">
                                        Draft: {{ props.row.tutor_sub_marks[ss.name] }}
                                      </div>
                                  </q-td>
                                </template>

                                <!-- Total Marks obtained input -->
                                <template v-slot:body-cell-marks="props">
                                    <q-td :props="props" style="width: 160px">
                                        <q-input 
                                            dense 
                                            outlined 
                                            v-model.number="props.row.marks_obtained" 
                                            type="number"
                                            :max="activeExam?.max_marks"
                                            min="0"
                                            class="text-weight-bold text-center"
                                            :bg-color="getGroupColor(props.row.marks_obtained, activeExam?.max_marks, true)"
                                            :disable="activeExam?.subSubjects?.length > 0"
                                        >
                                            <template v-slot:append>
                                                <span class="text-caption text-grey-6">/{{ activeExam?.max_marks }}</span>
                                            </template>
                                        </q-input>
                                        <!-- Tutor draft total marks -->
                                        <div v-if="props.row.tutor_marks !== null" class="text-caption text-indigo-8 text-weight-bold text-center q-mt-xs">
                                          Draft: {{ props.row.tutor_marks }}
                                        </div>
                                    </q-td>
                                </template>

                                <template v-slot:body-cell-group="props">
                                    <q-td :props="props" class="text-center">
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
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { exams, examResults, client } from 'src/api'
import { notificationService } from 'src/utils/notifications'
import { useAppStore } from 'src/store/app'
import { exportToCSV } from 'src/utils/export'

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
  max_marks: 100,
  sub_subjects: [],
  certificate_cutoff: 50
})

const sortOrder = ref('asc')

const sortedExams = computed(() => {
  const list = [...examsList.value]
  return list.sort((a, b) => {
    const da = new Date(a.date), db = new Date(b.date)
    return sortOrder.value === 'asc' ? da - db : db - da
  })
})

const marksDialog = ref(false)
const activeExam = ref(null)
const marksRows = ref([])

// Dynamic columns compute
const marksColumns = computed(() => {
    const cols = [
        { name: 'id', label: 'ID', field: 'student_id_str', align: 'left', sortable: true },
        { name: 'name', label: 'Student Name', field: 'student_name', align: 'left', sortable: true }
    ]

    const subSubs = activeExam.value?.subSubjects || []
    subSubs.forEach((ss, idx) => {
        cols.push({
            name: `sub_subject_${idx}`,
            label: `${ss.name} (${ss.max})`,
            align: 'center'
        })
    })

    cols.push({ name: 'marks', label: 'Total Marks Obtained', field: 'marks_obtained', align: 'center' })
    cols.push({ name: 'group', label: 'Group', align: 'center' })
    cols.push({ name: 'remarks', label: 'Remarks', field: 'remarks', align: 'left' })
    cols.push({ name: 'notify', label: 'Notify', align: 'center' })

    return cols
})

const hasTutorDrafts = computed(() => {
  return marksRows.value.some(r => r.tutor_marks !== null && r.tutor_marks > 0)
})

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

const parseSubSubjects = (jsonStr) => {
  if (!jsonStr) return []
  try {
    return JSON.parse(jsonStr)
  } catch {
    return []
  }
}

const addSubSubjectField = () => {
  form.value.sub_subjects.push({ name: '', max: 50 })
  recalculateExamMax()
}

const removeSubSubjectField = (idx) => {
  form.value.sub_subjects.splice(idx, 1)
  recalculateExamMax()
}

const recalculateExamMax = () => {
  if (form.value.sub_subjects.length > 0) {
    let total = 0
    form.value.sub_subjects.forEach(ss => {
      total += Number(ss.max || 0)
    })
    form.value.max_marks = total
  }
}

const openExamDialog = () => {
  isEdit.value = false
  form.value = { 
    id: null, 
    title: '', 
    class_id: null, 
    subject_name: '', 
    date: new Date().toISOString().split('T')[0], 
    max_marks: 100,
    sub_subjects: [],
    certificate_cutoff: 50
  }
  examDialog.value = true
}

const editExam = (exam) => {
  isEdit.value = true
  let sub_subjects = []
  try {
    sub_subjects = JSON.parse(exam.sub_subjects_json || '[]')
  } catch {
    sub_subjects = []
  }
  form.value = { 
    ...exam,
    sub_subjects,
    certificate_cutoff: exam.certificate_cutoff ?? 50
  }
  examDialog.value = true
}

const saveExam = async () => {
  saving.value = true
  try {
    const payload = {
      id: form.value.id,
      title: form.value.title,
      class_id: form.value.class_id,
      subject_name: form.value.subject_name,
      date: form.value.date,
      max_marks: form.value.max_marks,
      sub_subjects: form.value.sub_subjects,
      certificate_cutoff: form.value.certificate_cutoff ?? 50
    }
    
    if (isEdit.value) {
      await exams.update(form.value.id, payload)
    } else {
      await exams.create(payload)
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
    let subSubs = []
    try {
      subSubs = JSON.parse(exam.sub_subjects_json || '[]')
    } catch {
      subSubs = []
    }
    
    activeExam.value = {
      ...exam,
      subSubjects: subSubs
    }
    
    $q.loading.show({ message: 'Loading students and existing marks...' })
    try {
        // 1. Fetch students in this class
        const students = await client.get(`students?class_id=${exam.class_id}`)
        
        // 2. Fetch existing marks for this exam
        const existingMarks = await examResults.getAll({ exam_id: exam.id })
        
        // 3. Map students to rows
        marksRows.value = students.map(s => {
            const mark = existingMarks.find(m => m.student_id === s.id)
            
            // Populate sub marks (fallback to tutor_sub_marks if sub_marks is empty)
            const sub_marks = {}
            subSubs.forEach(ss => {
              const val = mark?.sub_marks?.[ss.name] ?? mark?.tutor_sub_marks?.[ss.name]
              sub_marks[ss.name] = (val !== undefined && val !== null) ? val : null
            })
            
            // Effective score: official marks if set, otherwise tutor draft marks
            const initialMarks = mark ? (mark.marks_obtained !== null && mark.marks_obtained !== undefined && mark.marks_obtained > 0 ? mark.marks_obtained : (mark.tutor_marks ?? null)) : null

            return {
                student_id: s.id,
                student_name: s.name,
                student_id_str: s.student_id,
                contact: s.contact,
                marks_obtained: initialMarks,
                sub_marks,
                tutor_marks: mark ? mark.tutor_marks : null,
                tutor_sub_marks: mark ? (mark.tutor_sub_marks || {}) : {},
                remarks: mark ? mark.remarks : ''
            }
        })
        
        marksDialog.value = true
    } catch (e) {
        console.error(e)
        $q.notify({ type: 'negative', message: 'Failed to load marks entry data' })
    } finally {
        $q.loading.hide()
    }
}

const calculateTotalMark = (row) => {
    const subSubs = activeExam.value?.subSubjects || []
    if (subSubs.length > 0) {
        let total = 0
        let hasValue = false
        subSubs.forEach(ss => {
            const m = row.sub_marks[ss.name]
            if (m !== null && m !== undefined && m !== '') {
              total += Number(m)
              hasValue = true
            }
        })
        row.marks_obtained = hasValue ? total : null
    }
}

const prefillFromTutorDrafts = () => {
  marksRows.value.forEach(row => {
    if (row.tutor_marks !== null && row.tutor_marks !== undefined) {
      row.marks_obtained = row.tutor_marks
      row.sub_marks = { ...row.tutor_sub_marks }
    }
  })
  $q.notify({
    type: 'positive',
    message: 'Official marks prefilled from Tutor Drafts. Review and click Save.'
  })
}

const saveMarks = async () => {
    savingMarks.value = true
    try {
        // Map rows for backend upsert
        const resultsToSave = marksRows.value.map(r => ({
            student_id: r.student_id,
            marks_obtained: r.marks_obtained,
            sub_marks: r.sub_marks,
            tutor_marks: r.tutor_marks,
            tutor_sub_marks: r.tutor_sub_marks,
            remarks: r.remarks
        }))

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

const exportMarks = () => {
    if (!activeExam.value || !marksRows.value || marksRows.value.length === 0) {
        $q.notify({ type: 'warning', message: 'No data to export' });
        return;
    }

    const cols = [
        { label: 'Student ID', field: 'student_id_str' },
        { label: 'Student Name', field: 'student_name' }
    ]

    const subSubs = activeExam.value?.subSubjects || []
    subSubs.forEach(ss => {
      cols.push({
        label: ss.name,
        field: row => row.sub_marks[ss.name] || '0'
      })
    })

    cols.push({ label: 'Total Obtained', field: 'marks_obtained' })
    cols.push({ 
        label: 'Status', 
        field: row => getGroupName(row.marks_obtained, activeExam.value.max_marks) 
    })
    cols.push({ label: 'Remarks', field: 'remarks' })

    const filename = `Exam_Marks_${activeExam.value.title.replace(/\s+/g, '_')}`;
    exportToCSV(marksRows.value, filename, cols);
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

    const portalLink = `${window.location.origin}/student-portal?id=${row.student_id_str}`
    const group = getGroupName(row.marks_obtained, activeExam.value.max_marks)
    
    let subBreakdown = ''
    const subSubs = activeExam.value?.subSubjects || []
    if (subSubs.length > 0) {
      subBreakdown = '\n' + subSubs.map(ss => `${ss.name}: ${row.sub_marks[ss.name] || 0}/${ss.max}`).join('\n')
    }

    const message = `ආයුබෝවන් ${row.student_name}, ${activeExam.value.title} විභාගයේ ප්‍රතිඵල නිකුත් කර ඇත.
    
Marks: ${row.marks_obtained}/${activeExam.value.max_marks}${subBreakdown}
Status: ${group}

ඔබේ සියලුම ප්‍රතිඵල සහ වාර්තා මෙතැනින් බලන්න: ${portalLink}

ස්තූතියි!`

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
}

const getGroupColor = (marks, maxMarks, isBg = false) => {
    if (marks === null || marks === undefined || marks === '') return isBg ? 'white' : 'grey'
    const percentage = (marks / maxMarks) * 100
    if (percentage >= 75) return isBg ? 'green-1' : 'green-7'
    if (percentage >= 65) return isBg ? 'yellow-1' : 'yellow-8'
    if (percentage >= 55) return isBg ? 'blue-1' : 'blue-7'
    return isBg ? 'red-1' : 'red-7'
}

const getGroupName = (marks, maxMarks) => {
    if (marks === null || marks === undefined || marks === '') return 'N/A'
    const percentage = (marks / maxMarks) * 100
    if (percentage >= 75) return 'Green (Elite)'
    if (percentage >= 65) return 'Yellow (Good)'
    if (percentage >= 55) return 'Blue (Average)'
    return 'Red (Needs Focus)'
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px) saturate(185%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
}

.border-indigo-light {
  border: 1px dashed #c5cae9;
}

.hover-shadow:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
  transform: translateY(-2px);
}
.transition {
  transition: all 0.3s ease;
}

.rounded-button {
  border-radius: 8px;
}

.bg-indigo-900 {
  background-color: #0c1142 !important;
}

.border-amber {
  border: 1px solid #ffe082;
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
  background: rgba(238, 242, 255, 0.6) !important;
  border-bottom: 2px solid rgba(224, 224, 224, 0.5);
}

.custom-glass-table :deep(tbody tr td) {
  border-bottom: 1px solid rgba(224, 224, 224, 0.3);
  font-size: 14px;
}
</style>
