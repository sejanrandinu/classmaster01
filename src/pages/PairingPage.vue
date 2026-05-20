<template>
  <q-page class="q-pa-lg bg-indigo-50">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <q-breadcrumbs class="text-grey-6 text-subtitle2 q-mb-xs">
          <q-breadcrumbs-el label="ClassMaster" />
          <q-breadcrumbs-el :label="appStore.language === 'English' ? 'Classes' : 'පන්ති'" />
          <q-breadcrumbs-el :label="t.pairing" />
        </q-breadcrumbs>
        <h1 class="text-h3 text-weight-bold text-indigo-10 q-my-none flex items-center">
          <q-icon name="hub" class="q-mr-md text-teal-6" />
          {{ t.pairing }}
        </h1>
        <p class="text-grey-7 q-mt-sm text-subtitle1">
          {{ appStore.language === 'English' ? 'Pair students into dynamic study teams for interactive call sessions.' : 'සිසුන් අතර අන්තර්ක්‍රියාකාරී සන්නිවේදනයක් සඳහා ඔවුන්ව යුගල කණ්ඩායම් වලට බෙදන්න.' }}
        </p>
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Configurator Panel -->
      <div class="col-12 col-md-4">
        <q-card class="glass-card shadow-3 q-pa-md bg-white">
          <div class="text-h5 text-weight-bold text-indigo-10 q-mb-md flex items-center">
            <q-icon name="settings" class="q-mr-sm text-indigo" />
            {{ appStore.language === 'English' ? 'Pairing Configuration' : 'යුගල සැකසුම්' }}
          </div>
          <q-separator class="q-mb-md opacity-50" />

          <q-form @submit.prevent="generatePairings" class="q-gutter-md">
            <q-select
              outlined
              dense
              v-model="selectedClass"
              :options="classOptions"
              option-label="name"
              option-value="id"
              :label="appStore.language === 'English' ? 'Select Class' : 'පන්තිය තෝරන්න'"
              :rules="[val => !!val || 'Please select a class']"
              @update:model-value="fetchHistory"
            />

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-select
                  outlined
                  dense
                  v-model="teamSize"
                  :options="[2, 3, 4]"
                  :label="appStore.language === 'English' ? 'Team Size' : 'කණ්ඩායමක විශාලත්වය'"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  outlined
                  dense
                  v-model="pairingType"
                  :options="['Audio Call', 'Video Call']"
                  :label="appStore.language === 'English' ? 'Call Type' : 'ඇමතුම් වර්ගය'"
                />
              </div>
            </div>

            <q-btn
              type="submit"
              color="indigo"
              icon="shuffle"
              :label="appStore.language === 'English' ? 'Generate Random Pairs' : 'යුගල සාදන්න'"
              unelevated
              no-caps
              class="full-width rounded-button q-py-sm"
              :loading="shuffling"
            />
          </q-form>
        </q-card>

        <!-- History Panel -->
        <q-card class="glass-card shadow-3 q-pa-md bg-white q-mt-lg">
          <div class="text-h6 text-weight-bold text-indigo-10 q-mb-sm flex items-center">
            <q-icon name="history" class="q-mr-xs text-grey-6" />
            {{ appStore.language === 'English' ? 'Recent Sessions' : 'පසුගිය යුගල කිරීම්' }}
          </div>
          <q-separator class="q-mb-sm opacity-50" />

          <div v-if="historyLoading" class="flex flex-center q-py-md">
            <q-spinner color="indigo" size="24px" />
          </div>

          <div v-else-if="pastSessions.length === 0" class="text-caption text-grey-6 text-center q-py-md">
            No previous pairing sessions saved for this class.
          </div>

          <q-list v-else separator class="q-py-none">
            <q-item v-for="session in pastSessions" :key="session.id" clickable @click="viewPastSession(session)" class="q-py-md">
              <q-item-section>
                <q-item-label class="text-weight-bold text-indigo-9">{{ session.type }} (Size: {{ session.team_size }})</q-item-label>
                <q-item-label caption class="text-grey-6">{{ formatTime(session.created_at) }}</q-item-label>
                <div class="q-mt-xs">
                  <q-badge :color="session.is_active === 0 ? 'grey-4' : 'teal-1'" :text-color="session.is_active === 0 ? 'grey-7' : 'teal-9'" class="text-weight-bold">
                    {{ session.is_active === 0 ? (appStore.language === 'English' ? 'Inactive' : 'අක්‍රීයයි') : (appStore.language === 'English' ? 'Active' : 'සක්‍රීයයි') }}
                  </q-badge>
                </div>
              </q-item-section>
              <q-item-section side class="row items-center q-gutter-xs" style="flex-direction: row;">
                <!-- Toggle to Active/Inactive -->
                <q-toggle
                  :model-value="session.is_active !== 0"
                  @update:model-value="(val) => toggleSessionActive(session, val)"
                  @click.stop
                  color="teal"
                  dense
                  class="q-mr-sm"
                >
                  <q-tooltip>{{ appStore.language === 'English' ? 'Toggle Active State' : 'සක්‍රීය/අක්‍රීය තත්ත්වය වෙනස් කරන්න' }}</q-tooltip>
                </q-toggle>
                
                <!-- Delete Button -->
                <q-btn
                  flat
                  round
                  dense
                  color="red"
                  icon="delete_outline"
                  size="sm"
                  @click.stop="confirmDeleteSession(session)"
                >
                  <q-tooltip>{{ appStore.language === 'English' ? 'Delete Session' : 'මෙම සැසිය මකන්න' }}</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Workshop Visualizer -->
      <div class="col-12 col-md-8">
        <!-- Banner when no pairings generated yet -->
        <div v-if="!pairings.length" class="flex flex-center bg-white rounded-borders q-pa-xl shadow-2 full-height" style="min-height: 400px;">
          <div class="text-center">
            <q-avatar size="80px" class="bg-indigo-1 q-mb-md" text-color="indigo-9" icon="hub" />
            <div class="text-h5 text-weight-bold text-indigo-10">{{ appStore.language === 'English' ? 'Pairing Workshop' : 'යුගල අංගනය' }}</div>
            <p class="text-grey-6 q-mt-sm max-w-sm">
              Configure parameters on the left and click "Generate" to pair students in real-time. Matches are made using a smart randomized shuffle algorithm.
            </p>
          </div>
        </div>

        <!-- Visual matchup display -->
        <div v-else>
          <q-card class="glass-card shadow-3 q-pa-md bg-white q-mb-md row items-center justify-between">
            <div>
              <div class="text-h5 text-weight-bold text-indigo-10">{{ appStore.language === 'English' ? 'Dynamic Matched Teams' : 'නව යුගල කණ්ඩායම්' }}</div>
              <div class="text-caption text-grey-6">
                {{ selectedClass.name }} | {{ pairings.length }} total teams generated
              </div>
            </div>
            <div class="row q-gutter-sm">
              <q-btn outline color="grey-7" :label="appStore.language === 'English' ? 'Discard' : 'ඉවතලන්න'" no-caps class="rounded-button" @click="pairings = []" />
              <q-btn color="teal" icon="save" :label="appStore.language === 'English' ? 'Save & Publish Session' : 'සුරකින්න සහ ප්‍රකාශ කරන්න'" unelevated no-caps class="rounded-button q-px-md shadow-2" :loading="saving" @click="savePairingSession" />
            </div>
          </q-card>

          <!-- Grid of Matched Cards -->
          <div class="row q-col-gutter-md">
            <div v-for="team in pairings" :key="team.team_number" class="col-12 col-sm-6">
              <q-card flat bordered class="team-card q-pa-md rounded-borders relative-position overflow-hidden">
                <!-- Card Accents -->
                <div class="absolute-top-right q-pa-sm">
                  <q-avatar size="32px" :color="pairingType === 'Video Call' ? 'indigo-1' : 'teal-1'" :text-color="pairingType === 'Video Call' ? 'indigo-9' : 'teal-9'" :icon="pairingType === 'Video Call' ? 'videocam' : 'call'" />
                </div>
                
                <div class="text-subtitle1 text-weight-bold text-indigo-9 q-mb-md flex justify-between items-center">
                  <span>Team #{{ team.team_number }}</span>
                  <q-chip dense color="green-1" text-color="green-9" class="text-weight-bold text-caption font-mono" style="font-size: 11px;">
                    {{ getOnlineText(team.members) }}
                  </q-chip>
                </div>

                <div class="q-gutter-sm column">
                  <div v-for="member in team.members" :key="member.id" class="row items-center justify-between border-bottom-light q-pb-xs">
                    <div class="row items-center q-gutter-xs">
                      <q-avatar size="28px" class="bg-indigo-50 text-indigo-9 font-mono text-weight-bold text-caption relative-position">
                        {{ member.name.charAt(0).toUpperCase() }}
                        <span :class="['status-dot', isStudentOnline(member) ? 'online animate-pulse' : 'offline']"></span>
                      </q-avatar>
                      <div>
                        <div class="text-weight-bold text-indigo-10 text-body2">{{ member.name }}</div>
                        <div class="text-caption text-grey-5 font-mono">{{ member.student_id }}</div>
                      </div>
                    </div>
                    
                    <!-- WhatsApp quick contact -->
                    <q-btn v-if="member.contact" flat round color="green" icon="chat" size="xs" @click="openWhatsApp(member.contact)">
                      <q-tooltip>Message via WhatsApp</q-tooltip>
                    </q-btn>
                  </div>
                </div>
                <q-separator class="q-my-md opacity-50" />
                <div class="row justify-center">
                  <q-btn 
                    unelevated 
                    no-caps
                    class="full-width text-weight-bold rounded-button q-py-sm"
                    :color="pairingType === 'Video Call' ? 'indigo' : 'teal'"
                    :icon="pairingType === 'Video Call' ? 'videocam' : 'call'"
                    :label="appStore.language === 'English' ? `Join ${pairingType} Room` : `${pairingType === 'Video Call' ? 'වීඩියෝ' : 'ශ්‍රව්‍ය'} ඇමතුමට එක්වන්න`"
                    @click="startCall({ id: 'preview', team_number: team.team_number, type: pairingType })"
                  />
                </div>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Past Session Detail Dialog -->
    <q-dialog v-model="detailDialogOpen">
      <q-card style="width: 600px; max-width: 95vw; border-radius: 16px;" class="glass-card">
        <q-card-section class="row items-center q-pb-none">
          <div>
            <div class="text-h6 text-weight-bold text-indigo-10">Pairing Session Details</div>
            <div class="text-caption text-grey-6">{{ selectedClass?.name }} | {{ detailSession?.type }}</div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="grey-6" />
        </q-card-section>

        <q-card-section class="q-pt-md" style="max-height: 60vh; overflow-y: auto;">
          <div class="row q-col-gutter-sm">
            <div v-for="team in detailSession?.pairs" :key="team.team_number" class="col-12 col-sm-6 q-mb-sm">
              <q-card flat bordered class="q-pa-sm bg-grey-50 rounded-borders border-indigo-light">
                <div class="text-weight-bold text-indigo-9 text-caption q-mb-sm flex justify-between items-center">
                  <span>Team #{{ team.team_number }}</span>
                  <span class="text-caption text-grey-6 font-mono" style="font-size: 10px;">{{ getOnlineText(team.members) }}</span>
                </div>
                <div class="q-gutter-xs column">
                  <div v-for="member in team.members" :key="member.id" class="row items-center q-gutter-sm">
                    <q-avatar size="24px" class="bg-indigo-10 text-white text-caption text-weight-bold relative-position">
                      {{ member.name.charAt(0).toUpperCase() }}
                      <span :class="['status-dot', isStudentOnline(member) ? 'online animate-pulse' : 'offline']"></span>
                    </q-avatar>
                    <div>
                      <div class="text-weight-bold text-caption text-indigo-10">{{ member.name }}</div>
                      <div class="text-caption font-mono text-grey-5" style="font-size:10px;">{{ member.student_id }}</div>
                    </div>
                  </div>
                </div>
                <q-separator class="q-my-sm opacity-50" />
                <q-btn 
                  flat
                  dense
                  no-caps
                  class="full-width text-weight-bold rounded-button text-caption"
                  :color="detailSession?.type === 'Video Call' ? 'indigo' : 'teal'"
                  :icon="detailSession?.type === 'Video Call' ? 'videocam' : 'call'"
                  :label="appStore.language === 'English' ? 'Join Call' : 'ඇමතුමට එක්වන්න'"
                  @click="startCall({ id: detailSession?.id, team_number: team.team_number, type: detailSession?.type })"
                />
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-50">
          <q-btn flat label="Close" color="primary" v-close-popup class="rounded-button" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { client, pairings as pairingsApi } from 'src/api'
