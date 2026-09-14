<template>
  <q-dialog v-model="modelValue" persistent>
    <q-card style="width: 580px; max-width: 95vw;" class="rounded-borders overflow-hidden">
      <q-card-section class="bg-indigo-10 text-white row items-center justify-between q-pa-md">
        <div class="row items-center">
          <q-icon name="apartment" size="28px" class="q-mr-sm text-amber-4" />
          <div>
            <div class="text-h6 text-weight-bold">
              {{ isEnglish ? 'Institute Manager' : 'ආයතන කළමනාකරණය' }}
            </div>
            <div class="text-caption text-blue-2">
              {{ isEnglish ? 'Manage multiple tuition institutes & set default campus.' : 'ආයතන කිහිපයක් එකතු කරන්න සහ Default ආයතනය තෝරන්න.' }}
            </div>
          </div>
        </div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-md">
        <!-- Add New Button -->
        <div class="row justify-between items-center q-mb-md">
          <div class="text-subtitle2 text-grey-8 text-weight-bold">
            {{ isEnglish ? 'Registered Institutes' : 'ලියාපදිංචි ආයතන' }} ({{ instituteStore.institutes.length }})
          </div>
          <q-btn
            color="primary"
            icon="add"
            :label="isEnglish ? 'Add Institute' : 'අලුත් ආයතනයක් එකතු කරන්න'"
            no-caps
            dense
            class="q-px-sm"
            @click="openAddForm"
          />
        </div>

        <!-- Form for Add/Edit -->
        <q-card v-if="showForm" flat bordered class="q-pa-md q-mb-md bg-grey-1 rounded-borders border-primary">
          <div class="text-subtitle1 text-weight-bold text-primary q-mb-sm">
            {{ isEditing ? (isEnglish ? 'Edit Institute' : 'ආයතනය සංස්කරණය කරන්න') : (isEnglish ? 'Add New Institute' : 'නවු ආයතනයක් එක් කරන්න') }}
          </div>
          <q-form @submit="saveForm" class="q-gutter-sm">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-8">
                <q-input
                  filled
                  dense
                  v-model="form.name"
                  :label="isEnglish ? 'Institute Name' : 'ආයතනයේ නම'"
                  placeholder="e.g., Rotara Institute"
                  :rules="[val => !!val || 'Required']"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  filled
                  dense
                  v-model="form.code"
                  :label="isEnglish ? 'Code Prefix' : 'කේතය'"
                  placeholder="e.g., ROT"
                  hint="Uppercase code"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  filled
                  dense
                  v-model="form.city"
                  :label="isEnglish ? 'City / Location' : 'නගරය / ශාඛාව'"
                  placeholder="e.g., Nugegoda"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  filled
                  dense
                  v-model="form.phone"
                  :label="isEnglish ? 'Phone / Contact' : 'දුරකථන අංකය'"
                  placeholder="e.g., 0112345678"
                />
              </div>
            </div>

            <q-checkbox
              v-model="form.is_default"
              :label="isEnglish ? 'Set as Default Institute (ප්‍රධාන ආයතනය ලෙස තබන්න)' : 'Default ආයතනය ලෙස තබන්න'"
              color="amber-9"
              dense
              class="q-mt-xs"
            />

            <div class="row justify-end q-gutter-sm q-mt-sm">
              <q-btn flat :label="isEnglish ? 'Cancel' : 'අවලංගු කරන්න'" color="grey-7" dense no-caps @click="showForm = false" />
              <q-btn type="submit" color="primary" :label="isEditing ? (isEnglish ? 'Update' : 'යාවත්කාලීන කරන්න') : (isEnglish ? 'Save Institute' : 'සුරකින්න')" unelevated dense no-caps class="q-px-md" />
            </div>
          </q-form>
        </q-card>

        <!-- Institutes List -->
        <q-list separator bordered class="rounded-borders bg-white">
          <q-item v-for="inst in instituteStore.institutes" :key="inst.id" class="q-py-md">
            <q-item-section avatar>
              <q-avatar color="indigo-1" text-color="indigo-9" icon="apartment" size="42px" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold text-subtitle1 row items-center">
                <span>{{ inst.name }}</span>
                <q-chip v-if="inst.is_default" dense color="amber-3" text-color="black" class="q-ml-sm text-weight-bolder" style="font-size: 10px;">
                  ★ DEFAULT
                </q-chip>
                <q-chip v-if="inst.id === instituteStore.activeInstituteId" dense color="green-2" text-color="green-10" class="q-ml-xs text-weight-bold" style="font-size: 10px;">
                  ACTIVE
                </q-chip>
              </q-item-label>
              <q-item-label caption class="text-grey-7">
                Code: <strong class="text-indigo-9">{{ inst.code }}</strong> | City: {{ inst.city || 'N/A' }} | Phone: {{ inst.phone || 'N/A' }}
              </q-item-label>
            </q-item-section>

            <q-item-section side class="row items-center no-wrap q-gutter-xs">
              <!-- Switch Active -->
              <q-btn
                v-if="inst.id !== instituteStore.activeInstituteId"
                flat
                dense
                color="indigo-7"
                icon="swap_horiz"
                :label="isEnglish ? 'Select' : 'තෝරන්න'"
                no-caps
                @click="instituteStore.setActiveInstitute(inst.id)"
              >
                <q-tooltip>{{ isEnglish ? 'Switch active institute' : 'සක්‍රීය ආයතනය ලෙස තෝරන්න' }}</q-tooltip>
              </q-btn>

              <!-- Set Default -->
              <q-btn
                v-if="!inst.is_default"
                flat
                round
                dense
                color="amber-9"
                icon="star_border"
                @click="makeDefault(inst.id)"
              >
                <q-tooltip>{{ isEnglish ? 'Set as default institute' : 'Default ආයතනය ලෙස සකසන්න' }}</q-tooltip>
              </q-btn>

              <!-- Edit -->
              <q-btn flat round dense color="blue-7" icon="edit" @click="editInstitute(inst)" />

              <!-- Delete -->
              <q-btn flat round dense color="red-7" icon="delete" @click="confirmDelete(inst)" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-grey-2">
        <q-btn flat color="grey-8" :label="isEnglish ? 'Close' : 'වසා දමන්න'" v-close-popup no-caps />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useInstituteStore } from 'src/store/institute'
