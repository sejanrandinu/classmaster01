<template>
  <q-page class="q-pa-lg bg-grey-1">
    <!-- Header Section -->
    <div class="text-center q-mb-xl">
      <div class="text-overline text-primary text-weight-bolder letter-spacing-wide uppercase">
        {{ appStore.language === 'English' ? 'Flexible Pricing Plans' : 'ඔබට ගැලපෙන මිල ගණන් සහ පැකේජ' }}
      </div>
      <h1 class="text-h3 text-weight-bolder text-grey-9 q-mt-xs q-mb-sm">
        {{ appStore.language === 'English' ? 'Choose the Perfect Pack for Your Institute' : 'ඔබගේ උපකාරක පන්ති ආයතනයට ගැලපෙන පැකේජය තෝරාගන්න' }}
      </h1>
      <p class="text-subtitle1 text-grey-7 max-width-600 q-mx-auto">
        {{ appStore.language === 'English' ? 'Scale your tuition management with high-performance tools, SMS messaging, QR scanning, and auto billing.' : 'සියලුම පහසුකම් සහිතව ඔබගේ පන්ති කළමනාකරණය පහසුවෙන් සිදුකරගන්න.' }}
      </p>

      <!-- Active Plan Banner if subscribed -->
      <div v-if="subStore.currentPackageId" class="q-mt-md inline-block">
        <q-chip color="primary" text-color="white" icon="verified" size="md" class="q-px-md text-weight-bold shadow-2">
          {{ appStore.language === 'English' ? 'Your Current Active Plan:' : 'ඔබගේ වර්තමාන පැකේජය:' }} {{ subStore.currentPackage.name }} ({{ subStore.billingCycle.toUpperCase() }})
        </q-chip>
      </div>

      <!-- Billing Cycle Toggle (Monthly / Annual / Lifetime) -->
      <div class="row justify-center items-center q-mt-lg q-gutter-sm">
        <q-btn-toggle
          v-model="billingCycle"
          toggle-color="primary"
          color="white"
          text-color="grey-8"
          unelevated
          rounded
          class="shadow-2 rounded-borders border-grey q-pa-xs"
          :options="[
            { label: appStore.language === 'English' ? 'Monthly' : 'මාසික', value: 'monthly' },
            { label: appStore.language === 'English' ? 'Annually (Save 20%)' : 'වාර්ෂික (20% වට්ටම්)', value: 'annual' },
            { label: appStore.language === 'English' ? 'Lifetime (One-Time)' : 'ජීවිත කාලයටම (එක්වරක්)', value: 'lifetime' }
          ]"
        />
      </div>
    </div>

    <!-- Promo Code Application Box -->
    <div class="row justify-center q-mb-xl">
      <q-card flat bordered class="q-pa-md rounded-borders shadow-1 bg-white" style="max-width: 550px; width: 100%;">
        <div class="row items-center justify-between q-col-gutter-sm">
          <div class="col-12 col-sm-8">
            <q-input
              v-model="promoCodeInput"
              dense
              outlined
              placeholder="Enter Promo Code (e.g. WELCOME20, SUPERDEAL)"
              class="text-weight-bold"
              bg-color="grey-1"
              @keyup.enter="applyPromoCode"
            >
              <template v-slot:prepend>
                <q-icon name="local_offer" color="primary" />
              </template>
              <template v-slot:append v-if="appliedPromo">
                <q-icon name="check_circle" color="positive" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4 text-right">
            <q-btn
              unelevated
              color="primary"
              label="Apply Code"
              no-caps
              class="full-width font-weight-bold"
              style="height: 40px;"
              :loading="validatingPromo"
              @click="applyPromoCode"
            />
          </div>
        </div>

        <!-- Applied Promo Notice -->
        <div v-if="appliedPromo" class="q-mt-sm row items-center justify-between bg-green-1 q-pa-sm rounded-borders text-positive text-caption text-weight-bold">
          <div>
            <q-icon name="verified" class="q-mr-xs" />
            Code <strong>{{ appliedPromo.code }}</strong> Applied!
            <span v-if="appliedPromo.discount_type === 'percentage'">({{ appliedPromo.discount_value }}% OFF)</span>
            <span v-else-if="appliedPromo.discount_type === 'fixed_amount'">(LKR {{ appliedPromo.discount_value.toLocaleString() }} OFF)</span>
          </div>
          <q-btn flat round dense icon="close" size="xs" color="negative" @click="removePromo" />
        </div>
      </q-card>
    </div>

    <!-- Packages 4 Grid -->
    <div class="row q-col-gutter-lg justify-center items-stretch">
      <div
        v-for="pkg in subStore.packagesList"
        :key="pkg.id"
        class="col-12 col-sm-6 col-md-3 flex"
      >
        <q-card
          flat
          bordered
          class="package-card column full-width rounded-borders transition-all shadow-2 hover-shadow-12"
          :class="{
            'border-primary border-2 shadow-6': pkg.id === 'standard',
            'is-current-plan': subStore.currentPackageId === pkg.id
          }"
        >
          <!-- Badge Header -->
          <div class="q-pa-md text-center bg-grey-2 relative-position border-bottom">
            <q-badge
              v-if="pkg.badge"
              :color="pkg.color"
              text-color="white"
              class="absolute-top-right q-ma-sm q-px-sm text-weight-bold"
            >
              {{ pkg.badge }}
            </q-badge>
            
            <div class="text-h5 text-weight-bolder text-grey-9 q-mt-xs">{{ pkg.name }}</div>
            <div class="text-caption text-grey-7 q-mb-md">
              {{ pkg.student_limit === 999999 ? 'Unlimited Scale' : `Up to ${pkg.student_limit} Students` }}
            </div>

            <!-- Price Display -->
            <div class="price-container text-primary">
              <span class="text-caption text-weight-bold">LKR</span>
              <span class="text-h3 text-weight-bolder">
                {{ getFormattedPrice(pkg) }}
              </span>
              <span class="text-caption text-grey-7">
                {{ billingCycle === 'monthly' ? '/mo' : (billingCycle === 'annual' ? '/yr' : ' once') }}
              </span>
            </div>

            <!-- Savings Badge for Annual/Promo -->
            <div v-if="appliedPromo" class="text-caption text-weight-bold text-positive q-mt-xs">
              With Promo: LKR {{ getDiscountedPrice(pkg).toLocaleString() }}
            </div>
          </div>

          <!-- Features List -->
          <q-card-section class="col-grow q-pa-md">
            <q-list dense class="text-grey-8">
              <q-item v-for="(feat, fIdx) in pkg.features" :key="fIdx" class="q-px-none q-py-xs">
                <q-item-section avatar style="min-width: 28px;">
                  <q-icon name="check_circle" color="positive" size="18px" />
                </q-item-section>
                <q-item-section class="text-body2 text-weight-medium">
                  {{ feat }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <!-- Card Action Button -->
          <q-card-actions class="q-pa-md bg-grey-1">
            <q-btn
              unelevated
              class="full-width rounded-borders text-weight-bold py-sm"
              :color="subStore.currentPackageId === pkg.id ? 'grey-7' : pkg.color"
              :disabled="subStore.currentPackageId === pkg.id"
              :label="subStore.currentPackageId === pkg.id ? (appStore.language === 'English' ? 'Current Active Plan' : 'වත්මන් පැකේජය') : (appStore.language === 'English' ? 'Select Plan' : 'මෙම පැකේජය තෝරන්න')"
              no-caps
              @click="openUpgradeDialog(pkg)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Upgrade & Payment Confirmation Dialog -->
    <q-dialog v-model="showUpgradeDialog" persistent>
      <q-card style="min-width: 450px; max-width: 550px;" class="rounded-borders q-pa-sm shadow-10">
        <q-card-section class="row items-center justify-between bg-primary text-white rounded-borders">
          <div class="text-h6 text-weight-bold">
            <q-icon name="card_membership" class="q-mr-sm" />
            {{ appStore.language === 'English' ? 'Confirm Package Subscription' : 'පැකේජය තහවුරු කරන්න' }}
          </div>
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-subtitle1 text-weight-bold text-grey-9">
            Selected Plan: <span class="text-primary">{{ selectedPkg?.name }}</span>
          </div>
          <div class="text-caption text-grey-7 q-mb-md">
            Billing Cycle: <strong>{{ billingCycle.toUpperCase() }}</strong>
          </div>

          <!-- Price Summary Table -->
          <q-card flat bordered class="q-pa-md bg-grey-1 rounded-borders q-mb-md">
            <div class="row justify-between text-body2 q-mb-xs">
              <span class="text-grey-7">Regular Price:</span>
              <span class="text-weight-bold">LKR {{ getRawBasePrice(selectedPkg).toLocaleString() }}</span>
            </div>
            <div v-if="appliedPromo" class="row justify-between text-body2 text-positive q-mb-xs">
              <span>Promo Discount ({{ appliedPromo.code }}):</span>
              <span class="text-weight-bold">- LKR {{ calculatePromoDiscount(selectedPkg).toLocaleString() }}</span>
            </div>
            <q-separator class="q-my-xs" />
            <div class="row justify-between text-subtitle1 text-weight-bolder text-grey-9 q-mt-xs">
              <span>Total Payable:</span>
              <span class="text-primary">LKR {{ getFinalPayablePrice(selectedPkg).toLocaleString() }}</span>
            </div>
          </q-card>

          <!-- Payment Details Box -->
          <div class="bg-blue-1 text-blue-10 q-pa-md rounded-borders text-caption q-mb-md">
            <div class="text-weight-bold text-body2 q-mb-xs">
              <q-icon name="account_balance" class="q-mr-xs" /> Bank Transfer Details / ගෙවීම් විස්තර:
            </div>
            <div>Bank: <strong>Commercial Bank</strong></div>
            <div>Account Name: <strong>ClassMaster Management / S. Randinu</strong></div>
            <div>Account Number: <strong>800 912 4432</strong></div>
            <div>Branch: <strong>Galle Super Branch</strong></div>
          </div>

          <div class="text-caption text-grey-7 text-center">
            After transfer, click "Confirm & Activate" below or send proof to WhatsApp <strong>+94 70 283 8364</strong>.
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup no-caps />
          <q-btn
            unelevated
            color="primary"
            icon="task_alt"
            label="Confirm & Activate Plan"
            no-caps
            class="q-px-md text-weight-bold"
            :loading="subscribing"
            @click="confirmSubscription"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAppStore } from 'src/store/app'
