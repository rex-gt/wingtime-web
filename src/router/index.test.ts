import { vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent } from 'vue'
import { makeUser } from '../__tests__/helpers'

// Mock the API so the auth store's auto-load doesn't make real requests
vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    getProfile: vi.fn().mockRejectedValue(new Error('no profile'))
  }
}))

// Stub all view components
const StubComponent = defineComponent({ template: '<div>stub</div>' })

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', redirect: '/reservations' },
      { path: '/login', name: 'Login', component: StubComponent },
      { path: '/reset-password', name: 'ResetPassword', component: StubComponent },
      { path: '/dashboard', name: 'Dashboard', component: StubComponent, meta: { requiresAuth: true } },
      { path: '/aircraft', name: 'Aircraft', component: StubComponent, meta: { requiresAuth: true } },
      { path: '/reservations', name: 'Reservations', component: StubComponent, meta: { requiresAuth: true } },
      { path: '/flight-logs', name: 'FlightLogs', component: StubComponent, meta: { requiresAuth: true } },
      { path: '/billing', name: 'Billing', component: StubComponent, meta: { requiresAuth: true } },
      { path: '/profile', name: 'Profile', component: StubComponent, meta: { requiresAuth: true } },
      { path: '/members', name: 'Members', component: StubComponent, meta: { requiresAuth: true, requiresAdmin: true } },
    ]
  })
}

// Import the store AFTER mocking the API
import { useAuthStore } from '../stores/auth'

function setupRouter(storeOverrides: { token?: string; user?: ReturnType<typeof makeUser> | null } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const store = useAuthStore()
  if (storeOverrides.token) store.token = storeOverrides.token
  if (storeOverrides.user !== undefined) store.user = storeOverrides.user

  const router = createTestRouter()

  // Add the same guard logic as the real router
  router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore()
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next('/login')
    } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
      next('/dashboard')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
      next('/reservations')
    } else {
      next()
    }
  })

  const app = createApp(StubComponent)
  app.use(pinia)
  app.use(router)

  return { router, store }
}

describe('Router navigation guards', () => {
  describe('unauthenticated user', () => {
    it('redirects to /login when accessing /dashboard', async () => {
      const { router } = setupRouter()
      await router.push('/dashboard')
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('redirects to /login when accessing /reservations', async () => {
      const { router } = setupRouter()
      await router.push('/reservations')
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('redirects to /login when accessing /members', async () => {
      const { router } = setupRouter()
      await router.push('/members')
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('allows access to /login', async () => {
      const { router } = setupRouter()
      await router.push('/login')
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('allows access to /reset-password', async () => {
      const { router } = setupRouter()
      await router.push('/reset-password')
      expect(router.currentRoute.value.path).toBe('/reset-password')
    })
  })

  describe('authenticated member', () => {
    const memberSetup = () => setupRouter({
      token: 'valid-token',
      user: makeUser({ role: 'member' })
    })

    it('allows access to /dashboard', async () => {
      const { router } = memberSetup()
      await router.push('/dashboard')
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('allows access to /reservations', async () => {
      const { router } = memberSetup()
      await router.push('/reservations')
      expect(router.currentRoute.value.path).toBe('/reservations')
    })

    it('redirects from /login to /reservations', async () => {
      const { router } = memberSetup()
      await router.push('/login')
      expect(router.currentRoute.value.path).toBe('/reservations')
    })

    it('redirects from /members to /dashboard (non-admin)', async () => {
      const { router } = memberSetup()
      await router.push('/members')
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })
  })

  describe('authenticated admin', () => {
    const adminSetup = () => setupRouter({
      token: 'valid-token',
      user: makeUser({ role: 'admin' })
    })

    it('allows access to /members', async () => {
      const { router } = adminSetup()
      await router.push('/members')
      expect(router.currentRoute.value.path).toBe('/members')
    })

    it('redirects from /login to /reservations', async () => {
      const { router } = adminSetup()
      await router.push('/login')
      expect(router.currentRoute.value.path).toBe('/reservations')
    })
  })
})
