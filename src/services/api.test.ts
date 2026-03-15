import { vi } from 'vitest'

const { mockGet, mockPost, mockPut, mockDelete, capturedInterceptor } = vi.hoisted(() => {
  const state = {
    mockGet: vi.fn(),
    mockPost: vi.fn(),
    mockPut: vi.fn(),
    mockDelete: vi.fn(),
    capturedInterceptor: { fn: null as null | ((config: any) => any) }
  }
  return state
})

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
      interceptors: {
        request: {
          use: vi.fn((cb: (config: any) => any) => {
            capturedInterceptor.fn = cb
          })
        }
      }
    }))
  }
}))

import axios from 'axios'
import { authAPI, membersAPI, aircraftAPI, reservationsAPI, flightLogsAPI, billingAPI } from './api'

beforeEach(() => {
  mockGet.mockClear()
  mockPost.mockClear()
  mockPut.mockClear()
  mockDelete.mockClear()
})

describe('axios instance', () => {
  it('creates axios instance with default config', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  it('registers a request interceptor', () => {
    expect(capturedInterceptor.fn).toBeDefined()
  })
})

describe('request interceptor', () => {
  it('adds Bearer token when token exists in localStorage', () => {
    localStorage.setItem('token', 'my-jwt-token')
    const config = { headers: {} as Record<string, string> }
    const result = capturedInterceptor.fn!(config)
    expect(result.headers.Authorization).toBe('Bearer my-jwt-token')
  })

  it('does not add Authorization header when no token', () => {
    localStorage.removeItem('token')
    const config = { headers: {} as Record<string, string> }
    const result = capturedInterceptor.fn!(config)
    expect(result.headers.Authorization).toBeUndefined()
  })
})

describe('authAPI', () => {
  it('login posts to /users/login', () => {
    authAPI.login('test@example.com', 'pass123')
    expect(mockPost).toHaveBeenCalledWith('/users/login', {
      email: 'test@example.com',
      password: 'pass123'
    })
  })

  it('getProfile calls GET /users/profile', () => {
    authAPI.getProfile()
    expect(mockGet).toHaveBeenCalledWith('/users/profile')
  })

  it('updateProfile calls PUT /users/profile', () => {
    const data = { first_name: 'Test', last_name: 'User', email: 'test@example.com' }
    authAPI.updateProfile(data)
    expect(mockPut).toHaveBeenCalledWith('/users/profile', data)
  })

  it('resetPassword posts to /users/reset-password', () => {
    authAPI.resetPassword('token123', 'newpass')
    expect(mockPost).toHaveBeenCalledWith('/users/reset-password', {
      token: 'token123',
      password: 'newpass'
    })
  })

  it('register posts to /users/register', () => {
    authAPI.register('John', 'Doe', 'john@example.com', 'pass123')
    expect(mockPost).toHaveBeenCalledWith('/users/register', {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'pass123'
    })
  })
})

describe('membersAPI', () => {
  it('getAll calls GET /members', () => {
    membersAPI.getAll()
    expect(mockGet).toHaveBeenCalledWith('/members')
  })

  it('getById calls GET /members/:id', () => {
    membersAPI.getById(5)
    expect(mockGet).toHaveBeenCalledWith('/members/5')
  })

  it('create posts to /members', () => {
    const data = { first_name: 'A', last_name: 'B', email: 'a@b.com', password: 'p' }
    membersAPI.create(data)
    expect(mockPost).toHaveBeenCalledWith('/members', data)
  })

  it('update calls PUT /members/:id', () => {
    membersAPI.update(5, { first_name: 'Updated' })
    expect(mockPut).toHaveBeenCalledWith('/members/5', { first_name: 'Updated' })
  })

  it('delete calls DELETE /members/:id', () => {
    membersAPI.delete(5)
    expect(mockDelete).toHaveBeenCalledWith('/members/5')
  })
})

describe('aircraftAPI', () => {
  it('getAll calls GET /aircraft', () => {
    aircraftAPI.getAll()
    expect(mockGet).toHaveBeenCalledWith('/aircraft')
  })

  it('create posts to /aircraft', () => {
    aircraftAPI.create({ tail_number: 'N99' })
    expect(mockPost).toHaveBeenCalledWith('/aircraft', { tail_number: 'N99' })
  })

  it('delete calls DELETE /aircraft/:id', () => {
    aircraftAPI.delete(3)
    expect(mockDelete).toHaveBeenCalledWith('/aircraft/3')
  })
})

describe('reservationsAPI', () => {
  it('getAll calls GET /reservations', () => {
    reservationsAPI.getAll()
    expect(mockGet).toHaveBeenCalledWith('/reservations')
  })

  it('create posts to /reservations', () => {
    reservationsAPI.create({ member_id: 1 })
    expect(mockPost).toHaveBeenCalledWith('/reservations', { member_id: 1 })
  })

  it('delete calls DELETE /reservations/:id', () => {
    reservationsAPI.delete(7)
    expect(mockDelete).toHaveBeenCalledWith('/reservations/7')
  })
})

describe('flightLogsAPI', () => {
  it('getAll calls GET /flight-logs', () => {
    flightLogsAPI.getAll()
    expect(mockGet).toHaveBeenCalledWith('/flight-logs')
  })

  it('create posts to /flight-logs', () => {
    flightLogsAPI.create({ member_id: 1 })
    expect(mockPost).toHaveBeenCalledWith('/flight-logs', { member_id: 1 })
  })
})

describe('billingAPI', () => {
  it('getAll calls GET /billing', () => {
    billingAPI.getAll()
    expect(mockGet).toHaveBeenCalledWith('/billing')
  })

  it('generate posts to /billing/generate', () => {
    billingAPI.generate(10)
    expect(mockPost).toHaveBeenCalledWith('/billing/generate', { flight_log_id: 10 })
  })

  it('markPaid calls PUT /billing/:id/pay', () => {
    billingAPI.markPaid(3)
    expect(mockPut).toHaveBeenCalledWith('/billing/3/pay', {})
  })

  it('getSummary calls GET /billing/summary/:memberId', () => {
    billingAPI.getSummary(2)
    expect(mockGet).toHaveBeenCalledWith('/billing/summary/2')
  })

  it('delete calls DELETE /billing/:id', () => {
    billingAPI.delete(4)
    expect(mockDelete).toHaveBeenCalledWith('/billing/4')
  })
})