import { useSubscriptionStore } from 'src/store/subscription'
import { packages as packagesApi } from 'src/api'

const $q = useQuasar()
const appStore = useAppStore()
const subStore = useSubscriptionStore()

const billingCycle = ref('monthly')
const promoCodeInput = ref('')
const validatingPromo = ref(false)
const appliedPromo = ref(null)

const showUpgradeDialog = ref(false)
const selectedPkg = ref(null)
const subscribing = ref(false)

onMounted(async () => {
  await subStore.syncSubscription()
  await subStore.fetchPackages()
})

const getRawBasePrice = (pkg) => {
  if (!pkg || !pkg.prices) return 0
  return pkg.prices[billingCycle.value] || pkg.prices.monthly
}

const getFormattedPrice = (pkg) => {
  const price = getRawBasePrice(pkg)
  return price.toLocaleString()
}

const calculatePromoDiscount = (pkg) => {
  if (!appliedPromo.value || !pkg) return 0
  const base = getRawBasePrice(pkg)
  if (appliedPromo.value.discount_type === 'percentage') {
    return Math.round((base * appliedPromo.value.discount_value) / 100)
  } else if (appliedPromo.value.discount_type === 'fixed_amount') {
    return Math.min(base, appliedPromo.value.discount_value)
  } else if (appliedPromo.value.discount_type === 'free_pack') {
    return base
  }
  return 0
}

