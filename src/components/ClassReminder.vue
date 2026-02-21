<template>
  <!-- Invisible component for background logic -->
  <div v-if="false"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { client } from 'src/api'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const classes = ref([])
const timer = ref(null)
const lastNotified = ref({}) // Format: { classId_minutesLeft: timestamp }

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const fetchTodayClasses = async () => {
  const today = DAYS[new Date().getDay()]
  try {
    const data = await client.get('classes')
    if (data) {
      classes.value = data.filter(c => c.day === today && c.status === 'Active')
    }
  } catch {
    // Ignore
  }
}

const checkReminders = () => {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  classes.value.forEach(cls => {
    if (!cls.start_time) return

    const [h, m] = cls.start_time.split(':').map(Number)
    const classMinutes = h * 60 + m
    const diff = classMinutes - currentMinutes

    const reminderIntervals = [30, 25, 20, 15, 10, 5, 0]
    
    if (reminderIntervals.includes(diff)) {
      const key = `${cls.id}_${diff}`
      const nowTs = Date.now()
      
      if (!lastNotified.value[key] || (nowTs - lastNotified.value[key] > 61000)) {
        triggerNotification(cls, diff)
        lastNotified.value[key] = nowTs
      }
    }
  })
}

const triggerNotification = async (cls, diff) => {
  const messageText = diff === 0 
    ? `Class "${cls.class_name}" is starting NOW!` 
    : `Reminder: "${cls.class_name}" starts in ${diff} minutes.`

  const actions = [{ label: 'Dismiss', color: 'white' }]

  if (diff === 30) {
    actions.push({
      label: 'Notify Students (WA)',
      color: 'yellow',
      handler: async () => {
        try {
          const data = await client.get('students')
          if (data) {
            const targetStudents = data.filter(s => s.grade === cls.grade && s.status === 'Active' && s.subjects?.includes(cls.subject))
            if (targetStudents.length === 0) {
              $q.notify({ type: 'info', message: 'No students found for this class.' })
              return
            }

            const waMessage = `⏰ *Class Starting Soon!*\n\nClass: ${cls.class_name}\nStarts in: 30 minutes\nTutor: ${cls.tutor}\n\nGet ready! 🚀`
            targetStudents.forEach(std => {
              let phone = std.contact
              if (phone) {
                if (phone.startsWith('0')) phone = '94' + phone.substring(1)
                phone = phone.replace(/\D/g, '')
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`, '_blank')
              }
            })
            $q.notify({ type: 'positive', message: `Opening WhatsApp for ${targetStudents.length} students.` })
          }
        } catch {
          // Ignore
        }
      }
    })
  }

  $q.notify({
    type: diff === 0 ? 'warning' : 'info',
    message: messageText,
    caption: `${cls.subject} | ${cls.tutor}`,
    position: 'top-right',
    icon: 'notifications_active',
    timeout: 15000,
    actions: actions
  })

  if (Notification.permission === 'granted') {
    new Notification('Class Reminder', {
      body: messageText,
      icon: '/icons/favicon-128x128.png'
    })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission()
  }
}

onMounted(() => {
  fetchTodayClasses()
  setTimeout(checkReminders, 2000)
  timer.value = setInterval(() => {
    if (new Date().getMinutes() % 10 === 0 && new Date().getSeconds() < 30) {
      fetchTodayClasses()
    }
    checkReminders()
  }, 30000)

  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})
</script>
