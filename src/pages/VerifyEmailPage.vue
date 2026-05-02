<template>
  <q-page class="bg-black text-white flex flex-center">
    <div class="text-center">
      <q-spinner-dots v-if="loading" color="primary" size="3em" />
      <div v-else>
        <q-icon :name="success ? 'check_circle' : 'error'" :color="success ? 'positive' : 'negative'" size="4em" />
        <h2 class="text-h4 q-mt-md">{{ message }}</h2>
        <q-btn class="q-mt-xl" color="primary" label="Go to Login" to="/login" v-if="!loading" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { auth } from 'src/api';

const route = useRoute();
const loading = ref(true);
const success = ref(false);
const message = ref('Verifying your email...');

onMounted(async () => {
  const token = route.query.token;
  if (!token) {
    loading.value = false;
    success.value = false;
    message.value = 'Invalid verification link.';
    return;
  }

  try {
    await auth.verifyEmail(token);
    success.value = true;
    message.value = 'Email verified successfully!';
  } catch (error) {
    success.value = false;
    message.value = error.message || 'Failed to verify email.';
  } finally {
    loading.value = false;
  }
});
</script>
