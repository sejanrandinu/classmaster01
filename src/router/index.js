import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Subdomain detection: student.classmastertms.com → /student-portal
  Router.beforeEach((to, from, next) => {
    const hostname = window.location.hostname
    const isStudentSubdomain =
      hostname === 'student.classmastertms.com' ||
      hostname.startsWith('student.')

    if (isStudentSubdomain && to.path !== '/student-portal') {
      next({ path: '/student-portal', query: to.query })
      return
    }

    const token = localStorage.getItem('classmaster-token')
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (requiresAuth && !token) {
      next('/login')
      return
    }

    // Auto-redirect authenticated users to dashboard if accessing public auth/landing routes
    if (token && (to.path === '/' || to.path === '/login' || to.path === '/register')) {
      next('/dashboard')
      return
    }

    next()
  })

  // Auto-reload on Vite chunk / CSS preload load failure after new deployment updates
  Router.onError((error) => {
    const isChunkOrCssError =
      error?.message?.includes('Unable to preload CSS') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed')

    if (isChunkOrCssError) {
      const lastReload = sessionStorage.getItem('cm-last-chunk-reload')
      const now = Date.now()
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('cm-last-chunk-reload', now.toString())
        window.location.reload()
      }
    }
  })

  return Router
})

