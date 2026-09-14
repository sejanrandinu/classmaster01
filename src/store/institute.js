import { defineStore } from 'pinia'

export const useInstituteStore = defineStore('institute', {
  state: () => ({
    institutes: [
      {
        id: 'inst-default-1',
        name: 'Main Campus (ප්‍රධාන ආයතනය)',
        code: 'MAIN',
        city: 'Colombo',
        phone: '0112345678',
        is_default: true,
        created_at: new Date().toISOString()
      }
    ],
    activeInstituteId: 'inst-default-1'
  }),

  getters: {
    activeInstitute: (state) => {
      return state.institutes.find(i => i.id === state.activeInstituteId) || state.institutes[0] || null
    },

    defaultInstitute: (state) => {
      return state.institutes.find(i => i.is_default) || state.institutes[0] || null
    },

    instituteOptions: (state) => {
      return state.institutes.map(i => ({
        label: `${i.name} ${i.is_default ? '★ (Default)' : ''}`,
        value: i.id,
        code: i.code,
        name: i.name,
        is_default: i.is_default
      }))
    }
  },

  actions: {
    setActiveInstitute(id) {
      if (this.institutes.some(i => i.id === id)) {
        this.activeInstituteId = id
      }
    },

    setDefaultInstitute(id) {
      this.institutes.forEach(inst => {
        inst.is_default = (inst.id === id)
      })
    },

    addInstitute(data) {
      const newInst = {
        id: 'inst-' + Date.now(),
        name: data.name || 'New Institute',
        code: (data.code || 'INST').toUpperCase(),
        city: data.city || '',
        phone: data.phone || '',
        is_default: Boolean(data.is_default) || this.institutes.length === 0,
        created_at: new Date().toISOString()
      }

      if (newInst.is_default) {
        this.institutes.forEach(i => { i.is_default = false })
      }

      this.institutes.push(newInst)
      if (!this.activeInstituteId || newInst.is_default) {
        this.activeInstituteId = newInst.id
      }
      return newInst
    },

    updateInstitute(id, data) {
      const inst = this.institutes.find(i => i.id === id)
      if (inst) {
        inst.name = data.name || inst.name
        inst.code = (data.code || inst.code).toUpperCase()
        inst.city = data.city ?? inst.city
        inst.phone = data.phone ?? inst.phone
        if (data.is_default) {
          this.setDefaultInstitute(id)
        }
      }
    },

    deleteInstitute(id) {
      if (this.institutes.length <= 1) {
        throw new Error('At least one institute must remain in the system.')
      }
      const index = this.institutes.findIndex(i => i.id === id)
      if (index !== -1) {
        const wasDefault = this.institutes[index].is_default
        this.institutes.splice(index, 1)

        if (wasDefault && this.institutes.length > 0) {
          this.institutes[0].is_default = true
        }

        if (this.activeInstituteId === id) {
          const fallback = this.defaultInstitute || this.institutes[0]
          this.activeInstituteId = fallback ? fallback.id : null
        }
      }
    }
  },

  persist: true
})
