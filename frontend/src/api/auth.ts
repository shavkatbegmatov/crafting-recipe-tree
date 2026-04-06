import client from './client'

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthUser {
  token?: string
  username: string
  role: string
}

export async function login(data: LoginRequest): Promise<AuthUser> {
  const { data: res } = await client.post('/auth/login', data)
  return res
}

export async function getMe(): Promise<AuthUser> {
  const { data: res } = await client.get('/auth/me')
  return res
}
