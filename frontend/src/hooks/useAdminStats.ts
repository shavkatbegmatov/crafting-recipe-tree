import { useQuery } from '@tanstack/react-query'
import { fetchAdminStats } from '../api/adminStats'

/** Admin boshqaruv paneli statistikasi (faqat ADMIN/SUPER_ADMIN). */
export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
    enabled,
    staleTime: 30_000,
  })
}
