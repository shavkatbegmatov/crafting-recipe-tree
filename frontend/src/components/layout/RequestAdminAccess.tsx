import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Shield, ShieldCheck, Clock, X, Check, Loader2, Send, AlertCircle, Sparkles,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  useMyAccessRequest,
  useCreateAccessRequest,
  useCancelAccessRequest,
} from '../../hooks/useAccessRequests'

/**
 * UserDropdown ichidagi "Admin huquqi" bo'limi. Faqat oddiy USER uchun ko'rinadi va
 * arizaning joriy holatiga qarab tegishli ko'rinishni beradi:
 *  - ariza yo'q / bekor / rad etilgan → so'rash formasi (rad etilgan bo'lsa sabab bilan)
 *  - PENDING → kutilmoqda + bekor qilish
 *  - APPROVED → tabrik + rolni qo'llash (profilni yangilash)
 */
export default function RequestAdminAccess() {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()

  const isUser = user?.role === 'USER'
  const { data: request, isLoading } = useMyAccessRequest(isUser)
  const createMut = useCreateAccessRequest()
  const cancelMut = useCancelAccessRequest()

  const [formOpen, setFormOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  // Imtiyozli foydalanuvchilarga (admin/super-admin) bu bo'lim umuman kerak emas.
  if (!isUser) return null
  // Birinchi yuklanishda joy egallamaymiz — ariza holati kelgach ko'rsatamiz.
  if (isLoading && !request) return null

  const errMessage = (e: unknown): string => {
    const err = e as { response?: { data?: { message?: string; error?: string } } }
    const code = err?.response?.data?.message || err?.response?.data?.error || 'UNKNOWN_ERROR'
    return t(`accessRequest.errors.${code}`, { defaultValue: code })
  }

  async function submit() {
    setError(null)
    try {
      await createMut.mutateAsync(message)
      setFormOpen(false)
      setMessage('')
    } catch (e) {
      setError(errMessage(e))
    }
  }

  async function cancel() {
    if (!request) return
    setError(null)
    try {
      await cancelMut.mutateAsync(request.id)
    } catch (e) {
      setError(errMessage(e))
    }
  }

  async function apply() {
    setApplying(true)
    await refreshUser() // rol yangilanadi → bu komponent (USER emas) tabiiy yo'qoladi
    setApplying(false)
  }

  const sectionTitle = (
    <span className="flex items-center gap-1 text-[10px] font-medium text-[#8a7a60] uppercase tracking-wider mb-2">
      <Shield className="w-3 h-3" />
      {t('accessRequest.title')}
    </span>
  )

  const status = request?.status

  return (
    <>
      <div className="px-4 py-2.5">
        {sectionTitle}

        {/* ── PENDING: ko'rib chiqilmoqda ── */}
        {status === 'PENDING' && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] text-amber-300 font-medium">{t('accessRequest.pending')}</p>
                <p className="text-[10px] text-[#8a7a60] mt-0.5">{t('accessRequest.pendingHint')}</p>
              </div>
            </div>
            <button
              onClick={cancel}
              disabled={cancelMut.isPending}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px]
                text-[#8a7a60] border border-dark-border hover:text-[#d4c4a0] hover:border-[#4a4238]
                transition-colors disabled:opacity-50"
            >
              {cancelMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              {t('accessRequest.cancel')}
            </button>
          </div>
        )}

        {/* ── APPROVED: tabrik + qo'llash ── */}
        {status === 'APPROVED' && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-lg bg-green-500/10 border border-green-500/25 px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] text-green-300 font-medium">{t('accessRequest.approved')}</p>
                <p className="text-[10px] text-[#8a7a60] mt-0.5">{t('accessRequest.approvedHint')}</p>
              </div>
            </div>
            <button
              onClick={apply}
              disabled={applying}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
                bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30
                transition-colors disabled:opacity-50"
            >
              {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
              {t('accessRequest.apply')}
            </button>
          </div>
        )}

        {/* ── Ariza yo'q / REJECTED / CANCELLED: so'rash ── */}
        {status !== 'PENDING' && status !== 'APPROVED' && (
          <div className="space-y-2">
            {status === 'REJECTED' && (
              <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/25 px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-red-300 font-medium">{t('accessRequest.rejected')}</p>
                  {request?.reviewNote && (
                    <p className="text-[10px] text-[#8a7a60] mt-0.5">
                      {t('accessRequest.reason')} {request.reviewNote}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!formOpen ? (
              <button
                onClick={() => { setFormOpen(true); setError(null) }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
                  bg-dark-gold/15 text-dark-gold border border-dark-gold/30 hover:bg-dark-gold/25
                  transition-colors"
              >
                <Shield className="w-3 h-3" />
                {status === 'REJECTED' ? t('accessRequest.requestAgain') : t('accessRequest.request')}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-[#8a7a60]">{t('accessRequest.formTitle')}</p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder={t('accessRequest.messagePlaceholder')}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-2.5 py-1.5 resize-none
                    text-xs text-[#d4c4a0] placeholder:text-[#8a7a60]/40
                    focus:outline-none focus:border-dark-gold/40 transition-colors"
                  autoFocus
                />
                {error && <p className="text-[10px] text-red-400">{error}</p>}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={submit}
                    disabled={createMut.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
                      bg-dark-gold/20 text-dark-gold border border-dark-gold/30 hover:bg-dark-gold/30
                      transition-colors disabled:opacity-50"
                  >
                    {createMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    {t('accessRequest.send')}
                  </button>
                  <button
                    onClick={() => { setFormOpen(false); setMessage(''); setError(null) }}
                    className="px-3 py-1.5 rounded-lg text-[11px] text-[#8a7a60] border border-dark-border
                      hover:text-[#d4c4a0] transition-colors"
                  >
                    {t('accessRequest.close')}
                  </button>
                </div>
              </div>
            )}

            {/* forma yopiq holatda yuzaga kelgan xato (masalan, allaqachon pending) */}
            {!formOpen && error && <p className="text-[10px] text-red-400">{error}</p>}
          </div>
        )}
      </div>

      <div className="h-px bg-dark-border mx-3 my-1.5" />
    </>
  )
}
