<template>
  <q-page class="bg-black text-white q-py-xl">
    <div class="container-xl q-px-md">
      <div class="glass-card q-pa-xl rounded-borders">
        <h1 class="text-h3 text-weight-bolder q-mb-xl text-gradient">{{ t.contactUs }}</h1>
        
        <div class="row q-col-gutter-xl">
          <div class="col-12 col-md-6">
            <h2 class="text-h5 text-white text-weight-bold q-mb-md">{{ appStore.language === 'English' ? 'Get in Touch' : 'අප හා සම්බන්ධ වන්න' }}</h2>
            <p class="text-grey-4">{{ appStore.language === 'English' ? 'Have questions about ClassMaster? Our team is here to help you modernize your institute.' : 'ClassMaster පිළිබඳ ගැටළු තිබේද? ඔබේ ආයතනය නවීකරණය කිරීමට අපගේ කණ්ඩායම සූදානම්.' }}</p>
            
            <q-list class="q-mt-lg">
              <q-item class="q-px-none">
                <q-item-section avatar>
                  <q-icon name="mail" color="white" />
                </q-item-section>
                <q-item-section class="text-white">sejanrandinu01@gmail.com</q-item-section>
              </q-item>
              <q-item class="q-px-none">
                <q-item-section avatar>
                  <q-icon name="phone" color="white" />
                </q-item-section>
                <q-item-section class="text-white">0702838364</q-item-section>
              </q-item>
            </q-list>
          </div>
          
          <div class="col-12 col-md-6">
            <q-form @submit.prevent="onSubmit" class="q-gutter-md">
              <q-input dark outlined v-model="form.name" :label="t.name" :rules="[val => !!val || 'Field is required']" />
              <q-input dark outlined v-model="form.email" :label="t.email" type="email" :rules="[val => !!val || 'Field is required']" />
              <q-input dark outlined v-model="form.message" :label="t.message" type="textarea" :rules="[val => !!val || 'Field is required']" />
              
              <div class="q-mb-md flex flex-center">
                <VueTurnstile site-key="0x4AAAAAADHUUksPvPEHMfdp" v-model="turnstileToken" />
              </div>

              <q-btn 
                type="submit"
                color="white" 
                text-color="black" 
                :label="t.send" 
                class="full-width q-py-md text-weight-bold" 
                rounded 
                unelevated 
                no-caps 
                :loading="loading"
              />
            </q-form>
          </div>
        </div>

        <div class="q-mt-xl">
          <q-btn flat color="white" :label="t.backHome" to="/" icon="arrow_back" no-caps />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { emailService } from 'src/utils/email'
import { useQuasar } from 'quasar'
import { useAppStore } from 'src/store/app'
import layoutTranslations from 'src/i18n/layout'
import VueTurnstile from 'vue-turnstile'

const appStore = useAppStore()
const t = computed(() => layoutTranslations[appStore.language])

const $q = useQuasar()
const loading = ref(false)
const form = ref({
  name: '',
  email: '',
  message: ''
})
const turnstileToken = ref('')

const onSubmit = async () => {
  if (!form.value.name || !form.value.email || !form.value.message) {
    $q.notify({
      type: 'negative',
      message: appStore.language === 'English' ? 'Please fill in all fields' : 'කරුණාකර සියලුම ක්ෂේත්‍ර පුරවන්න'
    })
    return
  }

  if (!turnstileToken.value) {
    $q.notify({
      type: 'warning',
      message: appStore.language === 'English' ? 'Please complete the security check' : 'කරුණාකර ආරක්ෂක පරීක්ෂණය සම්පූර්ණ කරන්න'
    })
    return
  }

  loading.value = true
  
  try {
    await emailService.sendContactEmail({
      name: form.value.name,
      email: form.value.email,
      message: form.value.message
    })

    $q.notify({
      type: 'positive',
      message: appStore.language === 'English' ? 'Message sent successfully! We will get back to you soon.' : 'පණිවිඩය සාර්ථකව යවන ලදී! අපි ඉක්මනින් ඔබව සම්බන්ධ කරගන්නෙමු.'
    })
    
    // Clear form
    form.value = {
      name: '',
      email: '',
      message: ''
    }
    // Clear form
  } catch (error) {
    console.error('EmailJS Error:', error)
    $q.notify({
      type: 'negative',
      message: appStore.language === 'English' ? 'Failed to send message. Please try again later.' : 'පණිවිඩය යැවීමට නොහැකි විය. කරුණාකර පසුව නැවත උත්සාහ කරන්න.'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.glass-card {
  padding: 60px;
  @media (max-width: 600px) {
    padding: 30px;
  }
}
</style>