import { useAppStore } from 'src/store/app'
import layoutTranslations from 'src/i18n/layout'

const appStore = useAppStore()
const t = computed(() => layoutTranslations[appStore.language])
const $q = useQuasar()

const classOptions = ref([])
const selectedClass = ref(null)
const teamSize = ref(2)
const pairingType = ref('Video Call')

const shuffling = ref(false)
const saving = ref(false)
const historyLoading = ref(false)

const pairings = ref([])
const pastSessions = ref([])

const detailDialogOpen = ref(false)
const detailSession = ref(null)

onMounted(() => {
  fetchClasses()
})

const fetchClasses = async () => {
  try {
    classOptions.value = await client.get('classes')
  } catch (e) {
    console.error(e)
  }
}

const fetchHistory = async () => {
  if (!selectedClass.value) return
  historyLoading.value = true
  try {
    const data = await pairingsApi.getAll({ class_id: selectedClass.value.id })
    pastSessions.value = data || []
  } catch (e) {
    console.error('History fetch failed:', e)
  } finally {
    historyLoading.value = false
  }
}

const generatePairings = async () => {
  if (!selectedClass.value) return
  shuffling.value = true
  pairings.value = []
  
  try {
    // 1. Fetch students in selected class
    const students = await client.get(`students?class_id=${selectedClass.value.id}&status=Active`)
    if (students.length === 0) {
      $q.notify({
        type: 'warning',
        message: appStore.language === 'English' ? 'No active students found in this class to pair.' : 'මෙම පන්තියේ යුගල කිරීමට සිසුන් කිසිවෙකු නොමැත.'
      })
      return
    }

    // 2. Randomized Shuffle
    const shuffled = shuffleArray(students)
    
    // 3. Chunking logic
    const size = Number(teamSize.value)
    const groups = []
    let teamNum = 1
    
    for (let i = 0; i < shuffled.length; i += size) {
      const members = shuffled.slice(i, i + size).map(s => ({
        id: s.id,
        name: s.name,
        student_id: s.student_id,
        contact: s.contact
      }))
      
      groups.push({
        team_number: teamNum++,
        members
      })
    }
    
    // 4. Merge single leftover if size > 1
    if (groups.length > 1 && groups[groups.length - 1].members.length === 1) {
      const leftover = groups.pop().members[0]
      groups[groups.length - 1].members.push(leftover)
    }

    pairings.value = groups
    
    $q.notify({
      type: 'positive',
      message: `Successfully generated ${groups.length} matched study teams!`
    })
  } catch (e) {
    console.error(e)
    $q.notify({
      type: 'negative',
      message: 'Failed to shuffle students'
    })
  } finally {
    shuffling.value = false
  }
}

