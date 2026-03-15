import { vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { makeUser, makeAircraft } from '../__tests__/helpers'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('../services/api', () => ({
  authAPI: { login: vi.fn(), getProfile: vi.fn() },
  aircraftAPI: {
    getAll: vi.fn(() => Promise.resolve({ data: [makeAircraft()] })),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

import Aircraft from './Aircraft.vue'

function mountAircraft(role: 'admin' | 'operator' | 'member') {
  const user = makeUser({ role })
  return mount(Aircraft, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            auth: { user, token: 'test-token' }
          },
          stubActions: false
        })
      ]
    }
  })
}

describe('Aircraft.vue', () => {
  it('shows access denied for member role', async () => {
    const wrapper = mountAircraft('member')
    await flushPromises()
    expect(wrapper.text()).toContain('Access Denied')
  })

  it('shows aircraft table for admin', async () => {
    const wrapper = mountAircraft('admin')
    await flushPromises()
    expect(wrapper.text()).toContain('Aircraft Management')
    expect(wrapper.find('table').exists()).toBe(true)
  })

  it('shows Add Aircraft button for operator', async () => {
    const wrapper = mountAircraft('operator')
    await flushPromises()
    expect(wrapper.text()).toContain('+ Add Aircraft')
  })
})
