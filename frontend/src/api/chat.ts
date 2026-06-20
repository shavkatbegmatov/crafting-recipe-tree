import client from './client'

/** Bitta emoji bo'yicha reaksiya guruhi (emoji, soni, kim bosgani). */
export interface ReactionGroup {
  emoji: string
  count: number
  users: string[]
}

export interface ChatMessageDto {
  id: number
  username: string
  role: string
  content: string
  createdAt: string
  editedAt?: string | null
  replyToId?: number | null
  replyToUsername?: string | null
  replyToContent?: string | null
  reactions?: ReactionGroup[]
}

export async function fetchChatHistory(limit = 50, before?: number): Promise<ChatMessageDto[]> {
  const { data } = await client.get<ChatMessageDto[]>('/chat/messages', {
    params: { limit, before },
  })
  return data
}

/** Xabarlarni matn bo'yicha qidirish (eng yangi birinchi). */
export async function searchChatMessages(q: string, limit = 30): Promise<ChatMessageDto[]> {
  const { data } = await client.get<ChatMessageDto[]>('/chat/search', {
    params: { q, limit },
  })
  return data
}

export interface PresenceDto {
  users: string[]
  count: number
}

export async function fetchOnline(): Promise<PresenceDto> {
  const { data } = await client.get<PresenceDto>('/chat/online')
  return data
}

export interface ChatAnnouncement {
  message: string | null
  authorUsername: string | null
  createdAt: string | null
}

/** Joriy pin qilingan e'lon. Yo'q bo'lsa server 204 beradi → null. */
export async function fetchAnnouncement(): Promise<ChatAnnouncement | null> {
  const res = await client.get<ChatAnnouncement | ''>('/chat/announcement')
  return res.status === 204 ? null : (res.data as ChatAnnouncement)
}
