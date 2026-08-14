<template>
  <q-page class="q-pa-md">
    <!-- Header Section -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 text-weight-bold text-grey-9 q-mb-xs">Super Admin Management</h1>
        <div class="text-grey-6">Manage tuition center approvals, package price configurations, and tier upgrades</div>
      </div>
      <div class="row q-gutter-md">
        <q-btn
          color="indigo-9"
          icon="edit_note"
          label="Manage Package Prices"
          no-caps
          class="text-weight-bold"
          @click="showPriceDialog = true"
        />
        <q-btn-toggle
          v-model="filter"
          flat
          toggle-color="primary"
          :options="[
            {label: 'Pending', value: 'pending'},
            {label: 'Approved', value: 'approved'},
            {label: 'All', value: 'all'}
          ]"
          @update:model-value="fetchUsers"
        />
        <q-input v-model="search" dense outlined placeholder="Search..." bg-color="white">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- Package Price Configuration Dialog for Super Admin -->
    <q-dialog v-model="showPriceDialog">
      <q-card style="min-width: 600px; max-width: 800px;" class="rounded-borders q-pa-md shadow-10">
        <q-card-section class="row items-center justify-between bg-indigo-9 text-white rounded-borders">
          <div class="text-h6 text-weight-bold">
            <q-icon name="payments" class="q-mr-sm" />
            Super Admin Package Price Manager
          </div>
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <p class="text-caption text-grey-7 q-mb-md">
            Change the monthly, annual, and lifetime prices for all 4 ClassMaster packages. Updated prices take effect instantly across all landing & pricing pages.
          </p>

          <div class="row q-col-gutter-md">
            <div v-for="pkg in priceForms" :key="pkg.id" class="col-12 col-sm-6">
              <q-card flat bordered class="q-pa-md bg-grey-1 rounded-borders">
                <div class="text-subtitle1 text-weight-bold text-indigo-10 q-mb-xs">{{ pkg.name }}</div>
                
                <div class="q-gutter-y-xs">
                  <q-input 
                    v-model.number="pkg.prices.monthly" 
                    type="number" 
                    label="Monthly Price (LKR)" 
                    dense 
                    outlined 
                    prefix="LKR "
                  />
                  <q-input 
                    v-model.number="pkg.prices.annual" 
                    type="number" 
                    label="Annual Price (LKR)" 
                    dense 
                    outlined 
                    prefix="LKR "
                  />
                  <q-input 
                    v-model.number="pkg.prices.lifetime" 
                    type="number" 
                    label="Lifetime Price (LKR)" 
                    dense 
                    outlined 
                    prefix="LKR "
                  />
                </div>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-2">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup no-caps />
          <q-btn 
            color="indigo-9" 
            icon="save" 
            label="Save All Prices" 
            no-caps 
            class="text-weight-bold q-px-md" 
            @click="savePrices" 
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Users & Upgrades Approval Table -->
    <q-card flat bordered class="rounded-borders">
      <q-table
        :rows="filteredUsers"
        :columns="columns"
        row-key="id"
        flat
        :loading="loading"
        no-data-label="No users found"
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props" class="text-center">
            <q-badge :color="props.row.role === 'trial' ? 'blue' : (props.row.is_approved ? 'green' : 'orange')" rounded>
              {{ props.row.role === 'trial' ? 'Trial' : (props.row.is_approved ? 'Approved' : 'Pending') }}
            </q-badge>
            <q-badge v-if="props.row.package_id" color="indigo" class="q-ml-xs">
              {{ props.row.package_id.toUpperCase() }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-sm text-center">
            <q-btn 
              v-if="!props.row.is_approved"
              flat 
              dense 
              color="green" 
              label="Approve Account" 
              icon="check" 
              no-caps 
              @click="toggleStatus(props.row, true)" 
            />
            <q-btn 
              v-else
              flat 
              dense 
              color="orange-9" 
              label="Disapprove" 
              icon="block" 
              no-caps 
              @click="toggleStatus(props.row, false)" 
            />
            
            <q-btn-dropdown
              flat
              dense
              color="indigo"
              label="Assign Package"
              no-caps
              size="sm"
            >
              <q-list dense>
                <q-item 
                  v-for="p in ['starter', 'standard', 'pro', 'enterprise']" 
                  :key="p" 
                  clickable 
                  v-close-popup 
                  @click="assignPackage(props.row, p)"
                >
                  <q-item-section class="text-capitalize text-weight-bold">
                    {{ p }} Pack
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>

            <q-btn 
              flat 
              dense 
              color="red" 
              label="Delete" 
              icon="delete" 
              no-caps 
              @click="confirmDelete(props.row)" 
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { client } from 'src/api'
import { useQuasar } from 'quasar'
import { useSubscriptionStore } from 'src/store/subscription'

const $q = useQuasar()
const subStore = useSubscriptionStore()

const loading = ref(false)
const allUsers = ref([])
const filter = ref('pending')
const search = ref('')
const showPriceDialog = ref(false)

const priceForms = ref([
  { id: 'starter', name: 'Starter Pack', prices: { monthly: 1500, annual: 14400, lifetime: 35000 } },
  { id: 'standard', name: 'Standard Pack', prices: { monthly: 3500, annual: 33600, lifetime: 75000 } },
  { id: 'pro', name: 'Pro Pack', prices: { monthly: 7500, annual: 72000, lifetime: 150000 } },
  { id: 'enterprise', name: 'Enterprise Pack', prices: { monthly: 15000, annual: 144000, lifetime: 300000 } }
])

const columns = [
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  { name: 'whatsapp', label: 'WhatsApp', field: 'whatsapp_number', align: 'left' },
  { name: 'status', label: 'Status & Package', field: 'is_approved', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]

onMounted(async () => {
  await subStore.fetchPackages()
  // Load initial prices from subStore
  subStore.packagesList.forEach(pkg => {
    const target = priceForms.value.find(f => f.id === pkg.id)
    if (target && pkg.prices) {
      target.prices = { ...pkg.prices }
    }
  })
  fetchUsers()
})

const filteredUsers = computed(() => {
  let list = allUsers.value
  
  if (filter.value === 'pending') {
    list = list.filter(u => !u.is_approved)
  } else if (filter.value === 'approved') {
    list = list.filter(u => u.is_approved)
  }

  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(u => 
      u.email?.toLowerCase().includes(s) || 
      u.whatsapp_number?.includes(s)
    )
  }

  return list
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const profiles = await client.get('profiles')
    allUsers.value = profiles || []
  } catch (error) {
    console.error('Fetch users error:', error)
    $q.notify({ 
      type: 'negative', 
      message: 'Failed to load user list'
    })
  } finally {
    loading.value = false
  }
}

const savePrices = () => {
  priceForms.value.forEach(form => {
    subStore.updatePackagePrice(
      form.id,
      form.prices.monthly,
      form.prices.annual,
      form.prices.lifetime
    )
  })
  $q.notify({
    type: 'positive',
    message: 'Package prices updated successfully by Super Admin!',
    position: 'top'
  })
  showPriceDialog.value = false
}

const toggleStatus = async (user, status) => {
  try {
    await client.put(`profiles/${user.id}/approve`, { is_approved: status })

    $q.notify({ 
      type: 'positive', 
      message: `User ${status ? 'approved' : 'disapproved'} successfully` 
    })

    if (status && user.whatsapp_number) {
      let phone = user.whatsapp_number
      if (phone.startsWith('0')) phone = '94' + phone.substring(1)
      phone = phone.replace(/\D/g, '')
      
      const message = encodeURIComponent(`Hello! Your ClassMaster account (${user.email}) has been approved. You can now log in to your dashboard.`)
      const url = `https://wa.me/${phone}?text=${message}`
      window.open(url, '_blank')
    }

    fetchUsers()
  } catch {
    $q.notify({ type: 'negative', message: `Action failed` })
  }
}

const assignPackage = async (user, packageId) => {
  try {
    await client.put(`profiles/${user.id}`, { package_id: packageId })
    $q.notify({
      type: 'positive',
      message: `Assigned ${packageId.toUpperCase()} package to ${user.email}`
    })
    fetchUsers()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to update user package'
    })
  }
}

const confirmDelete = (user) => {
  $q.dialog({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete ${user.email}? This action cannot be undone.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await client.delete(`profiles/${user.id}`)
      $q.notify({ type: 'positive', message: 'User deleted' })
      fetchUsers()
    } catch {
      $q.notify({ type: 'negative', message: 'Delete failed' })
    }
  })
}
</script>
