<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 text-weight-bold text-grey-9 q-mb-none">Tutes & Materials</h1>
        <p class="text-grey-6">Manage and share educational resources with your students.</p>
      </div>
      <q-btn color="primary" icon="upload_file" label="Upload Tute" unelevated no-caps @click="openAddDialog" />
    </div>

    <!-- Filters -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <q-select 
          outlined 
          v-model="filterClass" 
          :options="classOptions" 
          label="Filter by Class" 
          clearable 
          dense
          @update:model-value="fetchTutes"
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-select 
          outlined 
          v-model="filterSubject" 
          :options="subjectOptions" 
          label="Filter by Subject" 
          clearable 
          dense
          @update:model-value="fetchTutes"
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-input outlined v-model="filterText" placeholder="Search tutes..." dense debounce="300">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="rows.length === 0 && !loading" class="flex flex-center bg-white rounded-borders q-pa-xl border-grey">
        <div class="text-center">
            <q-icon name="description" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">No tutes found</div>
            <p class="text-grey-5">Get started by uploading your first tutorial or study material.</p>
            <q-btn color="primary" label="Upload Tute" unelevated no-caps class="q-mt-sm" @click="openAddDialog" />
        </div>
    </div>

    <!-- Tutes Grid -->
    <div v-else class="row q-col-gutter-md">
      <div v-for="tute in filteredRows" :key="tute.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
        <q-card flat bordered class="tute-card rounded-borders full-height flex flex-column">
          <q-card-section class="q-pb-none">
            <div class="row items-center justify-between no-wrap">
              <q-badge :color="getFileTypeColor(tute.file_type)" text-color="white" class="q-pa-xs">
                {{ tute.file_type?.toUpperCase() || 'FILE' }}
              </q-badge>
              <q-btn flat round dense color="grey-7" icon="more_vert">
                <q-menu auto-close>
                  <q-list style="min-width: 100px">
                    <q-item clickable @click="openEditDialog(tute)">
                      <q-item-section avatar style="min-width: 32px"><q-icon name="edit" size="20px" /></q-item-section>
                      <q-item-section>Edit</q-item-section>
                    </q-item>
                    <q-item clickable class="text-red" @click="deleteTute(tute.id)">
                      <q-item-section avatar style="min-width: 32px"><q-icon name="delete" size="20px" color="red" /></q-item-section>
                      <q-item-section>Delete</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
            <div class="text-h6 text-weight-bold q-mt-sm ellipsis-2-lines" style="height: 48px; line-height: 24px;">
              {{ tute.title }}
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">
              <q-icon name="class" size="14px" class="q-mr-xs" /> {{ tute.class_name || 'All Classes' }}
            </div>
            <div class="text-caption text-grey-7">
              <q-icon name="menu_book" size="14px" class="q-mr-xs" /> {{ tute.subject_name || 'All Subjects' }}
            </div>
          </q-card-section>

          <q-card-section class="q-pt-md col">
            <p class="text-body2 text-grey-8 ellipsis-3-lines">
              {{ tute.description || 'No description provided.' }}
            </p>
          </q-card-section>

          <q-separator />

          <q-card-actions align="between" class="q-pa-md">
            <div class="text-caption text-grey-5">
              {{ formatDate(tute.created_at) }}
            </div>
            <q-btn 
              unelevated 
              color="indigo-1" 
              text-color="indigo-7" 
              icon="visibility" 
              label="View" 
              no-caps 
              @click="viewTute(tute)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="width: 500px; max-width: 95vw; border-radius: 12px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">{{ isEdit ? 'Edit Tute' : 'Upload New Tute' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-lg">
          <q-form @submit="saveTute" class="q-gutter-md">
            <q-input 
              outlined 
              v-model="form.title" 
              label="Tute Title" 
              placeholder="e.g. Algebra Part 1 - Notes"
              :rules="[val => !!val || 'Title is required']" 
            />
            
            <q-input 
              outlined 
              v-model="form.description" 
              label="Description" 
              type="textarea" 
              rows="3" 
              placeholder="Provide a brief description of the material..."
            />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-select 
                  outlined 
                  v-model="form.class_name" 
                  :options="classOptions" 
                  label="Target Class" 
                  hint="Optional"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select 
                  outlined 
                  v-model="form.subject_name" 
                  :options="subjectOptions" 
                  label="Subject" 
                  hint="Optional"
                />
              </div>
            </div>

            <div class="q-pa-md bg-grey-1 rounded-borders">
              <div class="text-subtitle2 q-mb-sm text-grey-8">File Attachment</div>
              <q-file 
                outlined 
                v-model="pickedFile" 
                label="Select File (PDF, Images, etc.)" 
                class="bg-white"
                @update:model-value="onFilePicked"
              >
                <template v-slot:prepend><q-icon name="attach_file" /></template>
              </q-file>
              
              <div class="q-mt-sm">
                <q-input 
                  outlined 
                  v-model="form.file_url" 
                  label="Or paste URL (Link/Video)" 
                  dense
                  placeholder="https://..."
                >
                   <template v-slot:prepend><q-icon name="link" /></template>
                </q-input>
              </div>
              
              <q-select 
                outlined 
                v-model="form.file_type" 
                :options="['pdf', 'image', 'link', 'video', 'doc']" 
                label="File Type" 
                dense
                class="q-mt-sm"
              />
            </div>

            <q-toggle v-model="form.is_active" :label="form.is_active ? 'Active (Visible to students)' : 'Inactive (Hidden)'" color="primary" />

            <div class="row justify-end q-mt-lg">
              <q-btn label="Cancel" color="grey-7" flat v-close-popup class="q-mr-sm" />
              <q-btn :label="isEdit ? 'Update Tute' : 'Upload Tute'" type="submit" color="primary" unelevated :loading="saving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Viewer Dialog (Placeholder) -->
    <q-dialog v-model="showViewer">
      <q-card style="width: 800px; max-width: 95vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedTute?.title }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pa-md text-center">
          <div v-if="selectedTute?.file_type === 'image'">
            <img :src="selectedTute.file_url" style="max-width: 100%; border-radius: 8px;">
          </div>
          <div v-else class="q-pa-xl">
            <q-icon name="insert_drive_file" size="100px" color="grey-4" />
            <div class="text-h6 q-mt-md">File Preview Not Available</div>
            <p class="text-grey-7">Please download or visit the link to view the content.</p>
            <q-btn color="primary" icon="open_in_new" label="Open Resource" :href="selectedTute?.file_url" target="_blank" unelevated />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { tutes, client, storage } from 'src/api'

