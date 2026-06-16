import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs, type AuditListParams } from '../api/audit'

export function useAuditLogs(params: AuditListParams) {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () => fetchAuditLogs(params),
    staleTime: 10_000,
  })
}
