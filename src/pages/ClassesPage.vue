<template>
  <q-page class="q-pa-lg bg-grey-1">
    <!-- Page Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h3 text-weight-bolder text-grey-9 q-mb-xs mt-0">Class Management</h1>
        <div class="text-subtitle1 text-grey-6">Schedule, monitor, and manage your tuition sessions.</div>
      </div>
      <q-btn 
        color="primary" 
        icon="add" 
        label="Set Up New Class" 
        unelevated 
        no-caps 
        class="premium-btn q-px-lg" 
        @click="openAddDialog" 
      />
    </div>

    <!-- Filter Tabs -->
    <div v-if="rows.length > 0" class="row justify-between items-center q-mb-lg">
        <q-btn-toggle
            v-model="filterType"
            spread
            no-caps
            unelevated
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            class="shadow-1 rounded-borders font-weight-bold"
            style="max-width: 480px;"
            :options="[
                { label: 'All Classes', value: 'all' },
                { label: '🔁 Recurring', value: 'recurring' },
                { label: '1️⃣ One-Time', value: 'onetime' }
            ]"
        />
        <div class="text-caption text-grey-7 text-weight-bold">
            Showing {{ filteredRows.length }} of {{ rows.length }} classes
        </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredRows.length === 0 && !loading" class="flex flex-center q-pa-xl empty-container">
        <div class="text-center fade-in">
            <div class="icon-blob">
                <q-icon name="auto_awesome" size="84px" color="primary" />
            </div>
            <div class="text-h4 text-weight-bold text-grey-9 q-mt-lg">No Classes Found</div>
            <p class="text-grey-6 text-h6 q-mt-md mw-400 mx-auto">No sessions match your selected filter. Create a new class or switch filters!</p>
            <q-btn color="primary" label="Create First Class" unelevated no-caps size="lg" class="q-mt-xl premium-btn" @click="openAddDialog" />
        </div>
    </div>

    <!-- Class Grid -->
    <div v-else class="row q-col-gutter-xl">
        <div v-for="item in filteredRows" :key="item.id" class="col-12 col-sm-6 col-lg-4">
            <q-card flat class="class-card glass-modern overflow-hidden">
                <!-- Card Header with Image or Gradient -->
                <div 
                    :class="!item.image_url ? `bg-gradient-${item.color_theme || getGradientIndex(item.subject)}` : ''" 
                    :style="item.image_url ? `background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${item.image_url}); background-size: cover; background-position: center;` : ''"
                    class="q-pa-md text-white relative-position subject-header"
                >
                    <div class="row items-center justify-between no-wrap">
                        <q-badge :label="item.grade" color="white" text-color="primary" class="text-weight-bold q-px-sm" />
                        <div class="row items-center">
                            <q-chip dense :color="getRecurrenceColor(item.recurrence_type)" text-color="white" size="sm" class="q-mr-xs">
                                {{ getRecurrenceLabel(item.recurrence_type) }}
                            </q-chip>
                            <q-chip dense :color="item.status === 'Active' ? 'green-5' : 'grey-7'" text-color="white" size="sm" class="q-mr-sm">
                                {{ item.status }}
                            </q-chip>
                            <q-btn flat round dense color="white" icon="more_horiz" class="opacity-80">
                                <q-menu auto-close transition-show="scale" transition-hide="scale">
                                    <q-list style="min-width: 180px">
                                        <q-item clickable @click="viewUpcomingSessions(item)" class="q-py-md">
                                            <q-item-section avatar><q-icon name="event_repeat" color="deep-purple-6" /></q-item-section>
                                            <q-item-section>Upcoming Dates</q-item-section>
                                        </q-item>
                                        <q-item clickable @click="openRecordingsDialog(item)" class="q-py-md">
                                            <q-item-section avatar><q-icon name="video_library" color="indigo-6" /></q-item-section>
                                            <q-item-section>Class Recordings</q-item-section>
                                        </q-item>
                                        <q-item clickable @click="openEditDialog(item)" class="q-py-md">
                                            <q-item-section avatar><q-icon name="edit_calendar" color="primary" /></q-item-section>
                                            <q-item-section>Modify Schedule</q-item-section>
                                        </q-item>
                                        <q-separator />
                                        <q-item clickable class="text-red-7 q-py-md" @click="deleteClass(item.id)">
                                            <q-item-section avatar><q-icon name="delete_outline" color="red-7" /></q-item-section>
                                            <q-item-section>Permanent Removal</q-item-section>
                                        </q-item>
                                    </q-list>
                                </q-menu>
                            </q-btn>
                        </div>
                    </div>
                    <div class="text-h5 text-weight-bolder q-mt-md text-shadow">{{ item.class_name }}</div>
                    <div class="text-subtitle2 opacity-90 text-shadow">{{ item.subject }}</div>
                </div>

                <q-card-section class="q-pa-lg">
                    <!-- Tutor Info -->
                    <div class="row items-center q-mb-lg tutor-section q-pa-sm rounded-borders">
                        <q-avatar size="44px" color="primary" text-color="white" class="q-mr-md shadow-2">
                            {{ item.tutor ? item.tutor.charAt(0) : '?' }}
                        </q-avatar>
                        <div>
                            <div class="text-caption text-grey-6 text-uppercase text-weight-bold letter-spacing-wide">Instructor</div>
                            <div class="text-subtitle1 text-weight-bold text-grey-9">{{ item.tutor || 'No Tutor' }}</div>
                        </div>
                    </div>

                    <!-- Time & Day -->
                    <div class="row items-center justify-between q-mb-lg bg-grey-1 q-pa-md rounded-borders border-dashed">
                        <div>
                            <div class="row items-center text-grey-7 q-mb-xs">
                                <q-icon name="calendar_today" size="16px" class="q-mr-xs" />
                                <span class="text-caption text-weight-bold uppercase">
                                  {{ item.recurrence_type === 'none' && item.class_date ? formatDate(item.class_date) : `${item.day} (${getRecurrenceLabel(item.recurrence_type)})` }}
                                </span>
                            </div>
                            <div class="text-h6 text-weight-bold text-grey-9">
                                {{ formatTime(item.start_time) }} - {{ formatTime(item.end_time) }}
                            </div>
                        </div>
                        <q-icon name="arrow_forward" color="grey-4" size="24px" />
                    </div>

                    <!-- Footer / Fee -->
                    <div class="row items-center justify-between q-mt-md">
                        <div class="fee-badge">
                            <span class="currency">LKR</span>
                            <span class="amount">{{ Number(item.fee).toLocaleString() }}</span>
                            <span class="period">/month</span>
                        </div>
                        <div class="row q-gutter-xs">
                          <q-btn v-if="item.whatsapp_group_url" flat round color="green-7" icon="fa-brands fa-whatsapp" :href="item.whatsapp_group_url" target="_blank">
                            <q-tooltip>WhatsApp Group</q-tooltip>
                          </q-btn>
                          <q-btn flat color="primary" label="Details" no-caps icon-right="chevron_right" @click="showClassDetails(item)" />
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>
    </div>

    <!-- Create/Edit Dialog (Modern Redesign) -->
    <q-dialog v-model="showDialog" backdrop-filter="blur(10px)" persistent>
        <q-card style="width: 600px; max-width: 95vw; border-radius: 20px;" class="shadow-24">
            <q-card-section class="bg-primary text-white q-pa-lg">
                <div class="row items-center justify-between">
                    <div>
                        <div class="text-h5 text-weight-bolder">{{ isEdit ? 'Update Class' : 'New Session Setup' }}</div>
                        <div class="text-subtitle2 opacity-80">Fill in the details for the tuition session</div>
                    </div>
                    <q-btn icon="close" flat round dense v-close-popup />
                </div>
            </q-card-section>

            <q-card-section class="q-pa-xl">
                <q-form @submit="saveClass" class="q-gutter-lg">
                    <q-input 
                        filled 
                        v-model="form.class_name" 
                        label="Class Header" 
                        placeholder="e.g., Mathematics Mastery Weekly"
                        label-color="primary"
                        :rules="[val => !!val || 'Give your class a descriptive name']"
                    >
                        <template v-slot:prepend><q-icon name="edit_note" color="primary" /></template>
                    </q-input>
                    
                    <div class="row q-col-gutter-lg">
                        <div class="col-12 col-md-6">
                            <q-select 
                                filled 
                                v-model="form.subject" 
                                :options="subjectOptions" 
                                label="Subject Area"
                                @update:model-value="onSubjectChange"
                            >
                                <template v-slot:prepend><q-icon name="book" color="primary" /></template>
                            </q-select>
                        </div>
                        <div class="col-12 col-md-6">
                            <q-select filled v-model="form.grade" :options="gradeOptions" label="Target Grade">
                                <template v-slot:prepend><q-icon name="grade" color="primary" /></template>
                            </q-select>
                        </div>
                    </div>

                    <q-select 
                        filled 
                        v-model="form.tutor" 
                        :options="filteredTutorOptions" 
                        label="Assign Lead Tutor" 
                        :hint="!form.subject ? 'Select a subject first' : `Tutors for ${form.subject}`"
                    >
                        <template v-slot:prepend><q-icon name="person_pin" color="primary" /></template>
                    </q-select>

                    <q-input 
                        filled 
                        v-model="form.whatsapp_group_url" 
                        label="WhatsApp Group Link" 
                        placeholder="https://chat.whatsapp.com/..."
                    >
                        <template v-slot:prepend><q-icon name="fa-brands fa-whatsapp" color="green-7" /></template>
                    </q-input>

                    <div class="row q-col-gutter-lg">
                        <div class="col-12 col-md-6">
                            <q-select 
                                filled 
                                v-model="form.recurrence_type" 
                                :options="recurrenceOptions" 
                                emit-value 
                                map-options
                                label="Recurrence Pattern"
                            >
                                <template v-slot:prepend><q-icon name="update" color="primary" /></template>
                            </q-select>
                        </div>
                        <div class="col-12 col-md-6" v-if="form.recurrence_type !== 'none'">
                            <q-select filled v-model="form.day" :options="dayOptions" label="Day of Week" />
                        </div>
                        <div class="col-12 col-md-6" v-if="form.recurrence_type === 'none' || form.recurrence_type === 'monthly'">
                            <q-input filled v-model="form.class_date" label="Class Date" type="date" stack-label hint="Specific session date">
                                <template v-slot:prepend><q-icon name="event" color="primary" /></template>
                            </q-input>
                        </div>
                    </div>

                    <!-- Customization Section -->
                    <div class="q-pa-md bg-blue-1 rounded-borders q-mb-md">
                        <div class="text-subtitle2 q-mb-sm text-primary">Card Customization</div>
                        
                        <div class="row q-col-gutter-sm q-mb-sm">
                            <div class="col-12 col-md-8">
                                <q-input filled v-model="form.image_url" label="Background Image URL" placeholder="https://..." dense>
                                    <template v-slot:prepend><q-icon name="image" color="primary" /></template>
                                    <template v-slot:append>
                                        <q-btn flat dense icon="auto_fix_high" color="primary" @click="suggestImage">
                                            <q-tooltip>Suggest image for subject</q-tooltip>
                                        </q-btn>
                                    </template>
                                </q-input>
                            </div>
                            <div class="col-12 col-md-4">
                                <q-file 
                                    filled 
                                    v-model="pickedFile" 
                                    label="Upload Photo" 
                                    dense 
                                    accept="image/*"
                                    @update:model-value="onFilePicked"
                                >
                                    <template v-slot:prepend><q-icon name="cloud_upload" color="primary" /></template>
                                </q-file>
                            </div>
                        </div>

                        <div class="row items-center q-gutter-sm">
                            <div class="text-caption text-grey-7">Theme Gradient:</div>
                            <div v-for="i in 5" :key="i" 
                                :class="`bg-gradient-${i} ${form.color_theme == i ? 'ring-2' : ''}`" 
                                class="color-swatch" 
                                @click="form.color_theme = i"
                            />
                        </div>
                    </div>

                    <div class="row q-col-gutter-lg">
                        <div class="col-6 col-md-6">
                            <q-input filled v-model="form.start_time" label="Beginning" type="time" stack-label />
                        </div>
                        <div class="col-6 col-md-6">
                            <q-input filled v-model="form.end_time" label="Conclusion" type="time" stack-label />
                        </div>
                    </div>

                    <div class="row q-col-gutter-lg items-center">
                        <div class="col-12 col-md-7">
                            <q-input filled v-model.number="form.fee" label="Admission Fee (LKR)" type="number" prefix="Rs.">
                                <template v-slot:prepend><q-icon name="payments" color="green-7" /></template>
                             </q-input>
                        </div>
                        <div class="col-12 col-md-5">
                            <q-btn-toggle
                                v-model="form.status"
                                spread
                                no-caps
                                unelevated
                                toggle-color="primary"
                                color="grey-2"
                                text-color="grey-7"
                                :options="[{label: 'Active', value: 'Active'}, {label: 'Paused', value: 'Inactive'}]"
                            />
                        </div>
                    </div>

                    <div class="row justify-end q-mt-xl">
                        <q-btn label="Discard" color="grey-5" flat v-close-popup class="q-mr-md" />
                        <q-btn 
                            :label="isEdit ? 'Sync Changes' : 'Confirm Class'" 
                            type="submit" 
                            color="primary" 
                            unelevated 
                            class="q-px-xl premium-btn h-50"
                            :loading="loading" 
                        />
                    </div>
                </q-form>
            </q-card-section>
        </q-card>
    </q-dialog>

    <!-- Broadcast Dialog -->
    <q-dialog v-model="showBroadcastDialog">
      <q-card style="min-width: 400px; border-radius: 15px;">
        <q-card-section class="bg-green-7 text-white q-pa-md">
          <div class="text-h6 row items-center">
            <q-icon name="fa-brands fa-whatsapp" class="q-mr-sm" />
            Notify Students
          </div>
        </q-card-section>
        <q-card-section class="q-pa-lg">
          <p class="text-grey-7">Select students to notify about the scheduled class: <strong>{{ lastScheduledClass?.class_name }}</strong></p>
          <q-scroll-area style="height: 300px;">
            <q-list bordered separator class="rounded-borders">
              <q-item v-for="std in targetStudents" :key="std.id" tag="label" v-ripple>
                <q-item-section side top>
                  <q-checkbox v-model="selectedBroadcastIds" :val="std.id" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ std.name }}</q-item-label>
                  <q-item-label caption>{{ std.contact }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="targetStudents.length === 0">
                <q-item-section class="text-center text-grey-5 q-pa-md">No students found for this grade and subject.</q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Skip" color="grey-7" v-close-popup />
          <q-btn 
            color="green-7" 
            label="Send Broadcast" 
            icon="send" 
            unelevated 
            :disabled="selectedBroadcastIds.length === 0"
            @click="sendBroadcast" 
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Class Details Dialog -->
    <q-dialog v-model="showDetails" backdrop-filter="blur(10px)">
        <q-card style="width: 450px; border-radius: 20px;">
            <q-card-section :class="`bg-gradient-${getGradientIndex(selectedClass?.subject)} text-white q-pa-lg`">
                <div class="row items-center justify-between">
                    <div class="text-h5 text-weight-bolder">{{ selectedClass?.class_name }}</div>
                    <q-btn icon="close" flat round dense v-close-popup />
                </div>
            </q-card-section>
            <q-card-section class="q-pa-lg">
                <div class="q-gutter-y-md">
                    <div class="row items-center q-pa-md bg-grey-1 rounded-borders">
                        <q-icon name="menu_book" color="primary" size="24px" class="q-mr-md" />
                        <div>
                            <div class="text-caption text-grey-6 uppercase">Subject & Grade</div>
                            <div class="text-subtitle1 text-weight-bold">{{ selectedClass?.subject }} ({{ selectedClass?.grade }})</div>
                        </div>
                    </div>
                    <div class="row items-center q-pa-md bg-grey-1 rounded-borders">
                        <q-icon name="person" color="primary" size="24px" class="q-mr-md" />
                        <div>
                            <div class="text-caption text-grey-6 uppercase">Assigned Tutor</div>
                            <div class="text-subtitle1 text-weight-bold">{{ selectedClass?.tutor }}</div>
                        </div>
                    </div>
                    <div class="row items-center q-pa-md bg-grey-1 rounded-borders">
                        <q-icon name="timer" color="primary" size="24px" class="q-mr-md" />
                        <div>
                            <div class="text-caption text-grey-6 uppercase">Schedule</div>
                            <div class="text-subtitle1 text-weight-bold">{{ selectedClass?.day }} at {{ formatTime(selectedClass?.start_time) }}</div>
                        </div>
                    </div>
                </div>
            </q-card-section>
            <q-card-actions align="right" class="q-pa-md">
                <q-btn flat label="Close" color="primary" v-close-popup />
                <q-btn color="primary" label="Edit Schedule" icon="edit" unelevated @click="openEditDialog(selectedClass)" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>

    <!-- Upcoming Sessions Dialog -->
    <q-dialog v-model="showUpcomingDialog" backdrop-filter="blur(10px)">
        <q-card style="width: 420px; max-width: 90vw; border-radius: 20px;">
            <q-card-section class="bg-deep-purple-8 text-white q-pa-lg">
                <div class="row items-center justify-between">
                    <div>
                        <div class="text-h6 text-weight-bold flex items-center">
                            <q-icon name="event_repeat" class="q-mr-sm" />
                            Upcoming Dates
                        </div>
                        <div class="text-caption opacity-80">{{ upcomingClass?.class_name }} ({{ getRecurrenceLabel(upcomingClass?.recurrence_type) }})</div>
                    </div>
                    <q-btn icon="close" flat round dense v-close-popup />
                </div>
            </q-card-section>
            <q-card-section class="q-pa-lg">
                <div v-if="loadingUpcoming" class="text-center q-pa-lg">
                    <q-spinner color="primary" size="36px" />
                    <div class="text-caption text-grey-6 q-mt-sm">Calculating upcoming sessions...</div>
                </div>
                <div v-else-if="upcomingDates.length === 0" class="text-center q-pa-md text-grey-6">
                    No upcoming sessions found.
                </div>
                <q-list v-else separator bordered class="rounded-borders overflow-hidden shadow-1">
                    <q-item v-for="(dateStr, idx) in upcomingDates" :key="idx" class="q-py-md">
                        <q-item-section avatar>
                            <q-avatar color="deep-purple-1" text-color="deep-purple-9" icon="event" />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label class="text-weight-bold text-subtitle1">{{ formatDate(dateStr) }}</q-item-label>
                            <q-item-label caption class="text-grey-7">
                                {{ upcomingClass?.day || 'Specific Date' }} • {{ formatTime(upcomingClass?.start_time) }} - {{ formatTime(upcomingClass?.end_time) }}
                            </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <q-badge color="deep-purple-1" text-color="deep-purple-9" :label="`Session #${idx + 1}`" class="q-px-sm" />
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-card-section>
            <q-card-actions align="right" class="q-pa-md">
                <q-btn flat label="Close" color="grey-7" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>

    <!-- ===================== CLASS RECORDINGS DIALOG ===================== -->
    <q-dialog v-model="showRecordingsDialog" backdrop-filter="blur(10px)" maximized transition-show="slide-up" transition-hide="slide-down">
        <q-card style="border-radius: 0; background: #f8f9ff;">
            <!-- Header -->
            <q-card-section class="bg-indigo-8 text-white q-pa-lg">
                <div class="row items-center justify-between">
                    <div>
                        <div class="text-h5 text-weight-bold flex items-center">
                            <q-icon name="video_library" class="q-mr-sm" size="28px" />
                            Class Recordings
                        </div>
                        <div class="text-caption opacity-80 q-mt-xs">
                            {{ recordingsClass?.class_name }} · {{ recordingsClass?.subject_name || recordingsClass?.subject }}
                        </div>
                    </div>
                    <q-btn icon="close" flat round dense v-close-popup color="white" size="lg" />
                </div>
            </q-card-section>

            <q-card-section class="q-pa-xl" style="max-width: 900px; margin: 0 auto; width: 100%;">
                <!-- Add New Recording Form -->
                <q-card flat bordered class="q-pa-lg q-mb-xl" style="border-radius: 20px; border-color: #c7d2fe;">
                    <div class="text-subtitle1 text-weight-bold text-indigo-9 q-mb-md flex items-center">
                        <q-icon name="add_circle" color="indigo-6" class="q-mr-sm" />
                        Add New Recording
                    </div>
                    <div class="row q-col-gutter-md">
                        <div class="col-12 col-md-6">
                            <q-input
                                v-model="newRec.title"
                                label="Recording Title *"
                                outlined
                                dense
                                color="indigo-6"
                                placeholder="e.g. Chapter 5 – Derivatives"
                            >
                                <template v-slot:prepend><q-icon name="title" color="indigo-5" /></template>
                            </q-input>
                        </div>
                        <div class="col-12 col-md-6">
                            <q-select
                                v-model="newRec.month"
                                :options="months"
                                label="Month (optional)"
                                outlined
                                dense
                                color="indigo-6"
                                clearable
                            >
                                <template v-slot:prepend><q-icon name="calendar_month" color="indigo-5" /></template>
                            </q-select>
                        </div>
                        <div class="col-12">
                            <q-input
                                v-model="newRec.recording_url"
                                label="Recording URL *"
                                outlined
                                dense
                                color="indigo-6"
                                placeholder="https://youtube.com/... or Google Drive link"
                            >
                                <template v-slot:prepend><q-icon name="link" color="indigo-5" /></template>
                            </q-input>
                        </div>
                        <div class="col-12">
                            <q-input
                                v-model="newRec.description"
                                label="Description (optional)"
                                outlined
                                dense
                                color="indigo-6"
                                type="textarea"
                                rows="2"
                                placeholder="Short note about this session..."
                            />
                        </div>
                        <div class="col-12 flex justify-end">
                            <q-btn
                                color="indigo-7"
                                icon="upload"
                                label="Save Recording"
                                unelevated
                                no-caps
                                class="q-px-xl q-py-sm text-weight-bold"
                                style="border-radius: 12px;"
                                :loading="savingRec"
                                @click="saveRecording"
                            />
                        </div>
                    </div>
                </q-card>

                <!-- Recordings List -->
                <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-md flex items-center">
                    <q-icon name="list" color="indigo-4" class="q-mr-sm" />
                    Saved Recordings ({{ recordingsList.length }})
                </div>
                <div v-if="loadingRecs" class="text-center q-pa-xl">
                    <q-spinner color="indigo" size="40px" />
                    <div class="text-caption text-grey-6 q-mt-sm">Loading recordings...</div>
                </div>
                <div v-else-if="recordingsList.length === 0" class="text-center q-pa-xl text-grey-5">
                    <q-icon name="video_off" size="54px" />
                    <div class="q-mt-sm text-subtitle2">No recordings yet. Add one above.</div>
                </div>
                <div v-else class="q-gutter-md">
                    <q-card
                        v-for="rec in recordingsList"
                        :key="rec.id"
                        flat
                        bordered
                        class="q-pa-md"
                        style="border-radius: 16px; background: white;"
                    >
                        <div class="row items-start justify-between no-wrap">
                            <div class="row items-center q-gutter-md no-wrap col">
                                <q-avatar color="indigo-1" text-color="indigo-8" icon="play_circle" size="48px" />
                                <div class="col overflow-hidden">
                                    <div class="text-subtitle1 text-weight-bold text-grey-9 ellipsis">{{ rec.title }}</div>
                                    <div class="text-caption text-grey-6">{{ rec.description }}</div>
                                    <div class="row q-gutter-sm q-mt-xs items-center">
                                        <q-chip dense color="indigo-1" text-color="indigo-8" icon="calendar_month" size="sm" v-if="rec.month">{{ rec.month }}</q-chip>
                                        <a :href="rec.recording_url" target="_blank" class="text-indigo-6 text-caption ellipsis" style="max-width: 260px; text-decoration: none;">{{ rec.recording_url }}</a>
                                    </div>
                                </div>
                            </div>
                            <div class="row q-gutter-sm items-center q-ml-md">
                                <q-btn
                                    flat
                                    round
                                    dense
                                    color="indigo-6"
                                    icon="open_in_new"
                                    :href="rec.recording_url"
                                    target="_blank"
                                    type="a"
                                >
                                    <q-tooltip>Open Recording</q-tooltip>
                                </q-btn>
                                <q-btn
                                    flat
                                    round
                                    dense
                                    color="red-5"
                                    icon="delete_outline"
                                    @click="deleteRecording(rec.id)"
                                >
                                    <q-tooltip>Delete Recording</q-tooltip>
                                </q-btn>
                            </div>
                        </div>
                    </q-card>
                </div>
            </q-card-section>
        </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { client } from 'src/api'
import { useAppStore } from 'src/store/app'
import { useSubscriptionStore } from 'src/store/subscription'

const $q = useQuasar()
const appStore = useAppStore()
const subStore = useSubscriptionStore()
const rows = ref([])
const loading = ref(false)
const filterType = ref('all')

const showDialog = ref(false)
const isEdit = ref(false)
const showBroadcastDialog = ref(false)
const targetStudents = ref([])
const selectedBroadcastIds = ref([])
const lastScheduledClass = ref(null)
const showDetails = ref(false)
const selectedClass = ref(null)

const showUpcomingDialog = ref(false)
const upcomingClass = ref(null)
const upcomingDates = ref([])
const loadingUpcoming = ref(false)

// ========== RECORDINGS ==========
const showRecordingsDialog = ref(false)
const recordingsClass = ref(null)
const recordingsList = ref([])
const loadingRecs = ref(false)
const savingRec = ref(false)

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const newRec = ref({ title: '', description: '', recording_url: '', month: '' })

const openRecordingsDialog = async (cls) => {
    recordingsClass.value = cls
    showRecordingsDialog.value = true
    newRec.value = { title: '', description: '', recording_url: '', month: '' }
    loadingRecs.value = true
    try {
        const data = await client.get(`recordings?class_id=${cls.id}`)
        recordingsList.value = Array.isArray(data) ? data : []
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to load recordings' })
    } finally {
        loadingRecs.value = false
    }
}

const saveRecording = async () => {
    if (!newRec.value.title || !newRec.value.recording_url) {
        $q.notify({ type: 'warning', message: 'Title and Recording URL are required.' })
        return
    }
    savingRec.value = true
    try {
        await client.post('recordings', {
            class_id: recordingsClass.value.id,
            title: newRec.value.title,
            description: newRec.value.description,
            recording_url: newRec.value.recording_url,
            month: newRec.value.month || ''
        })
        $q.notify({ type: 'positive', message: 'Recording saved successfully!', icon: 'check_circle' })
        newRec.value = { title: '', description: '', recording_url: '', month: '' }
        // Refresh list
        const data = await client.get(`recordings?class_id=${recordingsClass.value.id}`)
        recordingsList.value = Array.isArray(data) ? data : []
    } catch (err) {
        $q.notify({ type: 'negative', message: err.message || 'Failed to save recording' })
    } finally {
        savingRec.value = false
    }
}

const deleteRecording = (id) => {
    $q.dialog({
        title: 'Delete Recording?',
        message: 'This will permanently remove the recording link. Students will lose access.',
        cancel: true,
        ok: { color: 'red-7', unelevated: true, label: 'Delete' }
    }).onOk(async () => {
        try {
            await client.delete(`recordings/${id}`)
            $q.notify({ type: 'positive', message: 'Recording deleted.' })
            recordingsList.value = recordingsList.value.filter(r => r.id !== id)
        } catch {
            $q.notify({ type: 'negative', message: 'Failed to delete recording' })
        }
    })
}
// ================================

const recurrenceOptions = [
    { label: '🔁 Weekly (Every Week)', value: 'weekly' },
    { label: '🔁 Bi-Weekly (Every 2 Weeks)', value: 'biweekly' },
    { label: '🗓️ Monthly (Monthly)', value: 'monthly' },
    { label: '1️⃣ One-Time (Specific Date)', value: 'none' }
]

const filteredRows = computed(() => {
    if (filterType.value === 'recurring') {
        return rows.value.filter(r => r.recurrence_type !== 'none')
    }
    if (filterType.value === 'onetime') {
        return rows.value.filter(r => r.recurrence_type === 'none')
    }
    return rows.value
})

const getRecurrenceLabel = (type) => {
    switch (type) {
        case 'weekly': return 'Weekly'
        case 'biweekly': return 'Bi-Weekly'
        case 'monthly': return 'Monthly'
        case 'none': return 'One-Time'
        default: return 'Weekly'
    }
}

const getRecurrenceColor = (type) => {
    switch (type) {
        case 'weekly': return 'indigo-6'
        case 'biweekly': return 'purple-6'
        case 'monthly': return 'teal-6'
        case 'none': return 'orange-7'
        default: return 'indigo-6'
    }
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
                    const MAX_WIDTH = 1200
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
                    resolve(canvas.toDataURL('image/jpeg', 0.7))
                }
            }
        })
    }

    try {
        $q.loading.show({ message: 'Compressing image...' })
        form.value.image_url = await compressImage(file)
    } catch (e) {
        console.error('Compression error:', e)
    } finally {
        $q.loading.hide()
    }
}

