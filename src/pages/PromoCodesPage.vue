<template>
  <q-page class="q-pa-lg bg-grey-1">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 text-weight-bolder text-grey-9 q-my-none">
          <q-icon name="local_offer" color="primary" class="q-mr-sm" />
          Promo Code Management
        </h1>
        <div class="text-caption text-grey-7 q-mt-xs">
          Create, manage, and track promo codes and discount vouchers for ClassMaster packages.
        </div>
      </div>
      <div>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Create Promo Code"
          no-caps
          class="text-weight-bold rounded-borders q-px-md shadow-2"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Data Table -->
    <q-card flat bordered class="rounded-borders shadow-1 bg-white">
      <q-table
        :rows="codesList"
        :columns="columns"
        row-key="id"
        :loading="loading"
        flat
        :pagination="{ rowsPerPage: 10 }"
      >
        <template v-slot:body-cell-code="props">
          <q-td :props="props">
            <q-badge color="indigo-10" text-color="white" class="text-weight-bold q-px-sm py-xs text-subtitle2 shadow-1">
              {{ props.row.code }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-discount="props">
          <q-td :props="props">
            <span v-if="props.row.discount_type === 'percentage'" class="text-weight-bold text-positive">
              {{ props.row.discount_value }}% OFF
            </span>
            <span v-else-if="props.row.discount_type === 'fixed_amount'" class="text-weight-bold text-primary">
              LKR {{ props.row.discount_value.toLocaleString() }} OFF
            </span>
            <span v-else-if="props.row.discount_type === 'free_pack'" class="text-weight-bold text-purple">
              FREE PACK
            </span>
          </q-td>
        </template>

        <template v-slot:body-cell-uses="props">
          <q-td :props="props">
            <span class="text-weight-bold text-grey-9">{{ props.row.used_count }}</span> /
            <span>{{ props.row.max_uses === 0 ? 'Unlimited' : props.row.max_uses }}</span>
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-toggle
              v-model="props.row.is_active_bool"
              color="positive"
              @update:model-value="toggleCodeStatus(props.row)"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" align="right">
            <q-btn flat round dense icon="delete" color="negative" @click="confirmDelete(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Create Promo Code Dialog -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 450px;" class="rounded-borders q-pa-sm">
        <q-card-section class="row items-center justify-between bg-primary text-white rounded-borders">
          <div class="text-h6 text-weight-bold">Create New Promo Code</div>
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-md q-pt-md">
          <q-input
            v-model="form.code"
            label="Promo Code String"
            placeholder="e.g. WELCOME50, SUPER2026"
            outlined
            dense
            autofocus
            class="text-uppercase text-weight-bold"
          />

          <q-select
            v-model="form.discount_type"
            :options="[
              { label: 'Percentage (%) Discount', value: 'percentage' },
              { label: 'Fixed Amount (LKR) Discount', value: 'fixed_amount' },
              { label: 'Free Package Grant', value: 'free_pack' }
            ]"
            emit-value
            map-options
            label="Discount Type"
            outlined
            dense
          />

          <q-input
            v-model.number="form.discount_value"
            type="number"
            :label="form.discount_type === 'percentage' ? 'Discount Percentage (e.g. 20 for 20%)' : 'Discount Amount in LKR (e.g. 2000)'"
            outlined
            dense
          />

          <q-select
            v-model="form.valid_package_id"
            :options="[
              { label: 'All Packages', value: null },
              { label: 'Starter Pack Only', value: 'starter' },
              { label: 'Standard Pack Only', value: 'standard' },
              { label: 'Pro Pack Only', value: 'pro' },
              { label: 'Enterprise Pack Only', value: 'enterprise' }
            ]"
            emit-value
            map-options
            label="Applicable Package"
            outlined
            dense
          />

          <q-select
            v-model="form.valid_billing_cycle"
            :options="[
              { label: 'All Billing Cycles', value: null },
              { label: 'Monthly Only', value: 'monthly' },
              { label: 'Annual Only', value: 'annual' },
              { label: 'Lifetime Only', value: 'lifetime' }
            ]"
            emit-value
            map-options
            label="Applicable Billing Cycle"
            outlined
            dense
          />

          <q-input
            v-model.number="form.max_uses"
            type="number"
            label="Max Total Redemptions (0 = Unlimited)"
            outlined
            dense
          />

          <q-input
            v-model="form.expires_at"
            type="date"
            label="Expiry Date"
            outlined
            dense
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup no-caps />
          <q-btn
            unelevated
            color="primary"
            label="Save Promo Code"
            no-caps
            class="q-px-md text-weight-bold"
            :loading="saving"
            @click="savePromoCode"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { promoCodes as promoApi } from 'src/api'

