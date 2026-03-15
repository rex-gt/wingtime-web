import { vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
})

vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'log').mockImplementation(() => {})
