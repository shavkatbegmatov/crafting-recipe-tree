/**
 * Yengil, kutubxonasiz toast tizimi — modul darajasidagi pub/sub.
 * React daraxtidan mustaqil, shuning uchun uni TanStack Query QueryClient'dan
 * (komponentlardan tashqarida) ham chaqirish mumkin.
 */
export type ToastType = 'error' | 'success' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const DURATION_MS = 4500
let items: ToastItem[] = []
let nextId = 1
let listeners: Array<(items: ToastItem[]) => void> = []

function emit() {
  for (const l of listeners) l(items)
}

function push(message: string, type: ToastType) {
  const id = nextId++
  items = [...items, { id, message, type }]
  emit()
  setTimeout(() => dismiss(id), DURATION_MS)
}

export function dismiss(id: number) {
  items = items.filter((t) => t.id !== id)
  emit()
}

export const toast = {
  error: (message: string) => push(message, 'error'),
  success: (message: string) => push(message, 'success'),
  info: (message: string) => push(message, 'info'),
}

/** ToastContainer ulanadi; obuna bekor qilish funksiyasini qaytaradi. */
export function subscribeToasts(listener: (items: ToastItem[]) => void): () => void {
  listeners.push(listener)
  listener(items)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}
