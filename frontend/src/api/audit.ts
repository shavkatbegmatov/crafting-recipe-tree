import client from './client'

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE'
  | 'ROLE_CHANGE' | 'STATUS_CHANGE' | 'PASSWORD_RESET'
  | 'APPROVE' | 'REJECT' | 'SET_CURRENT'

export type AuditTargetType =
  | 'USER' | 'ACCESS_REQUEST' | 'CATEGORY' | 'ITEM' | 'TAG' | 'GAME_VERSION'

export interface AuditLog {
  id: number
  actorUsername: string | null
  action: AuditAction
  targetType: AuditTargetType
  targetId: number | null
  summary: string | null
  createdAt: string
}

export interface PagedAuditLogs {
  content: AuditLog[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface AuditListParams {
  actor?: string
  action?: AuditAction
  targetType?: AuditTargetType
  page?: number
  size?: number
}

export async function fetchAuditLogs(params: AuditListParams): Promise<PagedAuditLogs> {
  const { data } = await client.get('/admin/audit', {
    params: {
      actor: params.actor?.trim() || undefined,
      action: params.action || undefined,
      targetType: params.targetType || undefined,
      page: params.page ?? 0,
      size: params.size ?? 30,
    },
  })
  return data
}
