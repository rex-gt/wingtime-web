import { vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { makeUser, makeAircraft, makeReservation, makeBillingRecord } from '../__tests__/helpers'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

const mockMembersGetAll = vi.fn(() => Promise.resolve({ data: [] }))
const mockAircraftGetAll = vi.fn(() => Promise.resolve({ data: [makeAircraft()] }))
const mockReservationsGetAll = vi.fn(() => Promise.resolve({ data: [makeReservation()] }))
const mockBillingGetAll = vi.fn(() => Promise.resolve({ data: [makeBillingRecord()] }))

vi.mock('../services/api', () => ({
  authAPI: { login: vi.fn(), getProfile: vi.fn() },
  membersAPI: { getAll: () => mockMembersGetAll() },
  aircraftAPI: { getAll: () => mockAircraftGetAll() },
  reservationsAPI: { getAll: () => mockReservationsGetAll() },
  billingAPI: { getAll: () => mockBillingGetAll() }
}))

import Dashboard from './Dashboard.vue'

function mountDashboard(role: 'admin' | 'operator' | 'member') {
  const user = makeUser({ role })
  return mount(Dashboard, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            auth: { user, token: 'test-token' }
          },
          stubActions: false
        })
      ],
      stubs: {
        RouterLink: true
      }
    }
  })
}

describe('Dashboard.vue', () => {
  it('shows Total Members stat card for admin', async () => {
    const wrapper = mountDashboard('admin')
    await flushPromises()
    expect(wrapper.text()).toContain('Total Members')
  })

  it('hides Total Members stat card for member', async () => {
    const wrapper = mountDashboard('member')
    await flushPromises()
    expect(wrapper.text()).not.toContain('Total Members')
  })

  it('shows Unpaid Bills stat card for admin', async () => {
    const wrapper = mountDashboard('admin')
    await flushPromises()
    expect(wrapper.text()).toContain('Unpaid Bills')
  })

  it('hides Unpaid Bills stat card for member', async () => {
    const wrapper = mountDashboard('member')
    await flushPromises()
    expect(wrapper.text()).not.toContain('Unpaid Bills')
  })

  it('always shows Available Aircraft stat card', async () => {
    const wrapper = mountDashboard('member')
    await flushPromises()
    expect(wrapper.text()).toContain('Available Aircraft')
  })

  it('always shows Upcoming Reservations stat card', async () => {
    const wrapper = mountDashboard('member')
    await flushPromises()
    expect(wrapper.text()).toContain('Upcoming Reservations')
  })

  it('shows Manage Members button only for admin', async () => {
    const adminWrapper = mountDashboard('admin')
    await flushPromises()
    expect(adminWrapper.text()).toContain('Manage Members')

    const memberWrapper = mountDashboard('member')
    await flushPromises()
    expect(memberWrapper.text()).not.toContain('Manage Members')
  })

  it('shows Billing button for operator', async () => {
    const wrapper = mountDashboard('operator')
    await flushPromises()
    expect(wrapper.text()).toContain('Billing')
  })

  it('correctly counts upcoming and in-progress reservations', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    const futureEnd = new Date(futureDate)
    futureEnd.setHours(futureEnd.getHours() + 2)

    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    
    mockReservationsGetAll.mockResolvedValue({
      data: [
        makeReservation({ id: 1, status: 'scheduled', start_time: futureDate.toISOString(), end_time: futureEnd.toISOString() }),
        makeReservation({ id: 2, status: 'in_progress', start_time: new Date().toISOString(), end_time: futureEnd.toISOString() }),
        makeReservation({ id: 3, status: 'completed', start_time: pastDate.toISOString(), end_time: new Date().toISOString() }),
        makeReservation({ id: 4, status: 'scheduled', start_time: pastDate.toISOString(), end_time: new Date().toISOString() }), // Expired
      ]
    })

    const wrapper = mountDashboard('member')
    await flushPromises()
    
    // Should count ID 1 and ID 2
    const upcomingCard = wrapper.findAll('.stat-card').find(c => c.text().includes('Upcoming Reservations'))
    expect(upcomingCard?.find('.value').text()).toBe('2')
  })
})