const subjectOptions = ref([])
const allTutors = ref([]) 
const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const gradeOptions = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13']

const form = ref({
    id: null,
    class_name: '',
    subject: '',
    tutor: '',
    grade: '',
    recurrence_type: 'weekly',
    day: 'Sunday',
    class_date: '',
    start_time: '08:00',
    end_time: '10:00',
    fee: 5000,
    status: 'Active',
    image_url: '',
    color_theme: null,
    whatsapp_group_url: ''
})

const suggestImage = () => {
    if (!form.value.subject) {
        $q.notify({ type: 'warning', message: 'Select a subject first' })
        return
    }
    const subject = form.value.subject.toLowerCase()
    const images = {
        'mathematics': 'https://images.unsplash.com/photo-1509228468518-180dd48a5793?q=80&w=800',
        'maths': 'https://images.unsplash.com/photo-1509228468518-180dd48a5793?q=80&w=800',
        'science': 'https://images.unsplash.com/photo-1532094349884-543bb11783bb?q=80&w=800',
        'biology': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=800',
        'physics': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800',
        'chemistry': 'https://images.unsplash.com/photo-1532187863486-abf9d3a30223?q=80&w=800',
        'english': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800',
        'ict': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800',
        'history': 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?q=80&w=800'
    }
    form.value.image_url = images[subject] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800'
}

