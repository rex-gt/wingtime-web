import { vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

const { mockResetPassword, mockRouteQuery } = vi.hoisted(() => ({
  mockResetPassword: vi.fn(),
  mockRouteQuery: { value: {} as Record<string, string> }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: mockRouteQuery.value })
}))

vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    getProfile: vi.fn(),
    resetPassword: mockResetPassword
  }
}))

import ResetPassword from './ResetPassword.vue'

function mountResetPassword() {
  return mount(ResetPassword, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      stubs: { RouterLink: true }
    }
  })
}

describe('ResetPassword.vue', () => {
  beforeEach(() => {
    mockResetPassword.mockClear()
    mockRouteQuery.value = {}
  })

  it('shows error when no token in route query', async () => {
    const wrapper = mountResetPassword()
    await flushPromises()
    expect(wrapper.text()).toContain('Invalid or missing reset token')
  })

  it('shows password form when token is present', async () => {
    mockRouteQuery.value = { token: 'valid-token' }
    const wrapper = mountResetPassword()
    await flushPromises()
    expect(wrapper.find('input#password').exists()).toBe(true)
    expect(wrapper.find('input#confirmPassword').exists()).toBe(true)
  })

  it('validates password minimum length', async () => {
    mockRouteQuery.value = { token: 'valid-token' }
    const wrapper = mountResetPassword()
    await flushPromises()

    await wrapper.find('input#password').setValue('abc')
    await wrapper.find('input#confirmPassword').setValue('abc')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('at least 6 characters')
  })

  it('validates password confirmation match', async () => {
    mockRouteQuery.value = { token: 'valid-token' }
    const wrapper = mountResetPassword()
    await flushPromises()

    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirmPassword').setValue('different123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Passwords do not match')
  })

  it('shows success message after successful reset', async () => {
    mockRouteQuery.value = { token: 'valid-token' }
    mockResetPassword.mockResolvedValue({ data: { message: 'ok' } })
    const wrapper = mountResetPassword()
    await flushPromises()

    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Password Set Successfully')
  })

  it('shows error message on API failure', async () => {
    mockRouteQuery.value = { token: 'valid-token' }
    mockResetPassword.mockRejectedValue({
      response: { data: { message: 'Token expired' } }
    })
    const wrapper = mountResetPassword()
    await flushPromises()

    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Token expired')
  })
})
