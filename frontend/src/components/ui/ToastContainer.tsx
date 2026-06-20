import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { subscribeToasts, dismiss, type ToastItem } from '../../utils/toast'

const ICON = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
}

const ACCENT = {
  error: 'border-red-500/40 text-red-300',
  success: 'border-green-500/40 text-green-300',
  info: 'border-dark-gold/40 text-dark-gold',
}

/** Global toast'larni ko'rsatadi (modul darajasidagi {@link subscribeToasts}'ga ulanadi). */
export default function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([])
  useEffect(() => subscribeToasts(setItems), [])

  if (items.length === 0) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {items.map((t) => {
        const Icon = ICON[t.type]
        return (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 bg-dark-card border rounded-lg shadow-2xl shadow-black/50 px-3.5 py-2.5 ${ACCENT[t.type]}`}
          >
            <Icon size={16} className="shrink-0 mt-0.5" />
            <span className="flex-1 text-xs text-skin-base leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-skin-muted hover:text-skin-base transition-colors"
              aria-label="close"
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