const filteredTutorOptions = computed(() => {
    if (!form.value.subject) return []
    return allTutors.value
        .filter(t => t.subject === form.value.subject)
        .map(t => t.name)
})

const onSubjectChange = () => {
    form.value.tutor = '' 
}

onMounted(() => {
    fetchClasses()
    loadOptions()
})

const loadOptions = async () => {
    try {
        const [subs, tutors] = await Promise.all([
            client.get('subjects'),
            client.get('tutors')
        ])
        if (subs) subjectOptions.value = subs.map(s => s.name)
        if (tutors) allTutors.value = tutors
    } catch {
        // Silently fail
    }
}

const fetchClasses = async () => {
    loading.value = true
    try {
        const data = await client.get('classes')
        rows.value = data || []
    } catch (e) {
        console.error('Error fetching classes:', e)
        $q.notify({ type: 'negative', message: 'Failed to load classes' })
    } finally {
        loading.value = false
    }
}

const openAddDialog = () => {
    if (!subStore.canAddClass(rows.value.length)) {
        $q.notify({
            type: 'negative',
            icon: 'lock',
            message: `Class limit reached for your ${subStore.currentPackage.name} (Max ${subStore.classLimit} classes). Please upgrade your plan!`,
            timeout: 6000
        })
        return
    }
    isEdit.value = false
    form.value = { 
        id: null, 
        class_name: '', 
        subject: '', 
        tutor: '', 
        grade: '', 
        recurrence_type: 'weekly',
        day: 'Sunday', 
        class_date: '', 
        start_time: '08:00', 
        end_time: '10:00', 
        fee: 5000, 
        status: 'Active',
        image_url: '',
        color_theme: null,
        whatsapp_group_url: ''
    }
    showDialog.value = true
}

