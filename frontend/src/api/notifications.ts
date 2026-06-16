import client from './client'

export type NotificationType =
  | 'ACCESS_REQUEST_SUBMITTED'
  | 'ACCESS_REQUEST_APPROVED'
  | 'ACCESS_REQUEST_REJECTED'

export interface AppNotification {
  id: number
  /** Matn frontend i18n'da shu tur bo'yicha render qilinadi. */
  type: NotificationType
  /** Voqeani keltirib chiqargan foydalanuvchi (nullable). */
  actorUsername: string | null
  /** Bosilganda o'tiladigan ichki yo'l (nullable). */
  link: string | null
  read: boolean
  createdAt: string
}

export interface PagedNotifications {
  content: AppNotification[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export async function fetchNotifications(page = 0, size = 20): Promise<PagedNotifications> {
  const { data } = await client.get('/notifications', { params: { page, size } })
  return data
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await client.get('/notifications/unread-count')
  return data.count
}

export async function markNotificationRead(id: number): Promise<void> {
  await client.post(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await client.post('/notifications/read-all')
}
