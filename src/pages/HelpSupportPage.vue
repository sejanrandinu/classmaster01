<template>
  <q-page class="q-pa-lg bg-grey-1">
    <div class="row q-col-gutter-lg justify-center">
      <div class="col-12 text-center">
        <h1 class="text-h3 text-weight-bold text-grey-9 q-mb-md">{{ t.title }}</h1>
        <p class="text-subtitle1 text-grey-7 q-mb-xl">{{ t.subtitle }}</p>
      </div>

      <!-- Support Cards -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="rounded-borders hover-card bg-white text-center q-pa-xl">
          <q-icon name="live_help" size="64px" color="primary" class="q-mb-md" />
          <div class="text-h6 text-weight-bold q-mb-sm">{{ t.commonFaqs }}</div>
          <div class="text-body2 text-grey-7 q-mb-lg">{{ t.faqDesc }}</div>
          <q-btn flat color="primary" :label="t.readFaqs" no-caps class="text-weight-bold" @click="scrollToFaqs" />
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered class="rounded-borders hover-card bg-white text-center q-pa-xl">
          <q-icon name="fa-brands fa-whatsapp" size="64px" color="green-7" class="q-mb-md" />
          <div class="text-h6 text-weight-bold q-mb-sm">{{ t.whatsappSupport }}</div>
          <div class="text-body2 text-grey-7 q-mb-lg">{{ t.whatsappDesc }}</div>
          <q-btn flat color="green-7" :label="t.chatNow" no-caps class="text-weight-bold" @click="chatOnWhatsapp" />
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card flat bordered class="rounded-borders hover-card bg-white text-center q-pa-xl">
          <q-icon name="email" size="64px" color="orange" class="q-mb-md" />
          <div class="text-h6 text-weight-bold q-mb-sm">{{ t.emailInquiry }}</div>
          <div class="text-body2 text-grey-7 q-mb-lg">{{ t.emailDesc }}</div>
          <q-btn flat color="orange" :label="t.sendEmail" no-caps class="text-weight-bold" @click="sendEmail" />
        </q-card>
      </div>

      <!-- FAQ Accordion -->
      <div id="faq-section" class="col-12 col-md-10 q-mt-xl">
        <div class="text-h5 text-weight-bold q-mb-lg">{{ t.frequentQuestions }}</div>
        <q-list bordered class="rounded-borders bg-white separator">
          <q-expansion-item
            v-for="(faq, index) in faqs"
            :key="index"
            group="faq"
            :icon="faq.icon"
            :label="faq.question"
            header-class="text-weight-medium"
          >
            <q-card>
              <q-card-section class="text-grey-8">
                {{ faq.answer }}
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from 'src/store/app'

const appStore = useAppStore()

