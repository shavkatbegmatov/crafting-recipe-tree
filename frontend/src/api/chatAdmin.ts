import client from './client'
import type { ChatAnnouncement } from './chat'

export interface AdminChatMessage {
  id: number
  userId: number
  username: string
  role: string
  content: string
  createdAt: string
}

export interface PagedChatMessages {
  content: AdminChatMessage[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface TopSender {
  username: string
  count: number
}

export interface ChatStats {
  totalMessages: number
  todayMessages: number
  onlineCount: number
  topSenders: TopSender[]
}

export interface ChatMessageListParams {
  search?: string
  username?: string
  page?: number
  size?: number
}

export async function fetchChatMessages(p: ChatMessageListParams): Promise<PagedChatMessages> {
  const { data } = await client.get('/admin/chat/messages', {
    params: {
      search: p.search?.trim() || undefined,
      username: p.username?.trim() || undefined,
      page: p.page ?? 0,
      size: p.size ?? 30,
    },
  })
  return data
}

export async function deleteChatMessage(id: number): Promise<void> {
  await client.delete(`/admin/chat/messages/${id}`)
}

/** durationMinutes berilmasa — doimiy mute. */
export async function muteUser(id: number, durationMinutes?: number): Promise<void> {
  await client.post(`/admin/chat/users/${id}/mute`, { durationMinutes: durationMinutes ?? null })
}

export async function unmuteUser(id: number): Promise<void> {
  await client.post(`/admin/chat/users/${id}/unmute`)
}

export async function fetchChatStats(): Promise<ChatStats> {
  const { data } = await client.get('/admin/chat/stats')
  return data
}

export async function setAnnouncement(message: string): Promise<ChatAnnouncement> {
  const { data } = await client.post('/admin/chat/announcement', { message })
  return data
}

export async function clearAnnouncement(): Promise<void> {
  await client.delete('/admin/chat/announcement')
}
