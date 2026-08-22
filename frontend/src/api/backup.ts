import client from './client'

export interface BackupStatus {
  available: boolean
  toolVersion: string | null
  serverVersion: string | null
  database: string
  size: string | null
  error: string | null
}

export interface RestoreReport {
  success: boolean
  safetyBackupFile: string
  warnings: string[]
}

export async function fetchBackupStatus(): Promise<BackupStatus> {
  const { data } = await client.get('/admin/backup/status')
  return data
}

/**
 * Butun bazani zaxira sifatida yuklab oladi.
 *
 * Oddiy havola (`<a href>`) ishlamaydi — endpoint Authorization sarlavhasini talab qiladi,
 * shuning uchun blob sifatida olib, brauzerga o'zimiz beramiz.
 */
export async function downloadBackup(onProgress?: (loaded: number) => void): Promise<string> {
  const response = await client.get('/admin/backup/download', {
    responseType: 'blob',
    onDownloadProgress: (e) => onProgress?.(e.loaded),
  })
  const disposition = response.headers['content-disposition'] as string | undefined
  const match = disposition?.match(/filename="?([^"]+)"?/i)
  const filename = match?.[1] || 'crafttree-backup.dump'

  const blob = new Blob([response.data], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return filename
}

/**
 * Bazani zaxiradan tiklaydi. Fayl xom tana sifatida yuboriladi (multipart emas):
 * zaxira rasm yuklash uchun qo'yilgan multipart chegarasidan katta bo'lishi mumkin.
 *
 * @param confirm baza nomi — server mos kelmasa amalni bajarmaydi
 */
export async function restoreBackup(
  file: File,
  confirm: string,
  onProgress?: (percent: number) => void
): Promise<RestoreReport> {
  const { data } = await client.post('/admin/backup/restore', file, {
    params: { confirm, filename: file.name },
    headers: { 'Content-Type': 'application/octet-stream' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  })
  return data
}
