<template>
  <div class="chatbot-wrapper">
    <!-- Floating Button -->
    <q-btn
      fab
      icon="smart_toy"
      color="primary"
      class="chatbot-toggle shadow-10"
      @click="toggleChat"
      :class="{ 'is-open': isOpen }"
    >
      <q-badge v-if="!isOpen && unreadCount > 0" color="red" floating>{{ unreadCount }}</q-badge>
    </q-btn>

    <!-- Chat Window -->
    <transition
      appear
      enter-active-class="animated zoomIn"
      leave-active-class="animated zoomOut"
    >
      <q-card v-if="isOpen" class="chatbot-window shadow-24 overflow-hidden">
        <!-- Header -->
        <q-toolbar class="bg-primary text-white shadow-2">
          <q-avatar size="32px" class="q-mr-sm">
            <q-icon name="smart_toy" color="white" />
          </q-avatar>
          <q-toolbar-title class="text-subtitle1 text-weight-bold">
            ClassMaster Smart AI Agent
          </q-toolbar-title>
          <q-btn flat round dense icon="close" @click="isOpen = false" />
        </q-toolbar>

        <!-- Quick Suggestion Chips Header -->
        <div class="bg-grey-2 q-px-sm q-py-xs row q-gutter-xs overflow-auto no-wrap border-bottom">
          <q-chip
            v-for="(chip, cIdx) in quickChips"
            :key="cIdx"
            clickable
            dense
            color="white"
            text-color="primary"
            class="text-weight-bold text-caption shadow-1"
            @click="handleChipClick(chip)"
          >
            {{ chip.label }}
          </q-chip>
        </div>

        <!-- Messages Area -->
        <q-card-section class="chat-messages q-pa-md scroll" id="chat-box">
          <div v-for="(msg, index) in messages" :key="index" class="q-mb-md">
            <q-chat-message
              :name="msg.role === 'ai' ? 'ClassMaster AI' : 'You'"
              :avatar="msg.role === 'ai' ? 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png' : 'https://cdn.quasar.dev/img/boy-avatar.png'"
              :sent="msg.role === 'user'"
              :bg-color="msg.role === 'ai' ? 'white' : 'primary'"
              :text-color="msg.role === 'ai' ? 'grey-9' : 'white'"
              class="shadow-1 rounded-borders"
            >
              <template v-slot:default>
                <div style="white-space: pre-line;">
                  {{ msg.text }}
                </div>
                <!-- Optional Action Button in AI Message -->
                <div v-if="msg.action" class="q-mt-sm">
                  <q-btn
                    unelevated
                    size="sm"
                    color="primary"
                    :label="msg.action.label"
                    no-caps
                    icon="launch"
                    @click="executeAction(msg.action)"
                  />
                </div>
              </template>
            </q-chat-message>
          </div>
          <div v-if="isTyping" class="q-mb-md">
            <q-chat-message
              name="ClassMaster AI"
              avatar="https://cdn-icons-png.flaticon.com/512/4712/4712035.png"
              bg-color="white"
            >
              <q-spinner-dots size="20px" color="primary" />
            </q-chat-message>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Input Area -->
        <q-card-actions class="q-pa-sm bg-white">
          <q-input
            v-model="input"
            dense
            outlined
            placeholder="Ask AI (Sinhala, Singlish, English)..."
            class="full-width rounded-borders custom-chat-input"
            @keyup.enter="sendMessage"
            :disable="isTyping"
          >
            <template v-slot:append>
              <q-btn round flat icon="send" color="primary" @click="sendMessage" :disable="!input.trim() || isTyping" />
            </template>
          </q-input>
        </q-card-actions>
      </q-card>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isOpen = ref(false)
const input = ref('')
const isTyping = ref(false)
const unreadCount = ref(1)

const quickChips = [
  { label: '🎟️ Promo Codes', query: 'What promo codes are available?' },
  { label: '💳 Packages & Pricing', query: 'Show me the 4 package plans and prices' },
  { label: '♾️ Lifetime & Annual', query: 'How does lifetime and annual pricing work?' },
  { label: '📱 SMS Messaging', query: 'How to setup SMS messaging?' },
  { label: '💬 WhatsApp Support', query: 'How can I contact support?' }
]

const messages = ref([
  {
    role: 'ai',
    text: 'Hello! I am your ClassMaster Smart AI Assistant 🤖\nHow can I help you today?\n(ඔබට පැකේජ, Promo codes හෝ පද්ධතිය පිළිබඳ ඕනෑම දෙයක් සිංහල, Singlish හෝ English වලින් ඇසිය හැක)'
  }
])

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unreadCount.value = 0
    scrollToBottom()
  }
}

const scrollToBottom = async () => {
  await nextTick()
  const chatBox = document.getElementById('chat-box')
  if (chatBox) {
    chatBox.scrollTop = chatBox.scrollHeight
  }
}

const handleChipClick = (chip) => {
  input.value = chip.query
  sendMessage()
}

const executeAction = (action) => {
  if (action.type === 'route') {
    router.push(action.url)
    isOpen.value = false
  } else if (action.type === 'link') {
    window.open(action.url, '_blank')
  }
}

