import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAccessRequest,
  getMyAccessRequest,
  cancelAccessRequest,
  fetchAccessRequests,
  fetchPendingRequestsCount,
  approveAccessRequest,
  rejectAccessRequest,
  type AccessRequestListParams,
} from '../api/accessRequests'

// ── Foydalanuvchi tomoni ──

/** Foydalanuvchining o'z arizasi holati. `enabled` orqali faqat oddiy USER uchun yoqiladi. */
export function useMyAccessRequest(enabled = true) {
  return useQuery({
    queryKey: ['myAccessRequest'],
    queryFn: getMyAccessRequest,
    enabled,
    staleTime: 30_000,
  })
}

export function useCreateAccessRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (message?: string) => createAccessRequest(message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myAccessRequest'] }),
  })
}

export function useCancelAccessRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelAccessRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myAccessRequest'] }),
  })
}

// ── Super-admin tomoni ──

export function useAccessRequests(params: AccessRequestListParams) {
  return useQuery({
    queryKey: ['accessRequests', params],
    queryFn: () => fetchAccessRequests(params),
    staleTime: 5_000,
  })
}

/** Kutilayotgan arizalar soni — admin menyusidagi badge uchun. `enabled` super-admin'ga cheklaydi. */
export function usePendingRequestsCount(enabled = true) {
  return useQuery({
    queryKey: ['pendingRequestsCount'],
    queryFn: fetchPendingRequestsCount,
    enabled,
    staleTime: 30_000,
  })
}

/** Ko'rib chiqishdan keyin yangilanadigan barcha so'rovlar (ro'yxat, badge, va rol o'zgargani uchun foydalanuvchilar). */
function useInvalidateAfterReview() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['accessRequests'] })
    qc.invalidateQueries({ queryKey: ['pendingRequestsCount'] })
    // Tasdiqlash foydalanuvchi rolini o'zgartiradi — foydalanuvchilar paneli ham yangilansin.
    qc.invalidateQueries({ queryKey: ['adminUsers'] })
    qc.invalidateQueries({ queryKey: ['userStats'] })
  }
}

export function useApproveAccessRequest() {
  const invalidate = useInvalidateAfterReview()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => approveAccessRequest(id, note),
    onSuccess: invalidate,
  })
}

export function useRejectAccessRequest() {
  const invalidate = useInvalidateAfterReview()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => rejectAccessRequest(id, note),
    onSuccess: invalidate,
  })
}
