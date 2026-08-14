import { defineStore } from 'pinia'
import { packages as packagesApi, auth } from 'src/api'

const DEFAULT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    badge: 'Essential',
    color: 'blue-7',
    student_limit: 50,
    class_limit: 2,
    staff_limit: 1,
    prices: { monthly: 1500, annual: 14400, lifetime: 35000 },
    features: [
      'Up to 50 Active Students',
      'Up to 2 Active Classes',
      '1 Staff Member',
      'Dashboard & Analytics',
      'Student Management',
      'Class Scheduling',
      'Attendance Marking',
      'Student QR Scanner'
    ],
    restricted_features: ['tutes', 'exams', 'payments', 'sms', 'staff', 'roles', 'discipline', 'pairing', 'student-portal', 'branding']
  },
  {
    id: 'standard',
    name: 'Standard Pack',
    badge: 'Most Popular',
    color: 'primary',
    student_limit: 250,
    class_limit: 10,
    staff_limit: 3,
    prices: { monthly: 3500, annual: 33600, lifetime: 75000 },
    features: [
      'Up to 250 Active Students',
      'Up to 10 Active Classes',
      'Up to 3 Staff Members',
      'Everything in Starter',
      'Tutes & Study Materials',
      'Exams & Marks System',
      'Fees & Payment Collection',
      'Receipt Generation & Printing'
    ],
    restricted_features: ['sms', 'staff', 'roles', 'discipline', 'pairing', 'student-portal', 'branding']
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    badge: 'Advanced',
    color: 'purple-8',
    student_limit: 1000,
    class_limit: 30,
    staff_limit: 10,
    prices: { monthly: 7500, annual: 72000, lifetime: 150000 },
    features: [
      'Up to 1,000 Active Students',
      'Up to 30 Active Classes',
      'Up to 10 Staff Members',
      'Everything in Standard',
      'Student Portal Access',
      'SMS Gateway & Direct Messaging',
      'Staff Management & Custom Roles',
      'Student Discipline Records',
      'Student Pairing Engine'
    ],
    restricted_features: ['branding']
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    badge: 'Ultimate',
    color: 'amber-9',
    student_limit: 999999,
    class_limit: 999999,
    staff_limit: 999999,
    prices: { monthly: 15000, annual: 144000, lifetime: 300000 },
    features: [
      'Unlimited Active Students',
      'Unlimited Classes & Tutors',
      'Unlimited Staff Members',
      'Everything in Pro',
      'Student Portal Access',
      'Priority 24/7 WhatsApp Support',
      'Custom Card Branding & Themes',
      'Bulk CSV/Excel Data Exports',
      'Super Admin System Controls'
    ],
    restricted_features: []
  }
]

export const useSubscriptionStore = defineStore('subscription', {
  state: () => {
    let savedPrices = {}
    try {
      const raw = localStorage.getItem('cm_custom_package_prices')
      if (raw) savedPrices = JSON.parse(raw)
    } catch (e) {
      console.warn('Failed to parse custom package prices:', e)
    }

    const mergedPackages = DEFAULT_PACKAGES.map(pkg => {
      if (savedPrices[pkg.id]) {
        return { ...pkg, prices: { ...pkg.prices, ...savedPrices[pkg.id] } }
      }
      return pkg
    })

    return {
      currentPackageId: 'starter',
      billingCycle: 'monthly',
      subscriptionExpiresAt: null,
      appliedPromoCode: null,
      customPrices: savedPrices,
      packagesList: mergedPackages,
      isSuperAdmin: false,
      userRole: 'pending',
      pendingUpgradeRequest: null
    }
  },

  getters: {
    currentPackage(state) {
      if (state.isSuperAdmin) {
        return state.packagesList.find(p => p.id === 'enterprise') || DEFAULT_PACKAGES[3]
      }
      return state.packagesList.find(p => p.id === state.currentPackageId) || DEFAULT_PACKAGES[0]
    },

    studentLimit() {
      return this.currentPackage.student_limit
    },

    classLimit() {
      return this.currentPackage.class_limit
    },

    staffLimit() {
      return this.currentPackage.staff_limit
    },

    isLifetime() {
      return this.billingCycle === 'lifetime' || (this.subscriptionExpiresAt && this.subscriptionExpiresAt.startsWith('2099'))
    }
  },

  actions: {
    async syncSubscription() {
      try {
        const profile = await auth.getUser()
        if (profile) {
          this.isSuperAdmin = profile.email?.trim().toLowerCase() === 'sejanrandinu01@gmail.com'
          this.userRole = profile.role
          this.currentPackageId = profile.package_id || 'starter'
          this.billingCycle = profile.billing_cycle || 'monthly'
          this.subscriptionExpiresAt = profile.subscription_expires_at || null
          this.appliedPromoCode = profile.applied_promo_code || null
        }
      } catch (err) {
        console.error('Subscription sync error:', err)
      }
    },

    async fetchPackages() {
      try {
        const pkgs = await packagesApi.getAll()
        if (pkgs && Array.isArray(pkgs) && pkgs.length > 0) {
          // Merge custom prices over fetched packages if any
          this.packagesList = pkgs.map(pkg => {
            if (this.customPrices[pkg.id]) {
              return { ...pkg, prices: { ...pkg.prices, ...this.customPrices[pkg.id] } }
            }
            return pkg
          })
        }
      } catch (e) {
        console.error('Fetch packages error:', e)
      }
    },

    updatePackagePrice(packageId, monthly, annual, lifetime) {
      if (!this.customPrices[packageId]) {
        this.customPrices[packageId] = {}
      }
      if (monthly !== undefined && monthly !== null) this.customPrices[packageId].monthly = Number(monthly)
      if (annual !== undefined && annual !== null) this.customPrices[packageId].annual = Number(annual)
      if (lifetime !== undefined && lifetime !== null) this.customPrices[packageId].lifetime = Number(lifetime)

      localStorage.setItem('cm_custom_package_prices', JSON.stringify(this.customPrices))

      this.packagesList = this.packagesList.map(pkg => {
        if (pkg.id === packageId) {
          return {
            ...pkg,
            prices: {
              ...pkg.prices,
              ...this.customPrices[packageId]
            }
          }
        }
        return pkg
      })
    },

    hasFeature(featureKey) {
      if (this.isSuperAdmin) return true
      const pkg = this.currentPackage
      if (!pkg || !pkg.restricted_features) return true
      return !pkg.restricted_features.includes(featureKey)
    },

    canAddStudent(currentCount) {
      if (this.isSuperAdmin) return true
      return currentCount < this.studentLimit
    },

    canAddClass(currentCount) {
      if (this.isSuperAdmin) return true
      return currentCount < this.classLimit
    },

    canAddStaff(currentCount) {
      if (this.isSuperAdmin) return true
      return currentCount < this.staffLimit
    }
  },

  persist: true
})