const $q = useQuasar()
const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const filterClass = ref(null)
const filterSubject = ref(null)
const filterText = ref('')
const classOptions = ref([])
const subjectOptions = ref([])

const showDialog = ref(false)
const isEdit = ref(false)
const pickedFile = ref(null)

const showViewer = ref(false)
const selectedTute = ref(null)

const form = ref({
  id: null,
  title: '',
  description: '',
  class_name: null,
  subject_name: null,
  file_url: '',
  file_type: 'pdf',
  is_active: true
})

onMounted(() => {
  fetchTutes()
  fetchOptions()
})

const fetchTutes = async () => {
  loading.value = true
  try {
    const params = {}
    if (filterClass.value) params.class_name = filterClass.value
    if (filterSubject.value) params.subject_name = filterSubject.value
    
    const data = await tutes.getAll(params)
    rows.value = data || []
  } catch (error) {
    console.error('Error fetching tutes:', error)
  } finally {
    loading.value = false
  }
}

const fetchOptions = async () => {
  try {
    const cls = await client.get('classes')
    classOptions.value = [...new Set(cls.map(c => c.name))]
    
    const subs = await client.get('subjects')
    subjectOptions.value = subs.map(s => s.name)
  } catch {
    console.warn('Options fetch failed')
  }
}

const filteredRows = computed(() => {
  if (!filterText.value) return rows.value
  const s = filterText.value.toLowerCase()
  return rows.value.filter(r => 
    r.title?.toLowerCase().includes(s) || 
    r.description?.toLowerCase().includes(s)
  )
})

const getFileTypeColor = (type) => {
  const colors = {
    pdf: 'red-7',
    image: 'orange-7',
    video: 'purple-7',
    link: 'blue-7',
    doc: 'blue-grey-7'
  }
  return colors[type] || 'grey-7'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString()
}

const onFilePicked = async (file) => {
  if (!file) return
  
  $q.loading.show({ message: 'Uploading file to storage...' })
  try {
    const res = await storage.upload(file)
    form.value.file_url = res.url
    if (file.type.includes('image')) form.value.file_type = 'image'
    else if (file.type.includes('pdf')) form.value.file_type = 'pdf'
    else if (file.type.includes('video')) form.value.file_type = 'video'
    else form.value.file_type = 'doc'
    
    $q.notify({ type: 'positive', message: 'File uploaded successfully!' })
  } catch (error) {
    console.error('File upload failed:', error)
    $q.notify({ type: 'negative', message: error.message || 'File upload failed' })
  } finally {
    $q.loading.hide()
  }
}

const openAddDialog = () => {
  isEdit.value = false
  form.value = {
    id: null,
    title: '',
    description: '',
    class_name: filterClass.value,
    subject_name: filterSubject.value,
    file_url: '',
    file_type: 'pdf',
    is_active: true
  }
  pickedFile.value = null
  showDialog.value = true
}

const openEditDialog = (tute) => {
  isEdit.value = true
  form.value = { ...tute, is_active: !!tute.is_active }
  pickedFile.value = null
  showDialog.value = true
}

const saveTute = async () => {
  saving.value = true
  try {
    const data = { ...form.value, is_active: form.value.is_active ? 1 : 0 }
    if (isEdit.value) {
      await tutes.update(form.value.id, data)
    } else {
      await tutes.create(data)
    }
    $q.notify({ type: 'positive', message: `Tute ${isEdit.value ? 'updated' : 'uploaded'} successfully` })
    showDialog.value = false
    fetchTutes()
  } catch {
    $q.notify({ type: 'negative', message: 'Error saving tute' })
  } finally {
    saving.value = false
  }
}

const deleteTute = (id) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: 'Are you sure you want to remove this tute?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await tutes.delete(id)
      $q.notify({ type: 'positive', message: 'Tute deleted' })
      fetchTutes()
    } catch {
      $q.notify({ type: 'negative', message: 'Delete failed' })
    }
  })
}

const viewTute = (tute) => {
  selectedTute.value = tute
  showViewer.value = true
}
</script>

<style scoped>
.tute-card {
  transition: all 0.3s ease;
  cursor: default;
}
.tute-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ellipsis-3-lines {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
