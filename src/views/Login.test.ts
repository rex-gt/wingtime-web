import { vi, type Mock } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    getProfile: vi.fn(),
    forgotPassword: vi.fn()
  }
}))

import Login from './Login.vue'
import { useAuthStore } from '../stores/auth'
import { authAPI } from '../services/api'

function mountLogin() {
  return mount(Login, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })]
    }
  })
}

describe('Login.vue', () => {
  it('renders email and password inputs', () => {
    const wrapper = mountLogin()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('renders Sign In button', () => {
    const wrapper = mountLogin()
    expect(wrapper.find('button[type="submit"]').text()).toContain('Sign In')
  })

  it('shows error when submitting with empty fields', async () => {
    const wrapper = mountLogin()
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Please enter both email and password')
  })

  it('calls authStore.login with entered email and password', async () => {
    const wrapper = mountLogin()
    const store = useAuthStore()
    ;(store.login as Mock).mockResolvedValue(undefined)

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(store.login).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('shows loading state during login', async () => {
    const wrapper = mountLogin()
    const store = useAuthStore()

    let resolveLogin!: (value?: unknown) => void
    ;(store.login as Mock).mockReturnValue(new Promise(r => { resolveLogin = r }))

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('button[type="submit"]').text()).toContain('Signing in...')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()

    resolveLogin()
    await flushPromises()
  })

  it('shows server unreachable error when login throws without response', async () => {
    const wrapper = mountLogin()
    const store = useAuthStore()
    ;(store.login as Mock).mockRejectedValue(new Error('Network error'))

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Unable to reach the server')
  })

  it('shows 401 error message for invalid credentials', async () => {
    const wrapper = mountLogin()
    const store = useAuthStore()
    ;(store.login as Mock).mockRejectedValue({
      response: { status: 401, data: { message: 'Invalid email or password.' } }
    })

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('wrong')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Invalid email or password')
  })

  it('shows generic server error for other status codes', async () => {
    const wrapper = mountLogin()
    const store = useAuthStore()
    ;(store.login as Mock).mockRejectedValue({
      response: { status: 500, data: {} }
    })

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Server error (500)')
  })

  it('resets loading state after error', async () => {
    const wrapper = mountLogin()
    const store = useAuthStore()
    ;(store.login as Mock).mockRejectedValue(new Error('fail'))

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('button[type="submit"]').text()).toContain('Sign In')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  describe('Forgot Password flow', () => {
    it('toggles between Login and Forgot Password modes', async () => {
      const wrapper = mountLogin()
      
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      
      await wrapper.find('.forgot-link').trigger('click')
      expect(wrapper.find('input[type="password"]').exists()).toBe(false)
      expect(wrapper.find('h1').text()).toContain('Welcome to AeroBook')
      expect(wrapper.find('button[type="submit"]').text()).toContain('Send Reset Link')
      
      await wrapper.find('.back-link').trigger('click')
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').text()).toContain('Sign In')
    })

    it('calls authAPI.forgotPassword with entered email', async () => {
      const wrapper = mountLogin()
      ;(authAPI.forgotPassword as Mock).mockResolvedValue({ data: { message: 'sent' } })

      await wrapper.find('.forgot-link').trigger('click')
      await wrapper.find('#resetEmail').setValue('reset@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(authAPI.forgotPassword).toHaveBeenCalledWith('reset@example.com')
      expect(wrapper.text()).toContain('Reset link sent')
    })

    it('shows error when email is not registered', async () => {
      const wrapper = mountLogin()
      ;(authAPI.forgotPassword as Mock).mockRejectedValue({
        response: { status: 404, data: { message: 'User not found' } }
      })

      await wrapper.find('.forgot-link').trigger('click')
      await wrapper.find('#resetEmail').setValue('nonexistent@example.com')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain('This email is not registered in our system.')
    })

    it('shows loading state during forgot password request', async () => {
      const wrapper = mountLogin()
      let resolveRequest!: (value?: any) => void
      ;(authAPI.forgotPassword as Mock).mockReturnValue(new Promise(r => { resolveRequest = r }))

      await wrapper.find('.forgot-link').trigger('click')
      await wrapper.find('#resetEmail').setValue('test@example.com')
      await wrapper.find('form').trigger('submit')

      expect(wrapper.find('button[type="submit"]').text()).toContain('Sending Link...')
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()

      resolveRequest({ data: {} })
      await flushPromises()
    })
  })
})