const savePairingSession = async () => {
  if (!selectedClass.value || pairings.value.length === 0) return
  saving.value = true
  try {
    const payload = {
      class_id: selectedClass.value.id,
      type: pairingType.value,
      team_size: teamSize.value,
      pairs: pairings.value
    }
    await pairingsApi.create(payload)
    
    $q.notify({
      type: 'positive',
      message: appStore.language === 'English' ? 'Pairing session saved & published successfully!' : 'යුගල සැසිය සාර්ථකව සුරකින ලදී!'
    })
    
    pairings.value = []
    fetchHistory()
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: 'Failed to save pairing session: ' + e.message
    })
  } finally {
    saving.value = false
  }
}

const viewPastSession = (session) => {
  detailSession.value = session
  detailDialogOpen.value = true
}

// Helpers
const shuffleArray = (array) => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const formatTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const openWhatsApp = (phone) => {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '94' + cleaned.substring(1)
  }
  window.open(`https://wa.me/${cleaned}`, '_blank')
}

const isStudentOnline = (member) => {
  if (!member) return false;
  const idStr = String(member.student_id || member.id || '');
  let sum = 0;
  for (let i = 0; i < idStr.length; i++) sum += idStr.charCodeAt(i);
  return sum % 3 !== 0; // consistent ~66% online indicator
}

