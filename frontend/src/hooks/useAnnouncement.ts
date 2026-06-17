import { useQuery } from '@tanstack/react-query'
import { fetchAnnouncement } from '../api/chat'

/** Joriy pin qilingan chat e'loni (public). Chat panel va admin sahifasi ishlatadi. */
export function useAnnouncement(enabled = true) {
  return useQuery({
    queryKey: ['announcement'],
    queryFn: fetchAnnouncement,
    enabled,
    staleTime: 30_000,
  })
}
