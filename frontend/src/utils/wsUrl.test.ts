import { describe, it, expect, afterEach, vi } from 'vitest'
import { getWsUrl } from './wsUrl'

describe('getWsUrl', () => {
  const origBase = import.meta.env.VITE_API_BASE_URL

  afterEach(() => {
    import.meta.env.VITE_API_BASE_URL = origBase
    vi.unstubAllGlobals()
  })

  it('VITE_API_BASE_URL (https) → wss va /ws qo\'shiladi', () => {
    import.meta.env.VITE_API_BASE_URL = 'https://api.example.com'
    expect(getWsUrl()).toBe('wss://api.example.com/ws')
  })

  it('VITE_API_BASE_URL (http) → ws', () => {
    import.meta.env.VITE_API_BASE_URL = 'http://localhost:8080'
    expect(getWsUrl()).toBe('ws://localhost:8080/ws')
  })

  it('baza yo\'q + https origin → wss', () => {
    import.meta.env.VITE_API_BASE_URL = ''
    vi.stubGlobal('location', { protocol: 'https:', host: 'mysite.uz' })
    expect(getWsUrl()).toBe('wss://mysite.uz/ws')
  })

  it('baza yo\'q + http origin → ws', () => {
    import.meta.env.VITE_API_BASE_URL = ''
    vi.stubGlobal('location', { protocol: 'http:', host: 'localhost:5173' })
    expect(getWsUrl()).toBe('ws://localhost:5173/ws')
  })
})
