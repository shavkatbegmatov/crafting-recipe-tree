import client from './client'

export interface ChatMessageDto {
  id: number
  username: string
  role: string
  content: string
  createdAt: string
}

export async function fetchChatHistory(limit = 50): Promise<ChatMessageDto[]> {
  const { data } = await client.get<ChatMessageDto[]>('/chat/messages', {
    params: { limit },
  })
  return data
}
