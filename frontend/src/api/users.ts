import client from './client'

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

export interface AdminUser {
  id: number
  username: string
  displayName: string | null
  role: UserRole
  enabled: boolean
  referralCode: string
  referralCount: number
  referredByUsername: string | null
  createdAt: string
}

export interface UserStats {
  total: number
  superAdmins: number
  admins: number
  users: number
  blocked: number
}

export interface PagedUsers {
  content: AdminUser[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface UserListParams {
  search?: string
  role?: UserRole
  /** undefined — hammasi, true — faqat faol, false — faqat bloklangan */
  enabled?: boolean
  page?: number
  size?: number
}

export async function fetchUsers(params: UserListParams): Promise<PagedUsers> {
  const { data } = await client.get('/admin/users', {
    params: {
      search: params.search?.trim() || undefined,
      role: params.role || undefined,
      enabled: params.enabled,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  })
  return data
}

export async function fetchUserStats(): Promise<UserStats> {
  const { data } = await client.get('/admin/users/stats')
  return data
}

export async function updateUserRole(id: number, role: UserRole): Promise<AdminUser> {
  const { data } = await client.patch(`/admin/users/${id}/role`, { role })
  return data
}

export async function updateUserStatus(id: number, enabled: boolean): Promise<AdminUser> {
  const { data } = await client.patch(`/admin/users/${id}/status`, { enabled })
  return data
}

/**
 * Parolni reset qiladi. newPassword bo'sh bo'lsa — server tasodifiy vaqtinchalik parol
 * hosil qiladi. Har ikki holatda ham amalga oshirilgan parol matni qaytariladi.
 */
export async function resetUserPassword(id: number, newPassword?: string): Promise<string> {
  const body = newPassword && newPassword.trim().length > 0 ? { newPassword: newPassword.trim() } : {}
  const { data } = await client.post(`/admin/users/${id}/reset-password`, body)
  return data.temporaryPassword
}

export async function deleteUser(id: number): Promise<void> {
  await client.delete(`/admin/users/${id}`)
}