import { useAppStore } from 'src/store/app'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const $q = useQuasar()
const instituteStore = useInstituteStore()
const appStore = useAppStore()
const isEnglish = computed(() => appStore.language === 'English')

const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const form = ref({
  name: '',
  code: '',
  city: '',
  phone: '',
  is_default: false
})

const openAddForm = () => {
  isEditing.value = false
  editingId.value = null
  form.value = { name: '', code: '', city: '', phone: '', is_default: false }
  showForm.value = true
}

const editInstitute = (inst) => {
  isEditing.value = true
  editingId.value = inst.id
  form.value = {
    name: inst.name,
    code: inst.code,
    city: inst.city || '',
    phone: inst.phone || '',
    is_default: inst.is_default
  }
  showForm.value = true
}

const saveForm = () => {
  if (isEditing.value && editingId.value) {
    instituteStore.updateInstitute(editingId.value, form.value)
    $q.notify({ type: 'positive', message: 'Institute updated successfully!' })
  } else {
    instituteStore.addInstitute(form.value)
    $q.notify({ type: 'positive', message: 'New institute added!' })
  }
  showForm.value = false
}

const makeDefault = (id) => {
  instituteStore.setDefaultInstitute(id)
  $q.notify({ type: 'positive', message: 'Default institute updated! ★' })
}

const confirmDelete = (inst) => {
  $q.dialog({
    title: 'Delete Institute',
    message: `Are you sure you want to remove "${inst.name}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    try {
      instituteStore.deleteInstitute(inst.id)
      $q.notify({ type: 'positive', message: 'Institute deleted.' })
    } catch (e) {
      $q.notify({ type: 'negative', message: e.message })
    }
  })
}
</script>
