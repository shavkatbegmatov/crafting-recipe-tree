import axios from 'axios'
import client from './client'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  displayName?: string
  referralCode?: string
}

export type LayoutWidth = 'CENTERED' | 'FULL'

export interface AuthUser {
  token?: string
  username: string
  displayName?: string
  role: string
  referralCode?: string
  referralCount?: number
  createdAt?: string
  layoutWidth?: LayoutWidth
}

export interface LoginResponse {
  authenticated: boolean
  token?: string
  username?: string
  role?: string
  errorCode?: string
  layoutWidth?: LayoutWidth
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  try {
    const { data: res } = await client.post('/auth/login', data)
    return res
  } catch (e) {
    // Backend endi noto'g'ri parol / bloklangan akkaunt uchun 401 qaytaradi (REST to'g'riligi).
    // Javob tanasida {authenticated:false, errorCode} bor — uni normal natija sifatida qaytaramiz.
    if (axios.isAxiosError(e) && e.response?.status === 401 && e.response.data) {
      return e.response.data as LoginResponse
    }
    throw e
  }
}

export async function register(data: RegisterRequest): Promise<AuthUser> {
  const { data: res } = await client.post('/auth/register', data)
  return res
}

export async function getMe(): Promise<AuthUser> {
  const { data: res } = await client.get('/auth/me')
  return res
}

export interface UpdateProfileRequest {
  displayName?: string
  newPassword?: string
  currentPassword?: string
  layoutWidth?: LayoutWidth
}

export async function updateProfile(data: UpdateProfileRequest): Promise<AuthUser> {
  const { data: res } = await client.put('/auth/profile', data)
  return res
}

export async function lookupReferrer(code: string): Promise<string | null> {
  try {
    const { data } = await client.get('/auth/referrer', { params: { code } })
    return data.name
  } catch {
    return null
  }
}