const openEditDialog = (item) => {
    isEdit.value = true
    form.value = { 
        recurrence_type: 'weekly',
        ...item 
    }
    showDialog.value = true
}

const viewUpcomingSessions = async (item) => {
    upcomingClass.value = item
    upcomingDates.value = []
    showUpcomingDialog.value = true
    loadingUpcoming.value = true
    try {
        const res = await client.get(`classes/${item.id}/upcoming`)
        if (res && res.upcoming_dates) {
            upcomingDates.value = res.upcoming_dates
        }
    } catch (e) {
        console.error('Fetch upcoming error:', e)
        $q.notify({ type: 'negative', message: 'Could not fetch upcoming dates' })
    } finally {
        loadingUpcoming.value = false
    }
}

const saveClass = async () => {
    loading.value = true
    const { id, ...classData } = form.value
    try {
        if (isEdit.value) {
            await client.put(`classes/${id}`, classData)
        } else {
            await client.post('classes', classData)
        }
        $q.notify({ type: 'positive', message: 'Class schedule synced successfully' })
        showDialog.value = false
        fetchClasses()
        
        if (!isEdit.value) {
          lastScheduledClass.value = { ...classData, id }
          prepareBroadcast(classData)
        }
    } catch {
        $q.notify({ type: 'negative', message: 'Error saving class' })
    } finally {
        loading.value = false
    }
}