const content = {
  English: {
    title: 'Help & Support',
    subtitle: "We're here to help you get the most out of ClassMaster",
    commonFaqs: 'Common FAQs',
    faqDesc: 'Quick answers to common questions about marking attendance, fees, and QR codes.',
    readFaqs: 'Read FAQs',
    whatsappSupport: 'WhatsApp Support',
    whatsappDesc: 'Need urgent help? Chat directly with our technical support team via WhatsApp.',
    chatNow: 'Chat Now',
    emailInquiry: 'Email Inquiry',
    emailDesc: 'For billing inquiries, technical issues or partnership requests, send us an email.',
    sendEmail: 'Send Email',
    frequentQuestions: 'Frequently Asked Questions',
    faqs: [
      {
        icon: 'person_add',
        question: 'How do I register a new student?',
        answer: 'Navigate to the Students page and click "Add New Student". Fill in the student details including their name, contact information, and parent details. Once saved, the system will automatically generate a unique QR code for the student.'
      },
      {
        icon: 'qr_code_scanner',
        question: 'How do I scan a QR code from a photo?',
        answer: 'Go to the Scan QR Code page and click "Upload Image". Select the student card photo from your gallery. The system will decode the QR code and record attendance instantly.'
      },
      {
        icon: 'payments',
        question: 'How to record fee payments?',
        answer: 'Visit the Collect Fees page, search for the student name or scan their ID. Select the class month and enter the amount. You can also specify the payment method (Cash or Bank Deposit).'
      },
      {
        icon: 'history',
        question: 'Can I view attendance history for a specific class?',
        answer: 'Yes! Go to the Attendance History page. You can filter records by date, student name, or class to see exactly who attended and when.'
      },
      {
        icon: 'security',
        question: 'Is my data secure and private?',
        answer: 'Absolutely. We use industry-standard encryption and Supabase Row Level Security. Your tuition data is only accessible to you and your authorized staff members.'
      }
    ]
  },
  Sinhala: {
    title: 'උදව් සහ සහාය',
    subtitle: "ClassMaster පද්ධතියෙන් උපරිම ප්‍රයෝජන ගැනීමට අපි ඔබට සහාය වන්නෙමු",
    commonFaqs: 'පොදු ගැටළු (FAQs)',
    faqDesc: 'පැමිණීම සලකුණු කිරීම, ගාස්තු සහ QR කේත පිළිබඳ පොදු ප්‍රශ්නවලට ඉක්මන් පිළිතුරු.',
    readFaqs: 'FAQs කියවන්න',
    whatsappSupport: 'WhatsApp සහාය',
    whatsappDesc: 'හදිසි සහායක් අවශ්‍යද? WhatsApp හරහා අපගේ තාක්ෂණික සහාය කණ්ඩායම සමඟ සෘජුවම සම්බන්ධ වන්න.',
    chatNow: 'සම්බන්ධ වන්න',
    emailInquiry: 'විද්‍යුත් තැපෑල',
    emailDesc: 'ගෙවීම් ගැටළු, තාක්ෂණික ගැටළු හෝ වෙනත් විමසීම් සඳහා අපට විද්‍යුත් තැපෑලක් එවන්න.',
    sendEmail: 'විද්‍යුත් තැපෑලක් යවන්න',
    frequentQuestions: 'නිතර අසනු ලබන ප්‍රශ්න',
    faqs: [
      {
        icon: 'person_add',
        question: 'නව ශිෂ්‍යයෙකු ලියාපදිංචි කරන්නේ කෙසේද?',
        answer: 'සිසුන් (Students) පිටුවට ගොස් "Add New Student" මත ක්ලික් කරන්න. ශිෂ්‍යයාගේ නම, සම්බන්ධතා විස්තර සහ මව්පියන්ගේ විස්තර ඇතුළත් කරන්න. එය සුරකින ලද පසු, පද්ධතිය ස්වයංක්‍රීයව එම ශිෂ්‍යයා සඳහා අද්විතීය QR කේතයක් සාදනු ඇත.'
      },
      {
        icon: 'qr_code_scanner',
        question: 'ඡායාරූපයකින් QR කේතයක් ස්කෑන් කරන්නේ කෙසේද?',
        answer: 'Scan QR Code පිටුවට ගොස් "Upload Image" මත ක්ලික් කරන්න. ඔබ සතු ශිෂ්‍ය කාඩ්පතේ ඡායාරූපය තෝරන්න. පද්ධතිය ස්වයංක්‍රීයව QR කේතය කියවා පැමිණීම වාර්තා කරනු ඇත.'
      },
      {
        icon: 'payments',
        question: 'පන්ති ගාස්තු ගෙවීම් වාර්තා කරන්නේ කෙසේද?',
        answer: 'Collect Fees පිටුවට ගොස් ශිෂ්‍යයාගේ නම සෙවීම හෝ QR කේතය ස්කෑන් කරන්න. අදාළ පන්තිය සහ මාසය තෝරා මුදල ඇතුළත් කරන්න. මුදල් (Cash) හෝ බැංකු තැන්පතුව (Bank Deposit) ලෙස ගෙවීම් ක්‍රමය සඳහන් කළ හැක.'
      },
      {
        icon: 'history',
        question: 'පංතියක පැමිණීමේ ඉතිහාසය නැරඹිය හැකිද?',
        answer: 'ඔව්! පැමිණීමේ ඉතිහාසය (Attendance History) පිටුවට යන්න. එහිදී දිනය, ශිෂ්‍ය නාමය හෝ පන්තිය අනුව පෙරීම (Filter) කර අදාළ දත්ත නැරඹිය හැක.'
      },
      {
        icon: 'security',
        question: 'මගේ දත්ත ආරක්ෂිතද?',
        answer: 'අනිවාර්යයෙන්ම. අපි නවීනතම ආරක්ෂණ ක්‍රමවේද සහ Supabase Row Level Security භාවිතා කරමු. ඔබේ දත්ත වලට ප්‍රවේශ විය හැක්කේ ඔබට සහ ඔබ අනුමත කළ කාර්ය මණ්ඩලයට පමණි.'
      }
    ]
  }
}

const t = computed(() => content[appStore.language])
const faqs = computed(() => t.value.faqs)

const scrollToFaqs = () => {
  const el = document.getElementById('faq-section')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const chatOnWhatsapp = () => {
  window.open('https://wa.me/94702838364', '_blank')
}

const sendEmail = () => {
  window.location.href = 'mailto:superadmin@classmastertms.com'
}
</script>

<style scoped>
.hover-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.hover-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
}
</style>
