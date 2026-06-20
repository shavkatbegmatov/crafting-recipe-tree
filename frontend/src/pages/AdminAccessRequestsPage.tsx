import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import {
  ArrowLeft, ShieldQuestion, Clock, CheckCircle2, XCircle, MinusCircle,
  Check, X, Crown, Shield, User as UserIcon, ChevronLeft, ChevronRight,
  Loader2, MessageSquare,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGoBack } from '../hooks/useGoBack'
import { useContentWidth } from '../hooks/useContentWidth'
import {
  useAccessRequests, usePendingRequestsCount,
  useApproveAccessRequest, useRejectAccessRequest,
} from '../hooks/useAccessRequests'
import type { AccessRequest, AccessRequestStatus } from '../api/accessRequests'
import type { UserRole } from '../api/users'
import Spinner from '../components/ui/Spinner'

const STATUSES: AccessRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
const PAGE_SIZE = 20

/* ─── Avatar ─── */
function Avatar({ name, role }: { name: string; role: UserRole }) {
  const initials = name.split(/[\s_]+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  const gold = role === 'SUPER_ADMIN' || role === 'ADMIN'
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
        ${gold ? 'bg-dark-gold/25 text-dark-gold ring-1 ring-dark-gold/40'
               : 'bg-dark-hover text-skin-base ring-1 ring-dark-border'}`}
    >
      {initials}
    </div>
  )
}

/* ─── Rol nishoni (kichik) ─── */
function RoleChip({ role, label }: { role: UserRole; label: string }) {
  const cfg = {
    SUPER_ADMIN: { Icon: Crown, cls: 'text-dark-gold' },
    ADMIN: { Icon: Shield, cls: 'text-sky-300' },
    USER: { Icon: UserIcon, cls: 'text-skin-muted' },
  }[role]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] ${cfg.cls}`}>
      <cfg.Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  )
}