const prepareBroadcast = async (classData) => {
    try {
        const data = await client.get('students')
        if (data) {
            targetStudents.value = data.filter(s => 
                s.grade === classData.grade && 
                s.status === 'Active' && 
                s.subjects && s.subjects.includes(classData.subject)
            )
            selectedBroadcastIds.value = targetStudents.value.map(s => s.id)
            if (targetStudents.value.length > 0) {
                showBroadcastDialog.value = true
            }
        }
    } catch {
        // Ignore
    }
}

const sendBroadcast = () => {
    if (!appStore.whatsappEnabled) return
    const studentsToNotify = targetStudents.value.filter(s => selectedBroadcastIds.value.includes(s.id))
    const classTime = lastScheduledClass.value.class_date 
      ? formatDate(lastScheduledClass.value.class_date) 
      : lastScheduledClass.value.day
      
    const message = `📢 *New Class Scheduled!*\n\nClass: ${lastScheduledClass.value.class_name}\nSubject: ${lastScheduledClass.value.subject}\nTutor: ${lastScheduledClass.value.tutor}\nTime: ${classTime} at ${formatTime(lastScheduledClass.value.start_time)}\n\nSee you there! 👋`
    
    studentsToNotify.forEach(std => {
        let phone = std.contact
        if (phone) {
            if (phone.startsWith('0')) phone = '94' + phone.substring(1)
            phone = phone.replace(/\D/g, '')
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
            window.open(url, '_blank')
        }
    })
    
    showBroadcastDialog.value = false
    $q.notify({ type: 'positive', message: 'Broadcast links opened. Please send them in WhatsApp tabs.' })
}

