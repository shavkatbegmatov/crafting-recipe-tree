import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchChatMessages,
  deleteChatMessage,
  muteUser,
  unmuteUser,
  fetchChatStats,
  setAnnouncement,
  clearAnnouncement,
  type ChatMessageListParams,
} from '../api/chatAdmin'

export function useAdminChatMessages(params: ChatMessageListParams) {
  return useQuery({
    queryKey: ['adminChat', params],
    queryFn: () => fetchChatMessages(params),
    staleTime: 5_000,
  })
}

export function useChatStats() {
  return useQuery({
    queryKey: ['chatStats'],
    queryFn: fetchChatStats,
    staleTime: 10_000,
  })
}

function useInvalidateModeration() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['adminChat'] })
    qc.invalidateQueries({ queryKey: ['chatStats'] })
  }
}

export function useDeleteChatMessage() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: (id: number) => deleteChatMessage(id),
    onSuccess: invalidate,
  })
}

export function useMuteUser() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: ({ id, durationMinutes }: { id: number; durationMinutes?: number }) =>
      muteUser(id, durationMinutes),
    onSuccess: invalidate,
  })
}

export function useUnmuteUser() {
  const invalidate = useInvalidateModeration()
  return useMutation({
    mutationFn: (id: number) => unmuteUser(id),
    onSuccess: invalidate,
  })
}

export function useSetAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (message: string) => setAnnouncement(message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcement'] }),
  })
}

export function useClearAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: clearAnnouncement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcement'] }),
  })
}
