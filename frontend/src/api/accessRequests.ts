import client from './client'
import type { UserRole } from './users'

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

/** Foydalanuvchining o'z arizasi ko'rinishi (cheklangan maydonlar). */
export interface MyAccessRequest {
  id: number
  requestedRole: UserRole
  status: AccessRequestStatus
  message: string | null
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
}

/** Super-admin paneli uchun to'liq ariza ko'rinishi. */
export interface AccessRequest {
  id: number
  userId: number
  username: string
  displayName: string | null
  currentRole: UserRole
  requestedRole: UserRole
  status: AccessRequestStatus
  message: string | null
  reviewNote: string | null
  reviewedByUsername: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface PagedAccessRequests {
  content: AccessRequest[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface AccessRequestListParams {
  status?: AccessRequestStatus
  page?: number
  size?: number
}

// ── Foydalanuvchi tomoni ──

export async function createAccessRequest(message?: string): Promise<MyAccessRequest> {
  const body = message && message.trim().length > 0 ? { message: message.trim() } : {}
  const { data } = await client.post('/access-requests', body)
  return data
}

/** Eng so'nggi arizani qaytaradi. Ariza yo'q bo'lsa server 204 beradi → null. */
export async function getMyAccessRequest(): Promise<MyAccessRequest | null> {
  const res = await client.get<MyAccessRequest | ''>('/access-requests/me')
  return res.status === 204 ? null : (res.data as MyAccessRequest)
}

export async function cancelAccessRequest(id: number): Promise<MyAccessRequest> {
  const { data } = await client.post(`/access-requests/${id}/cancel`)
  return data
}

// ── Super-admin tomoni ──

export async function fetchAccessRequests(params: AccessRequestListParams): Promise<PagedAccessRequests> {
  const { data } = await client.get('/admin/access-requests', {
    params: {
      status: params.status || undefined,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  })
  return data
}

export async function fetchPendingRequestsCount(): Promise<number> {
  const { data } = await client.get('/admin/access-requests/pending-count')
  return data.count
}

export async function approveAccessRequest(id: number, note?: string): Promise<AccessRequest> {
  const body = note && note.trim().length > 0 ? { note: note.trim() } : {}
  const { data } = await client.post(`/admin/access-requests/${id}/approve`, body)
  return data
}

export async function rejectAccessRequest(id: number, note?: string): Promise<AccessRequest> {
  const body = note && note.trim().length > 0 ? { note: note.trim() } : {}
  const { data } = await client.post(`/admin/access-requests/${id}/reject`, body)
  return data
}