const processAIResponse = (userMsg) => {
  const query = userMsg.toLowerCase()

  if (query.includes('promo') || query.includes('discount') || query.includes('voucher') || query.includes('ලබාගත')) {
    return {
      text: `🎟️ **ClassMaster Promo Codes & Discounts**:\n\n• **WELCOME20**: Get 20% OFF on any Package!\n• **ANNUAL50**: Get 50% OFF on Annual Subscriptions!\n• **SUPERDEAL**: LKR 2,000 Flat OFF!\n\nYou can enter these promo codes directly on our Pricing & Subscriptions page to apply discounts.`,
      action: { label: 'Go to Pricing & Apply Promo', type: 'route', url: '/dashboard/pricing' }
    }
  }

  if (query.includes('price') || query.includes('pack') || query.includes('plan') || query.includes('ganan') || query.includes('mila') || query.includes('මිල')) {
    return {
      text: `💳 **ClassMaster 4 Tiered Packages**:\n\n1. **Starter Pack**: LKR 1,500/mo (50 Students, 2 Classes, 1 Staff)\n2. **Standard Pack**: LKR 3,500/mo (250 Students, 10 Classes, Tutes & Exams)\n3. **Pro Pack**: LKR 7,500/mo (1,000 Students, SMS Gateway & Roles)\n4. **Enterprise Pack**: LKR 15,000/mo (Unlimited Scale & Custom Card Branding)\n\n🎁 Save 20% on Annual billing, or choose a **Lifetime Plan**!`,
      action: { label: 'View All Pricing Plans', type: 'route', url: '/dashboard/pricing' }
    }
  }

  if (query.includes('lifetime') || query.includes('annual') || query.includes('year') || query.includes('එක්වරක්')) {
    return {
      text: `♾️ **Annual & Lifetime Pricing Options**:\n\n• **Monthly**: Pay month-by-month as you grow.\n• **Annually**: Save 20% discount (Get ~2 months free every year!).\n• **Lifetime (One-Time)**: Pay once and use forever without monthly renewal fees!\n\nCheck out the toggle on our Pricing page.`,
      action: { label: 'Explore Lifetime & Annual Plans', type: 'route', url: '/dashboard/pricing' }
    }
  }

  if (query.includes('student') || query.includes('lamayi') || query.includes('shishya') || query.includes('සිසුන්')) {
    return {
      text: `👨‍🎓 **Student Management**:\n\nYou can add students, view active & inactive records, assign subjects, generate individual QR code ID cards, and record payments in the Students section.`,
      action: { label: 'Open Students Management', type: 'route', url: '/dashboard/students' }
    }
  }

  if (query.includes('attendance') || query.includes('paminiima') || query.includes('qr') || query.includes('පැමිණීම')) {
    return {
      text: `📸 **Attendance & QR Scanning**:\n\n• Scan student QR cards instantly using the camera scanner.\n• Mark manual attendance class by class.\n• View historical attendance logs & generate monthly reports.`,
      action: { label: 'Open QR Attendance Scanner', type: 'route', url: '/dashboard/scan-qr' }
    }
  }

  if (query.includes('sms') || query.includes('message') || query.includes('whatsapp') || query.includes('පණිවිඩ')) {
    return {
      text: `📱 **SMS & Messaging Gateway**:\n\nSend bulk automated class reminders, fee payment receipts, exam result alerts, and custom SMS notifications to students and parents!`,
      action: { label: 'Configure Messaging', type: 'route', url: '/dashboard/messages' }
    }
  }

  if (query.includes('contact') || query.includes('support') || query.includes('help') || query.includes('උදව්')) {
    return {
      text: `📞 **Customer Support**:\n\nOur team is available 24/7 on WhatsApp at **+94 70 283 8364** or email **sejanrandinu01@gmail.com**.`,
      action: { label: 'Contact WhatsApp Support', type: 'link', url: 'https://wa.me/94702838364' }
    }
  }

  return {
    text: `Subha Dawasak! (ආයුබෝවන්!) I am here to assist you with ClassMaster management, packages, promo codes, QR scanning, and attendance. How can I help you right now?`
  }
}

const sendMessage = async () => {
  if (!input.value.trim() || isTyping.value) return

  const userMsg = input.value.trim()
  messages.value.push({ role: 'user', text: userMsg })
  input.value = ''
  scrollToBottom()

  isTyping.value = true

  setTimeout(() => {
    const aiResp = processAIResponse(userMsg)
    messages.value.push({ role: 'ai', text: aiResp.text, action: aiResp.action })
    isTyping.value = false
    scrollToBottom()
  }, 600)
}
</script>

<style scoped>
.chatbot-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10000;
}

.chatbot-toggle {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.chatbot-toggle.is-open {
  transform: rotate(90deg);
}

.chatbot-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 380px;
  height: 520px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-messages {
  flex-grow: 1;
  background: #f8f9fa;
}

.custom-chat-input :deep(.q-field__control) {
  border-radius: 20px;
}

@media (max-width: 600px) {
  .chatbot-window {
    width: calc(100vw - 32px);
    height: 440px;
  }
}
</style>
