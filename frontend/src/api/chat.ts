import client from './client'

/** Bitta emoji bo'yicha reaksiya guruhi (emoji, soni, kim bosgani). */
export interface ReactionGroup {
  emoji: string
  count: number
  users: string[]
}

/** Xabarga ulangan fayl (rasm). url — /api bilan boshlanadigan nisbiy manzil. */
export interface Attachment {
  id: number
  filename: string
  contentType: string
  sizeBytes: number
  url: string
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
  attachment?: Attachment | null
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

/** Rasm yuklash — qaytgan ulanmani keyin xabarga (attachmentId) bog'lanadi. */
export async function uploadChatFile(file: File): Promise<Attachment> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post<Attachment>('/chat/upload', form)
  return data
}

/** Ulanmaning to'liq URL'i (dev'da Vite proxy, prod'da backend originiga). */
export function attachmentUrl(att: Attachment): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
  return base + att.url
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
