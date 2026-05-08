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

const getColomboTime = () => {
    // Return a date object adjusted to Colombo Time (+5:30)
    return new Date(Date.now() + 5.5 * 3600000)
}

const fetchTodayClasses = async () => {
  try {
    console.log('ClassReminder: Fetching today\'s schedule...')
    const data = await client.get('schedule/today')
    if (data) {
      classes.value = data
      console.log(`ClassReminder: Loaded ${data.length} classes for today.`)
    }
  } catch (e) {
    console.error('ClassReminder: Fetch error:', e)
  }
}

const checkReminders = () => {
  const now = getColomboTime()
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()

  classes.value.forEach(cls => {
    if (!cls.start_time) return

    const [h, m] = cls.start_time.split(':').map(Number)
    const classMinutes = h * 60 + m
    const diff = classMinutes - currentMinutes

    const reminderIntervals = [30, 15, 5, 0]
    
    // Check if we are within 1 minute of a reminder interval
    const matchedInterval = reminderIntervals.find(interval => diff === interval)
    
    if (matchedInterval !== undefined) {
      const key = `${cls.id}_${matchedInterval}`
      const nowTs = Date.now()
      
      // Only notify once per interval per 2 minutes to avoid double triggers
      if (!lastNotified.value[key] || (nowTs - lastNotified.value[key] > 120000)) {
        console.log(`ClassReminder: Triggering reminder for ${cls.name} at ${matchedInterval}m`)
        triggerNotification(cls, matchedInterval)
        lastNotified.value[key] = nowTs
      }
    }
  })
}

const triggerNotification = async (cls, diff) => {
  const className = cls.name || cls.class_name
  const subjectName = cls.subject_name || cls.subject
  const tutorName = cls.tutor_name || cls.tutor

  const messageText = diff === 0 
    ? `Class "${className}" is starting NOW!` 
    : `Reminder: "${className}" starts in ${diff} minutes.`

  const actions = [{ label: 'Dismiss', color: 'white' }]

  if (diff === 30) {
    actions.push({
      label: 'Notify Students (WA)',
      color: 'yellow',
      handler: async () => {
        try {
          const data = await client.get('students')
          if (data) {
            const targetStudents = data.filter(s => s.grade === cls.grade && s.status === 'Active' && s.subjects?.includes(subjectName))
            if (targetStudents.length === 0) {
              $q.notify({ type: 'info', message: 'No students found for this class.' })
              return
            }

            const waMessage = `⏰ *Class Starting Soon!*\n\nClass: ${className}\nStarts in: 30 minutes\nTutor: ${tutorName}\n\nGet ready! 🚀`
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
    caption: `${subjectName} | ${tutorName}`,
    position: 'top-right',
    avatar: '/favicon.svg',
    timeout: 15000,
    actions: actions
  })

  if (window.Notification && Notification.permission === 'granted') {
    new Notification('Class Reminder', {
      body: messageText,
      icon: '/favicon.svg'
    })
  }
}

onMounted(() => {
  fetchTodayClasses()
  
  // Initial check after a short delay
  setTimeout(checkReminders, 3000)

  // Run check every 30 seconds
  timer.value = setInterval(() => {
    const now = getColomboTime()
    // Re-fetch classes every hour or if classes list is empty
    if (now.getUTCMinutes() === 0 || classes.value.length === 0) {
      fetchTodayClasses()
    }
    checkReminders()
  }, 30000)

  if (window.Notification && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})
</script>