const showClassDetails = (item) => {
    selectedClass.value = item
    showDetails.value = true
}

const deleteClass = (id) => {
    $q.dialog({
        title: 'Security Confirmation',
        message: 'This will permanently remove the class. Proceed?',
        cancel: true,
        persistent: true,
        ok: { color: 'red-7', unelevated: true, label: 'Confirm Removal' }
    }).onOk(async () => {
        try {
            await client.delete(`classes/${id}`)
            $q.notify({ type: 'positive', message: 'Class record purged' })
            fetchClasses()
        } catch {
            $q.notify({ type: 'negative', message: 'Error deleting class' })
        }
    })
}

// Utility Helpers
const getGradientIndex = (subject) => {
    const hash = (subject || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return (hash % 5) + 1
}

const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${m} ${ampm}`
}

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    })
}
</script>

<style scoped lang="scss">
.bg-gradient-1 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.bg-gradient-2 { background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%); }
.bg-gradient-3 { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.bg-gradient-4 { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.bg-gradient-5 { background: linear-gradient(135deg, #2af598 0%, #009efd 100%); }

.class-card {
    border-radius: 20px;
    height: 100%;
    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    background: white;
    border: 1px solid rgba(0,0,0,0.05);

    &:hover {
        transform: translateY(-10px);
        box-shadow: 0 30px 60px -12px rgba(50, 50, 93, 0.25), 0 18px 36px -18px rgba(0, 0, 0, 0.3);
    }
}

.subject-header {
    min-height: 140px;
}

.border-dashed {
    border: 1px dashed rgba(0,0,0,0.1);
}

.fee-badge {
    background: #f8f9fa;
    padding: 8px 16px;
    border-radius: 12px;
    display: flex;
    align-items: baseline;
    
    .currency { font-size: 10px; font-weight: 800; color: #666; margin-right: 4px; }
    .amount { font-size: 18px; font-weight: 900; color: #1a1a1a; }
    .period { font-size: 10px; color: #888; margin-left: 2px; }
}

.premium-btn {
    border-radius: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.icon-blob {
    width: 140px;
    height: 140px;
    background: rgba(var(--q-primary-rgb), 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    position: relative;
    
    &::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border: 2px dashed var(--q-primary);
        border-radius: 50%;
        animation: rotate 20s linear infinite;
    }
}

@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.mw-400 { max-width: 400px; }
.mx-auto { margin-left: auto; margin-right: auto; }
.letter-spacing-wide { letter-spacing: 0.1em; }
.opacity-80 { opacity: 0.8; }
.opacity-90 { opacity: 0.9; }

.text-shadow {
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.color-swatch {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    
    &:hover { transform: scale(1.2); }
}

// Utility for ring animation in form
.ring-2 { box-shadow: 0 0 0 2px var(--q-primary) !important; }
</style>