/* ─── Holat nishoni ─── */
function StatusBadge({ status, label }: { status: AccessRequestStatus; label: string }) {
  const cfg = {
    PENDING: { Icon: Clock, cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    APPROVED: { Icon: CheckCircle2, cls: 'bg-green-500/15 text-green-300 border-green-500/30' },
    REJECTED: { Icon: XCircle, cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
    CANCELLED: { Icon: MinusCircle, cls: 'bg-dark-hover text-skin-muted border-dark-border' },
  }[status]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${cfg.cls}`}>
      <cfg.Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  )
}

type ReviewAction = { request: AccessRequest; type: 'approve' | 'reject' }

export default function AdminAccessRequestsPage() {
  const { t } = useTranslation()
  const { isSuperAdmin } = useAuth()
  const goBack = useGoBack('/')
  const contentWidth = useContentWidth('max-w-5xl')

  const [statusFilter, setStatusFilter] = useState<AccessRequestStatus | ''>('PENDING')
  const [page, setPage] = useState(0)

  // Ko'rib chiqish modali
  const [review, setReview] = useState<ReviewAction | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading, isFetching } = useAccessRequests({
    status: statusFilter || undefined, page, size: PAGE_SIZE,
  })
  const { data: pendingCount } = usePendingRequestsCount(isSuperAdmin)

  const approveMut = useApproveAccessRequest()
  const rejectMut = useRejectAccessRequest()

  // Faqat super-admin — tasdiqlash = rol berish (oddiy admin uchun emas).
  if (!isSuperAdmin) return <Navigate to="/" />

  const errMessage = (e: unknown): string => {
    const err = e as { response?: { data?: { message?: string; error?: string } } }
    const code = err?.response?.data?.message || err?.response?.data?.error || 'UNKNOWN_ERROR'
    return t(`accessRequest.errors.${code}`, { defaultValue: code })
  }

  const openReview = (request: AccessRequest, type: 'approve' | 'reject') => {
    setReview({ request, type }); setNote(''); setError(null)
  }
  const closeReview = () => { setReview(null); setNote(''); setError(null) }

  const submitReview = async () => {
    if (!review) return
    setError(null)
    const mut = review.type === 'approve' ? approveMut : rejectMut
    try {
      await mut.mutateAsync({ id: review.request.id, note: note || undefined })
      closeReview()
    } catch (e) {
      setError(errMessage(e))
    }
  }

  const filterBtn = (active: boolean) =>
    `text-xs px-2.5 py-1.5 rounded border transition-colors ${
      active ? 'bg-dark-gold/20 text-dark-gold border-dark-gold/40'
             : 'bg-dark-bg text-skin-muted border-dark-border hover:text-skin-base'
    }`

  const totalPages = data?.totalPages ?? 0
  const reviewing = approveMut.isPending || rejectMut.isPending

  return (
    <div className={`space-y-5 ${contentWidth}`}>
      <button
        type="button"
        onClick={goBack}
        className="text-skin-muted hover:text-skin-base text-sm flex items-center gap-1 transition-colors"
      >
        <ArrowLeft size={14} /> {t('common.back')}
      </button>

      <div>
        <h1 className="text-xl font-semibold text-skin-base flex items-center gap-2">
          <ShieldQuestion size={18} className="text-dark-gold" />
          {t('accessRequest.adminTitle')}
          {pendingCount != null && pendingCount > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {t('accessRequest.pendingBadge', { count: pendingCount })}
            </span>
          )}
        </h1>
        <p className="text-xs text-skin-muted mt-1">{t('accessRequest.adminSubtitle')}</p>
      </div>

      {/* Status filtri */}
      <div className="flex items-center gap-1 flex-wrap">
        <button className={filterBtn(statusFilter === '')} onClick={() => { setStatusFilter(''); setPage(0) }}>
          {t('accessRequest.filter.all')}
        </button>
        {STATUSES.map((s) => (
          <button key={s} className={filterBtn(statusFilter === s)} onClick={() => { setStatusFilter(s); setPage(0) }}>
            {t(`accessRequest.statusLabel.${s}`)}
          </button>
        ))}
      </div>

      {/* Ro'yxat */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : data && data.content.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-lg py-12 text-center text-sm text-skin-dark">
          {t('accessRequest.empty')}
        </div>
      ) : (
        <div className={`space-y-2.5 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          {data?.content.map((r) => (
            <div key={r.id} className="bg-dark-card border border-dark-border rounded-lg p-3.5">
              <div className="flex items-start gap-3">
                <Avatar name={r.displayName || r.username} role={r.currentRole} />

                <div className="flex-1 min-w-0">
                  {/* Sarlavha qatori */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-skin-base truncate">{r.displayName || r.username}</span>
                    <span className="text-[11px] text-skin-muted">@{r.username}</span>
                    <RoleChip role={r.currentRole} label={t(`adminUsers.role.${r.currentRole}`)} />
                    <span className="text-skin-dark text-[10px]">→</span>
                    <RoleChip role={r.requestedRole} label={t(`adminUsers.role.${r.requestedRole}`)} />
                    <StatusBadge status={r.status} label={t(`accessRequest.statusLabel.${r.status}`)} />
                  </div>

                  {/* Foydalanuvchi izohi */}
                  <div className="flex items-start gap-1.5 mt-1.5">
                    <MessageSquare className="w-3 h-3 text-skin-muted shrink-0 mt-0.5" />
                    <p className="text-xs text-skin-muted italic">
                      {r.message || t('accessRequest.noMessage')}
                    </p>
                  </div>

                  {/* Sana + ko'rib chiqilgan ma'lumot */}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-skin-muted/70">
                    <span>{new Date(r.createdAt).toLocaleString()}</span>
                    {r.status !== 'PENDING' && r.reviewedByUsername && (
                      <span>{t('accessRequest.reviewedBy', { name: r.reviewedByUsername })}</span>
                    )}
                  </div>

                  {/* Super-admin javob izohi */}
                  {r.reviewNote && (
                    <p className="text-[10px] text-skin-muted mt-1 pl-1 border-l-2 border-dark-border">
                      {t('accessRequest.reviewNoteLabel')} {r.reviewNote}
                    </p>
                  )}
                </div>

                {/* Amallar — faqat PENDING uchun */}
                {r.status === 'PENDING' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openReview(r, 'approve')}
                      title={t('accessRequest.action.approve')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                        bg-green-500/15 text-green-300 border border-green-500/30 hover:bg-green-500/25 transition-colors"
                    >
                      <Check size={13} /> {t('accessRequest.action.approve')}
                    </button>
                    <button
                      onClick={() => openReview(r, 'reject')}
                      title={t('accessRequest.action.reject')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                        bg-red-500/10 text-red-400 border border-red-400/30 hover:bg-red-500/20 transition-colors"
                    >
                      <X size={13} /> {t('accessRequest.action.reject')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sahifalash */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-skin-muted">
          <span>{t('adminUsers.pageInfo', { current: page + 1, total: totalPages })}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0}
              className="p-1.5 rounded border border-dark-border enabled:hover:text-dark-gold enabled:hover:border-dark-gold/40 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded border border-dark-border enabled:hover:text-dark-gold enabled:hover:border-dark-gold/40 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Ko'rib chiqish modali */}
      {review && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeReview}>
          <div
            className="bg-dark-card border border-dark-border rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-skin-base flex items-center gap-2">
                {review.type === 'approve' ? (
                  <><CheckCircle2 size={15} className="text-green-400" /> {t('accessRequest.approve.title')}</>
                ) : (
                  <><XCircle size={15} className="text-red-400" /> {t('accessRequest.reject.title')}</>
                )}
              </h3>
              <button onClick={closeReview} className="text-skin-muted hover:text-skin-base transition-colors">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-skin-muted">
              {review.type === 'approve'
                ? t('accessRequest.approve.confirm', { name: review.request.displayName || review.request.username })
                : t('accessRequest.reject.confirm', { name: review.request.displayName || review.request.username })}
            </p>

            <div>
              <label className="block text-xs text-skin-muted mb-1">{t('accessRequest.modal.noteLabel')}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder={t('accessRequest.modal.notePlaceholder')}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 resize-none text-sm text-skin-base
                  placeholder:text-skin-muted/40 focus:outline-none focus:border-dark-gold/50"
              />
            </div>

            {error && <p className="text-[11px] text-red-400">{error}</p>}

            <div className="flex items-center gap-2">
              <button
                onClick={submitReview}
                disabled={reviewing}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                  review.type === 'approve'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-400/40 hover:bg-red-500/25'
                }`}
              >
                {reviewing ? <Loader2 size={14} className="animate-spin" />
                  : review.type === 'approve' ? <Check size={14} /> : <X size={14} />}
                {review.type === 'approve' ? t('accessRequest.modal.approveBtn') : t('accessRequest.modal.rejectBtn')}
              </button>
              <button
                onClick={closeReview}
                className="px-4 py-2 rounded text-sm text-skin-muted border border-dark-border hover:text-skin-base transition-colors"
              >
                {t('accessRequest.modal.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
