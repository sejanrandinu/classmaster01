<template>
  <q-dialog ref="dialogRef" persistent transition-show="scale" transition-hide="scale">
    <q-card class="glass-panel text-white q-pa-none" style="width: 100%; max-width: 450px; border-radius: 16px;">
      <div class="q-pa-lg">
        <div class="text-center q-mb-lg">
          <q-avatar size="56px" class="q-mb-sm bg-indigo-10">
            <q-icon name="account_balance" color="white" size="32px" />
          </q-avatar>
          <div class="text-h5 text-weight-bold q-mt-sm">Complete Registration</div>
          <p class="text-grey-4 q-mt-xs">Please verify your payment to activate the account</p>
        </div>

        <div class="q-mb-sm">
          <div class="text-caption text-grey-5">Registration Fee (One-time)</div>
          <div class="text-h5 text-weight-bold text-white">
            <span class="text-grey-6 text-strike q-mr-sm">Rs. 45,000</span> Rs. 40,000
          </div>
        </div>
        <div class="q-mb-md">
          <div class="text-caption text-grey-5">Monthly Subscription Fee</div>
          <div class="text-h5 text-weight-bold text-yellow-6">Rs. 5,000</div>
          <div class="text-caption text-indigo-3">Monthly recurring payment</div>
        </div>

        <div class="q-mb-lg q-pa-md rounded-borders" style="background: linear-gradient(135deg, rgba(63, 81, 181, 0.2) 0%, rgba(33, 150, 243, 0.1) 100%); border: 1px solid rgba(255,255,255,0.2);">
          <div class="text-caption text-indigo-3 q-mb-sm text-uppercase letter-spacing-widest">Send Payment To:</div>
          <div class="row q-col-gutter-xs">
            <div class="col-12">
              <div class="text-body2 text-grey-4">Bank Name</div>
              <div class="text-subtitle1 text-weight-bold text-white">Bank of Ceylon (BOC)</div>
            </div>
            <div class="col-12 q-mt-sm">
              <div class="text-body2 text-grey-4">Account Number</div>
              <div class="text-h5 text-weight-bold text-yellow-6 letter-spacing-wide">86019560</div>
            </div>
            <div class="col-12 q-mt-sm">
              <div class="text-body2 text-grey-4">Account Holder</div>
              <div class="text-body1 text-weight-medium text-white">B.L. Ruwan Manjula</div>
            </div>
          </div>
        </div>

        <div class="q-pa-md rounded bg-dark-transparent q-mb-lg" style="border: 1px solid rgba(255,255,255,0.1);">
          <div class="text-body2 text-grey-3 flex items-start">
            <q-icon name="whatsapp" color="green-4" size="20px" class="q-mr-sm q-mt-xs" />
            <div>
              Send your receipt to 
              <span class="text-weight-bold text-white">0702838364</span> 
              via WhatsApp with your email address.
            </div>
          </div>
        </div>

        <q-btn 
          label="I've Saved It" 
          color="white" 
          text-color="black" 
          class="full-width text-weight-bold shadow-4" 
          padding="12px"
          rounded
          no-caps
          @click="onDialogOK"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent } from 'quasar'

defineEmits([
  ...useDialogPluginComponent.emits
])

const { dialogRef, onDialogOK } = useDialogPluginComponent()
</script>

<style scoped>
.glass-panel {
  background: #1a1a1a; /* Fallback */
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bg-dark-transparent {
  background: rgba(255, 255, 255, 0.05);
}

.letter-spacing-wide {
  letter-spacing: 1px;
}
</style>