const $q = useQuasar()
const codesList = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const saving = ref(false)

const form = ref({
  code: '',
  discount_type: 'percentage',
  discount_value: 20,
  valid_package_id: null,
  valid_billing_cycle: null,
  max_uses: 100,
  expires_at: '2027-12-31'
})

const columns = [
  { name: 'code', label: 'PROMO CODE', field: 'code', align: 'left', sortable: true },
  { name: 'discount', label: 'DISCOUNT', field: 'discount_value', align: 'left' },
  { name: 'package', label: 'TARGET PACKAGE', field: row => row.valid_package_id ? row.valid_package_id.toUpperCase() : 'ALL', align: 'left' },
  { name: 'cycle', label: 'CYCLE', field: row => row.valid_billing_cycle ? row.valid_billing_cycle.toUpperCase() : 'ALL', align: 'left' },
  { name: 'uses', label: 'REDEMPTIONS', field: 'used_count', align: 'center' },
  { name: 'expires', label: 'EXPIRATION', field: 'expires_at', align: 'left' },
  { name: 'status', label: 'ACTIVE', field: 'is_active', align: 'center' },
  { name: 'actions', label: 'ACTIONS', field: 'id', align: 'right' }
]

onMounted(() => {
  fetchCodes()
})

const fetchCodes = async () => {
  loading.value = true
  try {
    const res = await promoApi.getAll()
    if (res && Array.isArray(res)) {
      codesList.value = res.map(item => ({
        ...item,
        is_active_bool: item.is_active === 1 || item.is_active === true
      }))
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message || 'Failed to fetch promo codes' })
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  form.value = {
    code: '',
    discount_type: 'percentage',
    discount_value: 20,
    valid_package_id: null,
    valid_billing_cycle: null,
    max_uses: 100,
    expires_at: '2027-12-31'
  }
  showCreateDialog.value = true
}

const savePromoCode = async () => {
  if (!form.value.code || !form.value.code.trim()) {
    $q.notify({ type: 'warning', message: 'Promo code string is required' })
    return
  }
  saving.value = true
  try {
    await promoApi.create(form.value)
    $q.notify({ type: 'positive', message: 'Promo code created successfully!' })
    showCreateDialog.value = false
    fetchCodes()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message || 'Failed to create promo code' })
  } finally {
    saving.value = false
  }
}

const toggleCodeStatus = async (row) => {
  try {
    await promoApi.update(row.id, { is_active: row.is_active_bool ? 1 : 0 })
    $q.notify({ type: 'positive', message: `Promo code ${row.code} ${row.is_active_bool ? 'activated' : 'deactivated'}` })
  } catch {
    row.is_active_bool = !row.is_active_bool
    $q.notify({ type: 'negative', message: 'Error updating code status' })
  }
}

const confirmDelete = (row) => {
  $q.dialog({
    title: 'Delete Promo Code',
    message: `Are you sure you want to delete code '${row.code}'?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await promoApi.delete(row.id)
      $q.notify({ type: 'positive', message: 'Promo code deleted' })
      fetchCodes()
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message || 'Error deleting promo code' })
    }
  })
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 12px;
}
</style>
