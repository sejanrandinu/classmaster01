const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'login', component: () => import('pages/IndexPage.vue'), props: { initialTab: 'login' } },
      { path: 'register', component: () => import('pages/IndexPage.vue'), props: { initialTab: 'register' } },
      { path: 'privacy-policy', component: () => import('pages/PrivacyPolicyPage.vue') },
      { path: 'terms-of-service', component: () => import('pages/TermsOfServicePage.vue') },
      { path: 'about-us', component: () => import('pages/AboutUsPage.vue') },
      { path: 'contact', component: () => import('pages/ContactPage.vue') },
      { path: 'student-portal', component: () => import('pages/StudentPortalPage.vue') },
    ]
  },

  {
    path: '/dashboard',
    component: () => import('layouts/DashboardLayout.vue'),
    children: [
      { path: '', component: () => import('pages/DashboardPage.vue'), meta: { requiresAuth: true } },
      { path: 'students', component: () => import('pages/users/StudentsPage.vue'), meta: { requiresAuth: true } },
      { path: 'inactive-students', component: () => import('pages/users/InactiveStudentsPage.vue'), meta: { requiresAuth: true } },
      { path: 'discipline', component: () => import('pages/DisciplinePage.vue'), meta: { requiresAuth: true } },
      { path: 'pairing', component: () => import('pages/PairingPage.vue'), meta: { requiresAuth: true } },
      { path: 'tutors', component: () => import('pages/users/TutorsPage.vue'), meta: { requiresAuth: true } },
      { path: 'subjects', component: () => import('pages/SubjectsPage.vue'), meta: { requiresAuth: true } },
      { path: 'classes', component: () => import('pages/ClassesPage.vue'), meta: { requiresAuth: true } },
       { path: 'attendance', component: () => import('pages/AttendancePage.vue'), meta: { requiresAuth: true } },
       { path: 'attendance-history', component: () => import('pages/AttendanceHistoryPage.vue'), meta: { requiresAuth: true } },
       { path: 'fees', component: () => import('pages/FeesPage.vue'), meta: { requiresAuth: true } },
      { path: 'tutes', component: () => import('pages/TutesPage.vue'), meta: { requiresAuth: true } },
      { path: 'exams', component: () => import('pages/ExamsPage.vue'), meta: { requiresAuth: true } },
      { path: 'messages', component: () => import('pages/MessagingPage.vue'), meta: { requiresAuth: true } },
      { path: 'sms-settings', component: () => import('pages/SmsSettingsPage.vue'), meta: { requiresAuth: true } },
      { path: 'roles', component: () => import('pages/users/RolesPage.vue'), meta: { requiresAuth: true } },
      { path: 'staff', component: () => import('pages/users/StaffPage.vue'), meta: { requiresAuth: true } },
      { path: 'approvals', component: () => import('pages/AdminApprovalsPage.vue'), meta: { requiresAuth: true } },
      { path: 'approved-users', component: () => import('pages/ApprovedUsersPage.vue'), meta: { requiresAuth: true } },
      { path: 'scan-qr', component: () => import('pages/QRScannerPage.vue'), meta: { requiresAuth: true } },
      { path: 'profile', component: () => import('pages/ProfilePage.vue'), meta: { requiresAuth: true } },
      { path: 'settings', component: () => import('pages/SettingsPage.vue'), meta: { requiresAuth: true } },
      { path: 'pricing', component: () => import('pages/PricingPage.vue'), meta: { requiresAuth: true } },
      { path: 'promo-codes', component: () => import('pages/PromoCodesPage.vue'), meta: { requiresAuth: true } },
      { path: 'help-support', component: () => import('pages/HelpSupportPage.vue'), meta: { requiresAuth: true } }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
