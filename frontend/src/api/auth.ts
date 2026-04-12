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

export interface AuthUser {
  token?: string
  username: string
  displayName?: string
  role: string
  referralCode?: string
  referralCount?: number
  createdAt?: string
}

export interface LoginResponse {
  authenticated: boolean
  token?: string
  username?: string
  role?: string
  errorCode?: string
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const { data: res } = await client.post('/auth/login', data)
  return res
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
