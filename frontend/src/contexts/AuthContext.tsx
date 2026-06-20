import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { AuthUser, RegisterRequest, UpdateProfileRequest, LayoutWidth } from '../api/auth'
import {
  login as apiLogin,
  register as apiRegister,
  updateProfile as apiUpdateProfile,
  getMe,
} from '../api/auth'

type LoginResult =
  | { success: true }
  | { success: false; errorCode: string }

interface AuthContextType {
  user: AuthUser | null
  isAdmin: boolean
  isSuperAdmin: boolean
  layoutWidth: LayoutWidth
  isLoading: boolean
  login: (username: string, password: string) => Promise<LoginResult>
  register: (data: RegisterRequest) => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<void>
  /** Profilni serverdan qayta yuklaydi — masalan, admin huquqi berilgach yangi rolni olish uchun. */
  refreshUser: () => Promise<void>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  layoutWidth: 'CENTERED',
  isLoading: true,
  login: async () => ({ success: false as const, errorCode: 'LOGIN_FAILED' }),
  register: async () => {},
  updateProfile: async () => {},
  refreshUser: async () => {},
  logout: () => {},
  error: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // SUPER_ADMIN barcha ADMIN huquqlariga ega (backend RoleHierarchy bilan mos).
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const layoutWidth: LayoutWidth = user?.layoutWidth ?? 'CENTERED'

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

  const login = useCallback<AuthContextType['login']>(async (username: string, password: string) => {
    setError(null)

    const res = await apiLogin({ username, password })

    if (!res.authenticated || !res.token || !res.username || !res.role) {
      const errorCode = res.errorCode || 'LOGIN_FAILED'
      setError(errorCode)
      return { success: false as const, errorCode }
    }

    const authUser: AuthUser = {
      token: res.token,
      username: res.username,
      role: res.role,
      layoutWidth: res.layoutWidth,
    }

    localStorage.setItem('token', res.token)
    setUser(authUser)
    // Login javobi (LoginResponse) to'liq profilni (displayName, referal kodi, a'zo sanasi,
    // referallar soni) o'z ichiga olmaydi — register kabi darhol getMe() bilan to'ldiramiz,
    // shunda profil menyusi sahifani yangilamasdan (F5'siz) to'liq ko'rinadi.
    try {
      const full = await getMe()
      setUser({ ...full, token: res.token })
    } catch {
      /* login muvaffaqiyatli; to'liq profil keyingi yuklashda keladi */
    }
    return { success: true as const }
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    setError(null)
    try {
      const res = await apiRegister(data)
      if (res.token) {
        localStorage.setItem('token', res.token)
        setUser(res)
        // Register javobi (RegisterResponse) createdAt/referralCount'ni o'z ichiga olmaydi —
        // to'liq profilni darhol yuklab, profil menyusini (a'zo sanasi, referal kodi/statistikasi)
        // ro'yxatdan o'tgandan keyin sahifani yangilamasdan to'ldiramiz.
        try {
          const full = await getMe()
          setUser({ ...full, token: res.token })
        } catch {
          /* register muvaffaqiyatli; to'liq profil keyingi yuklashda keladi */
        }
      }
    } catch (err: any) {
      const code = err?.response?.data?.error || 'Registration failed'
      setError(code)
      throw new Error(code)
    }
  }, [])

  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    const res = await apiUpdateProfile(data)
    // Keep the existing token
    const token = localStorage.getItem('token')
    setUser({ ...res, token: token || undefined })
  }, [])

  // Serverdan profilni qayta o'qiydi. Rol DB'dan olinadi, shuning uchun admin huquqi
  // berilganidan keyin token o'zgarmasa ham yangi rol bu yerda aks etadi.
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const u = await getMe()
      setUser({ ...u, token })
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, isSuperAdmin, layoutWidth, isLoading, login, register, updateProfile, refreshUser, logout, error }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