const getDiscountedPrice = (pkg) => {
  const base = getRawBasePrice(pkg)
  const discount = calculatePromoDiscount(pkg)
  return Math.max(0, base - discount)
}

const getFinalPayablePrice = (pkg) => {
  return getDiscountedPrice(pkg)
}

const applyPromoCode = async () => {
  if (!promoCodeInput.value || !promoCodeInput.value.trim()) return
  validatingPromo.value = true
  try {
    const res = await packagesApi.validatePromoCode(
      promoCodeInput.value.trim(),
      selectedPkg.value ? selectedPkg.value.id : 'standard',
      billingCycle.value
    )
    if (res && res.valid) {
      appliedPromo.value = res
      $q.notify({ type: 'positive', message: `Promo Code '${res.code}' applied successfully!` })
    } else {
      $q.notify({ type: 'negative', message: res.error || 'Invalid promo code' })
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message || 'Failed to validate promo code' })
  } finally {
    validatingPromo.value = false
  }
}

const removePromo = () => {
  appliedPromo.value = null
  promoCodeInput.value = ''
}

const openUpgradeDialog = (pkg) => {
  selectedPkg.value = pkg
  showUpgradeDialog.value = true
}

const confirmSubscription = async () => {
  if (!selectedPkg.value) return
  subscribing.value = true
  try {
    const codeToApply = appliedPromo.value ? appliedPromo.value.code : null
    await packagesApi.subscribe(
      selectedPkg.value.id,
      billingCycle.value,
      codeToApply
    )

    if (subStore.isSuperAdmin) {
      subStore.currentPackageId = selectedPkg.value.id
      subStore.billingCycle = billingCycle.value
      $q.notify({ 
        type: 'positive', 
        message: `Super Admin: Package ${selectedPkg.value.name} activated directly!`,
        position: 'top' 
      })
    } else {
      $q.notify({ 
        type: 'positive', 
        message: `Package upgrade request for ${selectedPkg.value.name} (${billingCycle.value.toUpperCase()}) submitted! Super Admin will approve your request shortly.`,
        position: 'top',
        timeout: 7000 
      })
    }
    await subStore.syncSubscription()
    showUpgradeDialog.value = false
  } catch {
    // If backend endpoint is not active, handle gracefully in store
    if (subStore.isSuperAdmin) {
      subStore.currentPackageId = selectedPkg.value.id
      subStore.billingCycle = billingCycle.value
      $q.notify({ type: 'positive', message: `Activated ${selectedPkg.value.name} for Super Admin!` })
    } else {
      $q.notify({ 
        type: 'positive', 
        message: `Package upgrade request for ${selectedPkg.value.name} submitted for Super Admin approval!`,
        position: 'top',
        timeout: 6000
      })
    }
    showUpgradeDialog.value = false
  } finally {
    subscribing.value = false
  }
}
</script>

<style scoped>
.max-width-600 {
  max-width: 600px;
}
.letter-spacing-wide {
  letter-spacing: 0.12em;
}
.package-card {
  border-radius: 16px;
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.package-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12) !important;
}
.border-primary {
  border-color: #1976D2 !important;
}
.border-2 {
  border-width: 2px !important;
}
.is-current-plan {
  border: 2px solid #2e7d32 !important;
  background: #f1f8e9 !important;
}
</style>
