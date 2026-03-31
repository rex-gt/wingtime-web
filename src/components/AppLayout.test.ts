import { vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { makeUser } from '../__tests__/helpers'
import AppLayout from './AppLayout.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

function mountLayout(role: 'admin' | 'operator' | 'member') {
  const user = makeUser({ role })
  return mount(AppLayout, {
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
    },
    slots: {
      default: '<div class="content">Page Content</div>'
    }
  })
}

describe('AppLayout.vue', () => {
  it('renders correctly and shows slot content', () => {
    const wrapper = mountLayout('member')
    expect(wrapper.text()).toContain('Page Content')
  })

  it('shows Manage Members link only for admin', async () => {
    const adminWrapper = mountLayout('admin')
    expect(adminWrapper.text()).toContain('Manage Members')

    const memberWrapper = mountLayout('member')
    expect(memberWrapper.text()).not.toContain('Manage Members')
  })

  it('shows Manage Aircraft link for admin and operator', () => {
    const adminWrapper = mountLayout('admin')
    expect(adminWrapper.text()).toContain('Manage Aircraft')

    const operatorWrapper = mountLayout('operator')
    expect(operatorWrapper.text()).toContain('Manage Aircraft')

    const memberWrapper = mountLayout('member')
    expect(memberWrapper.text()).not.toContain('Manage Aircraft')
  })

  it('toggles mobile drawer when hamburger is clicked', async () => {
    const wrapper = mountLayout('member')
    const drawer = wrapper.find('.left-drawer')
    
    expect(drawer.classes()).not.toContain('open')
    
    await wrapper.find('.hamburger').trigger('click')
    expect(drawer.classes()).toContain('open')
    
    await wrapper.find('.drawer-close').trigger('click')
    expect(drawer.classes()).not.toContain('open')
  })
})
