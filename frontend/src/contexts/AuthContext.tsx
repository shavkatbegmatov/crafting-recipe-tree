import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { AuthUser } from '../api/auth'
import { login as apiLogin, getMe } from '../api/auth'

interface AuthContextType {
  user: AuthUser | null
  isAdmin: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  error: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.role === 'ADMIN'

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      getMe()
        .then((u) => setUser({ ...u, token }))
        .catch(() => {
          localStorage.removeItem('token')
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setError(null)
    try {
      const res = await apiLogin({ username, password })
      if (res.token) {
        localStorage.setItem('token', res.token)
        setUser(res)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Login failed'
      setError(msg)
      throw new Error(msg)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
