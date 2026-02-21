<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <h1 class="text-h4 text-weight-bold text-grey-9 q-mb-none">Staff & Roles</h1>
      <q-btn color="primary" icon="security" label="Create Role" unelevated no-caps @click="openCreateRoleDialog" />
    </div>

    <div class="row q-col-gutter-lg">
        <!-- Staff Members -->
        <div class="col-12 col-md-8">
            <q-card flat bordered class="rounded-borders">
                <q-card-section>
                    <div class="text-h6 text-weight-bold">Staff Members</div>
                </q-card-section>
                <q-separator />
                <q-table
                    flat
                    :rows="staffRows"
                    :columns="staffColumns"
                    row-key="id"
                    hide-bottom
                >
                    <template v-slot:body-cell-role="props">
                        <q-td :props="props">
                            <div class="row items-center">
                                <q-icon name="shield" size="16px" class="q-mr-xs" :color="getRoleColor(props.value)" />
                                {{ props.value }}
                            </div>
                        </q-td>
                    </template>
                </q-table>
            </q-card>
        </div>

        <!-- Role Definitions -->
        <div class="col-12 col-md-4">
            <div v-if="roles.length === 0" class="text-grey-6 text-center q-pa-md bg-white rounded-borders border-grey">
                No roles defined.
            </div>

            <q-card v-for="role in roles" :key="role.id" flat bordered class="rounded-borders q-mb-md">
                <q-card-section :class="`bg-${role.color || 'blue'} text-white`">
                    <div class="row items-center justify-between">
                        <div>
                            <div class="text-subtitle1 text-weight-bold">{{ role.name }}</div>
                            <div class="text-caption opacity-80" style="opacity: 0.9">{{ role.description }}</div>
                        </div>
                        <q-btn icon="delete" flat round dense color="white" size="sm" @click="deleteRole(role.id)" />
                    </div>
                </q-card-section>
                <q-card-section>
                    <div class="text-caption text-grey-6 q-mb-sm text-weight-bold">Permissions:</div>
                    <div class="row q-gutter-xs">
                        <q-chip v-for="perm in role.permissions" :key="perm" size="xs" :icon="perm === 'users' ? 'group' : 'check'" :label="perm" outline color="primary" />
                         <span v-if="!role.permissions || role.permissions.length === 0" class="text-grey-5 text-caption">No specific permissions</span>
                    </div>
                </q-card-section>
            </q-card>
        </div>
    </div>

    <!-- Create Role Dialog -->
    <q-dialog v-model="showRoleDialog">
        <q-card style="min-width: 400px">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Create New Role</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pt-lg">
                <q-form @submit="saveRole" class="q-gutter-md">
                    <q-input outlined v-model="roleForm.name" label="Role Name" :rules="[val => !!val || 'Role Name is required']" />
                    
                    <div>
                        <div class="text-caption q-mb-xs">Color Code</div>
                        <div class="row q-gutter-xs">
                            <div v-for="color in colors" :key="color" 
                                class="cursor-pointer rounded-borders"
                                :class="[`bg-${color}`, roleForm.color === color ? 'ring-2 ring-offset-1 ring-blue' : '']"
                                style="width: 24px; height: 24px;"
                                @click="roleForm.color = color"
                            >
                                <q-icon v-if="roleForm.color === color" name="check" color="white" size="16px" class="absolute-center" />
                            </div>
                        </div>
                    </div>

                    <q-input outlined v-model="roleForm.description" label="Description" type="textarea" rows="2" />

                    <div>
                        <div class="text-caption q-mb-xs">Permissions</div>
                        <q-list bordered separator class="rounded-borders">
                            <q-item v-for="perm in availablePermissions" :key="perm.value" tag="label" v-ripple dense>
                                <q-item-section>
                                    <q-item-label>{{ perm.label }}</q-item-label>
                                </q-item-section>
                                <q-item-section side top>
                                    <q-checkbox v-model="roleForm.permissions" :val="perm.value" />
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </div>

                    <div class="row justify-end q-mt-lg">
                        <q-btn label="Cancel" color="grey-7" flat v-close-popup class="q-mr-sm" />
                        <q-btn label="Create Role" type="submit" color="primary" unelevated :loading="loading" />
                    </div>
                </q-form>
            </q-card-section>
        </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { client } from 'src/api'

const $q = useQuasar()
const showRoleDialog = ref(false)
const loading = ref(false)

// Role Form
const roleForm = ref({
    id: null,
    name: '',
    description: '',
    color: 'blue',
    permissions: []
})

const availablePermissions = [
    { label: 'Manage Users (Students/Tutors)', value: 'users' },
    { label: 'Manage Finance', value: 'finance' },
    { label: 'Manage Classes', value: 'classes' },
    { label: 'View Reports', value: 'reports' },
    { label: 'System Settings', value: 'settings' }
]

const colors = ['red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'cyan', 'teal', 'green', 'orange', 'brown', 'grey']

// Data
const roles = ref([])
const staffRows = ref([]) 

const staffColumns = [
  { name: 'name', align: 'left', label: 'Name', field: 'name' },
  { name: 'whatsapp_number', align: 'left', label: 'WhatsApp', field: 'whatsapp_number' },
  { name: 'role', align: 'left', label: 'Role', field: 'role' },
]

onMounted(() => {
    fetchRoles()
    fetchStaff()
})

const fetchStaff = async () => {
    try {
        const data = await client.get('staff')
        if (data) staffRows.value = data
    } catch (e) {
        console.error('Error fetching staff:', e)
    }
}

const fetchRoles = async () => {
    loading.value = true
    try {
        const data = await client.get('roles')
        if (data) roles.value = data
    } catch (e) {
        console.error('Error fetching roles:', e)
    } finally {
        loading.value = false
    }
}

const openCreateRoleDialog = () => {
    roleForm.value = {
        id: null,
        name: '',
        description: '',
        color: 'blue',
        permissions: []
    }
    showRoleDialog.value = true
}

const saveRole = async () => {
    if (!roleForm.value.name) return

    loading.value = true
    const roleData = {
        name: roleForm.value.name,
        description: roleForm.value.description,
        color: roleForm.value.color,
        permissions: roleForm.value.permissions
    }

    try {
        await client.post('roles', roleData)
        $q.notify({ type: 'positive', message: 'Role created successfully' })
        showRoleDialog.value = false
        fetchRoles()
    } catch (e) {
        $q.notify({ type: 'negative', message: `Error creating role` })
    } finally {
        loading.value = false
    }
}

const deleteRole = (id) => {
     $q.dialog({
        title: 'Confirm',
        message: 'Are you sure you want to delete this role?',
        cancel: true,
        persistent: true
    }).onOk(async () => {
        try {
            await client.delete(`roles/${id}`)
            $q.notify({ type: 'positive', message: 'Role deleted' })
            fetchRoles()
        } catch {
            $q.notify({ type: 'negative', message: 'Error deleting role' })
        }
    })
}

const getRoleColor = (roleName) => {
    const role = roles.value.find(r => r.name === roleName)
    return role ? role.color : 'grey'
}
</script>