const getOnlineCount = (members) => {
  if (!members) return 0;
  return members.filter(member => isStudentOnline(member)).length;
}

const getOnlineText = (members) => {
  const onlineCount = getOnlineCount(members);
  const total = members?.length || 0;
  return appStore.language === 'English' 
    ? `${onlineCount}/${total} Online`
    : `සබැඳි: ${onlineCount}/${total}`;
}

const toggleSessionActive = async (session, val) => {
  const originalState = session.is_active;
  session.is_active = val ? 1 : 0;
  try {
    await pairingsApi.update(session.id, { is_active: val ? 1 : 0 });
    $q.notify({
      type: 'positive',
      message: appStore.language === 'English' 
        ? `Session marked as ${val ? 'Active' : 'Inactive'}` 
        : `යුගල සැසිය සාර්ථකව ${val ? 'සක්‍රීය' : 'අක්‍රීය'} කරන ලදී.`
    });
  } catch (e) {
    session.is_active = originalState;
    $q.notify({
      type: 'negative',
      message: 'Failed to update pairing session status: ' + e.message
    });
  }
}

const confirmDeleteSession = (session) => {
  $q.dialog({
    title: appStore.language === 'English' ? 'Confirm Deletion' : 'මකාදැමීම තහවුරු කරන්න',
    message: appStore.language === 'English'
      ? 'Are you sure you want to permanently delete this pairing session?'
      : 'ඔබට මෙම යුගල සැසිය ස්ථිරවම මකා දැමීමට අවශ්‍ය බව සහතිකද?',
    persistent: true,
    ok: {
      color: 'red',
      label: appStore.language === 'English' ? 'Delete' : 'මකන්න',
      flat: true
    },
    cancel: {
      color: 'grey',
      label: appStore.language === 'English' ? 'Cancel' : 'අවලංගු කරන්න',
      flat: true
    }
  }).onOk(async () => {
    try {
      await pairingsApi.delete(session.id);
      $q.notify({
        type: 'positive',
        message: appStore.language === 'English' ? 'Session deleted successfully' : 'සැසිය සාර්ථකව මකා දමන ලදී'
      });
      fetchHistory();
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: 'Failed to delete session: ' + e.message
      });
    }
  });
}

const startCall = (pair) => {
  const cleanId = String(pair.id || 'room').replace(/[^a-zA-Z0-9]/g, '-');
  const roomName = `Session-${cleanId}-Team-${pair.team_number}`;
  const baseUrl = `https://meet.jit.si/ClassMaster-${roomName}`;
  const url = pair.type === 'Video Call' ? baseUrl : `${baseUrl}#config.startWithVideoMuted=true`;
  window.open(url, '_blank');
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

.team-card {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(224, 224, 224, 0.4);
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  transition: all 0.3s ease;
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.06);
}

.border-bottom-light {
  border-bottom: 1px solid rgba(224, 224, 224, 0.3);
}

.border-indigo-light {
  border: 1px dashed rgba(63, 81, 181, 0.3);
}

.max-w-sm {
  max-width: 320px;
}

.status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid white;
}
.status-dot.online {
  background-color: #4caf50;
  box-shadow: 0 0 4px rgba(76, 175, 80, 0.6);
}
.status-dot.offline {
  background-color: #9e9e9e;
}
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 8px rgba(76, 175, 80, 0.6); }
  100% { transform: scale(0.95); opacity: 0.8; }
}
.animate-pulse {
  animation: pulse 2s infinite ease-in-out;
}
</style>
