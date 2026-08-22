import { useMutation, useQuery } from '@tanstack/react-query'
import {
  fetchBackupStatus,
  downloadBackup,
  restoreBackup,
  type RestoreReport,
} from '../api/backup'

/** Zaxira muhitining tayyorligi — UI tugmalarni shu asosda yoqadi. */
export function useBackupStatus(enabled = true) {
  return useQuery({
    queryKey: ['backupStatus'],
    queryFn: fetchBackupStatus,
    enabled,
    staleTime: 60_000,
  })
}

export function useDownloadBackup() {
  return useMutation({
    mutationFn: (onProgress?: (loaded: number) => void) => downloadBackup(onProgress),
  })
}

export function useRestoreBackup() {
  return useMutation<RestoreReport, unknown, { file: File; confirm: string; onProgress?: (p: number) => void }>({
    mutationFn: ({ file, confirm, onProgress }) => restoreBackup(file, confirm, onProgress),
  })
}
