import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Loader2, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { useDeleteItems } from '../../hooks/useCreateItems'
import type { DeleteItemsResultRow } from '../../api/items'

interface Props {
  itemId: number
  itemName: string
  onClose: () => void
  onDeleted: () => void
}

/**
 * Bitta itemni o'chirish oynasi.
 *
 * Ochilishi bilan `dryRun` chaqiriladi: foydalanuvchi tasdiqlashdan OLDIN nima
 * o'chishini va item ingredient sifatida ishlatilayotgan bo'lsa — nima uchun
 * o'chirib bo'lmasligini ko'radi. O'chirish qaytarilmaydi.
 */
export default function DeleteItemDialog({ itemId, itemName, onClose, onDeleted }: Props) {
  const { t } = useTranslation()
  const mutation = useDeleteItems()
  const [row, setRow] = useState<DeleteItemsResultRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Ochilganda darhol ko'rib chiqamiz — bazaga tegilmaydi.
  useEffect(() => {
    let cancelled = false
    mutation
      .mutateAsync({ itemIds: [itemId], dryRun: true })
      .then((res) => {
        if (!cancelled) setRow(res.rows[0] ?? null)
      })
      .catch((e) => {
        if (!cancelled) setError(errText(e))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  const confirm = async () => {
    setError(null)
    setDeleting(true)
    try {
      const res = await mutation.mutateAsync({ itemIds: [itemId], dryRun: false })
      if (res.deleted > 0) onDeleted()
      else setRow(res.rows[0] ?? null)
    } catch (e) {
      setError(errText(e))
    } finally {
      setDeleting(false)
    }
  }

  const blocked = row?.status === 'BLOCKED'
  const loading = !row && !error

  const extras: string[] = []
  if (row?.ownRecipe) extras.push(t('itemCreate.alsoRecipe'))
  if (row && row.favorites > 0) extras.push(t('itemCreate.alsoFavorites', { count: row.favorites }))
  if (row && row.inventory > 0) extras.push(t('itemCreate.alsoInventory', { count: row.inventory }))
  if (row && row.craftLogs > 0) extras.push(t('itemCreate.alsoCraftLogs', { count: row.craftLogs }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-dark-card border border-red-500/30 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-dark-border">
          <h2 className="text-base font-semibold text-skin-base flex items-center gap-2">
            <Trash2 size={16} className="text-red-400" />
            {t('itemCreate.deleteOneTitle', { name: itemName })}
          </h2>
          <button
            onClick={onClose}
            className="text-skin-muted hover:text-skin-base transition-colors shrink-0"
            title={t('edit.cancel')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-skin-muted py-2">
              <Loader2 size={14} className="animate-spin" />
              {t('itemCreate.deleteChecking')}
            </div>
          )}

          {blocked && (
            <div className="flex items-start gap-2 p-3 rounded bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200">
              <ShieldAlert size={14} className="mt-0.5 shrink-0" />
              <span>{t('itemCreate.blockedBy', { recipes: row!.usedIn.join(', ') })}</span>
            </div>
          )}

          {row && !blocked && (
            <>
              <div className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/30 text-sm text-red-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{t('itemCreate.deleteOneWarning')}</span>
              </div>
              {extras.length > 0 && (
                <p className="text-xs text-skin-muted">
                  {t('itemCreate.alsoRemoved')} {extras.join(' · ')}
                </p>
              )}
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/30 text-sm text-red-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-dark-border bg-dark-bg/40">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-3 py-2 rounded text-sm text-skin-muted hover:text-skin-base hover:bg-dark-hover transition-colors disabled:opacity-50"
          >
            {t('edit.cancel')}
          </button>
          <button
            onClick={confirm}
            disabled={!row || blocked || deleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {t('itemCreate.deleteOneConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

function errText(e: unknown): string {
  const err = e as { response?: { data?: { message?: string } }; message?: string }
  return err?.response?.data?.message ?? err?.message ?? String(e)
}
