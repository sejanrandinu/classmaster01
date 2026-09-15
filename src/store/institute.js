import { defineStore } from 'pinia'
import { institutesApi } from 'src/api'

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
    activeInstituteId: 'inst-default-1',
    loading: false
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
    async fetchInstitutes() {
      this.loading = true
      try {
        const data = await institutesApi.getAll()
        if (Array.isArray(data) && data.length > 0) {
          this.institutes = data
          if (!this.activeInstituteId || !this.institutes.some(i => i.id === this.activeInstituteId)) {
            const def = this.defaultInstitute || this.institutes[0]
            this.activeInstituteId = def ? def.id : null
          }
        }
      } catch (err) {
        console.error('Failed to load institutes from D1 DB:', err)
      } finally {
        this.loading = false
      }
    },

    setActiveInstitute(id) {
      if (this.institutes.some(i => i.id === id)) {
        this.activeInstituteId = id
      }
    },

    async setDefaultInstitute(id) {
      const inst = this.institutes.find(i => i.id === id)
      if (inst) {
        try {
          await institutesApi.update(id, { ...inst, is_default: true })
          this.institutes.forEach(item => {
            item.is_default = (item.id === id)
          })
        } catch (err) {
          console.error('Failed to set default institute in D1 DB:', err)
        }
      }
    },

    async addInstitute(data) {
      try {
        const res = await institutesApi.create(data)
        const newInst = res.institute || {
          id: 'inst-' + Date.now(),
          name: data.name || 'New Institute',
          code: (data.code || 'INST').toUpperCase(),
          city: data.city || '',
          phone: data.phone || '',
          is_default: Boolean(data.is_default),
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
      } catch (err) {
        console.error('Failed to add institute to D1 DB:', err)
        throw err
      }
    },

    async updateInstitute(id, data) {
      try {
        const res = await institutesApi.update(id, data)
        const updated = res.institute
        const inst = this.institutes.find(i => i.id === id)
        if (inst) {
          if (updated) {
            Object.assign(inst, updated)
          } else {
            inst.name = data.name || inst.name
            inst.code = (data.code || inst.code).toUpperCase()
            inst.city = data.city ?? inst.city
            inst.phone = data.phone ?? inst.phone
          }
          if (data.is_default) {
            this.institutes.forEach(i => { i.is_default = (i.id === id) })
          }
        }
      } catch (err) {
        console.error('Failed to update institute in D1 DB:', err)
        throw err
      }
    },

    async deleteInstitute(id) {
      if (this.institutes.length <= 1) {
        throw new Error('At least one institute must remain in the system.')
      }

      try {
        await institutesApi.delete(id)
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
      } catch (err) {
        console.error('Failed to delete institute from D1 DB:', err)
        throw err
      }
    }
  },

  persist: true
})
