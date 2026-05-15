import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    language: 'English',
    whatsappEnabled: true
  }),
  actions: {
    setLanguage(lang) {
      this.language = lang
    },
    setWhatsappEnabled(enabled) {
      this.whatsappEnabled = enabled
    }
  },
  persist: true
})
