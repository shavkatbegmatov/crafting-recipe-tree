import axios from 'axios'

/**
 * API/umumiy xatodan foydalanuvchiga ko'rsatish uchun xabar chiqaradi.
 * Backend xato tanasi {error|message} shaklida bo'ladi.
 */
export function getErrorMessage(error: unknown, fallback = 'Xatolik yuz berdi'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined
    return data?.error || data?.message || error.message || fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
