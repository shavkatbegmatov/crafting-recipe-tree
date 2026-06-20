import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import {
  ArrowLeft, MessageCircle, Search, Trash2, MicOff, Megaphone, X,
  Users, Clock, BarChart3, Loader2, Send, ChevronLeft, ChevronRight, Crown, Shield,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGoBack } from '../hooks/useGoBack'
import { useContentWidth } from '../hooks/useContentWidth'
import {
  useAdminChatMessages, useChatStats, useDeleteChatMessage,
  useMuteUser, useUnmuteUser, useSetAnnouncement, useClearAnnouncement,
} from '../hooks/useChatAdmin'
import { useAnnouncement } from '../hooks/useAnnouncement'
import type { AdminChatMessage } from '../api/chatAdmin'
import { avatarColor, initials } from '../utils/avatarColor'
import Spinner from '../components/ui/Spinner'

const PAGE_SIZE = 30

function StatCard({ label, value, Icon, accent }: { label: string; value?: number; Icon: typeof Users; accent?: boolean }) {
  return (
    <div className={`bg-dark-card border rounded-lg p-3 ${accent ? 'border-dark-gold/30' : 'border-dark-border'}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-skin-muted mb-1">
        <Icon className={`w-3 h-3 ${accent ? 'text-dark-gold' : ''}`} />
        {label}
      </div>
      <div className={`text-xl font-semibold ${accent ? 'text-dark-gold' : 'text-skin-base'}`}>{value ?? '—'}</div>
    </div>
  )
}

type MuteTarget = { id: number; username: string }

export default function AdminChatPage() {
  const { t } = useTranslation()
  const { isSuperAdmin } = useAuth()
  const goBack = useGoBack('/')
  const contentWidth = useContentWidth('max-w-5xl')

  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState('')
  const [muteTarget, setMuteTarget] = useState<MuteTarget | null>(null)

  useEffect(() => {
    const tmr = setTimeout(() => { setApplied(search); setPage(0) }, 300)
    return () => clearTimeout(tmr)
  }, [search])

  const { data, isLoading, isFetching } = useAdminChatMessages({ search: applied, page, size: PAGE_SIZE })
  const { data: stats } = useChatStats()
  const { data: announcement } = useAnnouncement()
  const delMut = useDeleteChatMessage()
  const muteMut = useMuteUser()
  const unmuteMut = useUnmuteUser()
  const setAnn = useSetAnnouncement()
  const clearAnn = useClearAnnouncement()

  if (!isSuperAdmin) return <Navigate to="/" />

  const totalPages = data?.totalPages ?? 0
  const topSender = stats?.topSenders?.[0]

  const remove = async (m: AdminChatMessage) => {
    if (!confirm(t('chatAdmin.confirmDelete'))) return
    try { await delMut.mutateAsync(m.id) } catch { /* ignore */ }
  }
  const doMute = async (minutes?: number) => {
    if (!muteTarget) return
    try { await muteMut.mutateAsync({ id: muteTarget.id, durationMinutes: minutes }) } catch { /* ignore */ }
    setMuteTarget(null)
  }
  const publishAnnouncement = async () => {
    if (!draft.trim()) return
    try { await setAnn.mutateAsync(draft.trim()); setDraft('') } catch { /* ignore */ }
  }

  return (
    <div className={`space-y-5 ${contentWidth}`}>
      <button type="button" onClick={goBack} className="text-skin-muted hover:text-skin-base text-sm flex items-center gap-1 transition-colors">
        <ArrowLeft size={14} /> {t('common.back')}
      </button>

      <div>
        <h1 className="text-xl font-display tracking-wide text-skin-base flex items-center gap-2">
          <MessageCircle size={18} className="text-dark-gold" />
          {t('chatAdmin.title')}
        </h1>
        <p className="text-xs text-skin-muted mt-1">{t('chatAdmin.subtitle')}</p>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t('chatAdmin.stats.total')} value={stats?.totalMessages} Icon={BarChart3} />
        <StatCard label={t('chatAdmin.stats.today')} value={stats?.todayMessages} Icon={Clock} accent />
        <StatCard label={t('chatAdmin.stats.online')} value={stats?.onlineCount} Icon={Users} />
        <div className="panel p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-skin-muted mb-1">
            <Crown className="w-3 h-3" /> {t('chatAdmin.stats.topSender')}
          </div>
          <div className="text-sm font-semibold text-skin-base truncate">
            {topSender ? `${topSender.username} (${topSender.count})` : '—'}
          </div>
        </div>
      </div>

      {/* E'lon */}
      <div className="panel p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-skin-base">
          <Megaphone size={15} className="text-dark-gold" /> {t('chatAdmin.announcement.title')}
        </div>
        {announcement?.message && (
          <div className="flex items-start justify-between gap-2 rounded-lg bg-dark-gold/10 border border-dark-gold/25 px-3 py-2">
            <p className="text-xs text-skin-base flex-1">{announcement.message}</p>
            <button
              onClick={() => clearAnn.mutate()}
              className="text-[10px] text-red-400 hover:text-red-300 shrink-0 flex items-center gap-1"
            >
              <X size={12} /> {t('chatAdmin.announcement.clear')}
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            rows={1}
            placeholder={t('chatAdmin.announcement.placeholder')}
            className="flex-1 resize-none bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-skin-base
              placeholder:text-skin-muted/50 focus:outline-none focus:border-dark-gold/40"
          />
          <button
            onClick={publishAnnouncement}
            disabled={!draft.trim() || setAnn.isPending}
            className="p-2 rounded-lg bg-dark-gold/20 text-dark-gold hover:bg-dark-gold/30 transition-colors disabled:opacity-30"
          >
            {setAnn.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      {/* Qidiruv */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-skin-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('chatAdmin.search')}
          className="w-full bg-dark-bg border border-dark-border rounded pl-9 pr-3 py-2 text-sm text-skin-base
            placeholder:text-skin-muted/50 focus:outline-none focus:border-dark-gold/50"
        />
      </div>

      {/* Xabarlar */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : data && data.content.length === 0 ? (
        <div className="panel py-10 text-center text-sm text-skin-dark">
          {t('chatAdmin.empty')}
        </div>
      ) : (
        <div className={`space-y-1.5 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          {data?.content.map((m) => (
            <div key={m.id} className="flex items-start gap-2.5 panel px-3 py-2 group">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                style={{ backgroundColor: avatarColor(m.username) }}
              >
                {initials(m.username)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-skin-base">{m.username}</span>
                  {m.role === 'ADMIN' && <Shield className="w-2.5 h-2.5 text-dark-gold" />}
                  {m.role === 'SUPER_ADMIN' && <Crown className="w-2.5 h-2.5 text-dark-gold" />}
                  <span className="text-[10px] text-skin-muted/70">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-skin-base break-words whitespace-pre-wrap mt-0.5">{m.content}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setMuteTarget({ id: m.userId, username: m.username })}
                  title={t('chatAdmin.mute.action')}
                  className="p-1.5 rounded border border-dark-border text-skin-muted hover:text-amber-400 hover:border-amber-400/40 transition-colors"
                >
                  <MicOff size={13} />
                </button>
                <button
                  onClick={() => remove(m)}
                  title={t('chatAdmin.delete')}
                  className="p-1.5 rounded border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
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
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0}
              className="p-1.5 rounded border border-dark-border enabled:hover:text-dark-gold enabled:hover:border-dark-gold/40 transition-colors disabled:opacity-30">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded border border-dark-border enabled:hover:text-dark-gold enabled:hover:border-dark-gold/40 transition-colors disabled:opacity-30">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Mute modal */}
      {muteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setMuteTarget(null)}>
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-skin-base flex items-center gap-2">
                <MicOff size={15} className="text-amber-400" /> {t('chatAdmin.mute.title')}
              </h3>
              <button onClick={() => setMuteTarget(null)} className="text-skin-muted hover:text-skin-base"><X size={16} /></button>
            </div>
            <p className="text-xs text-skin-muted">{t('chatAdmin.mute.forUser', { name: muteTarget.username })}</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => doMute(60)} className="py-2 rounded-lg text-xs bg-dark-bg border border-dark-border text-skin-base hover:border-dark-gold/40 transition-colors">{t('chatAdmin.mute.hour')}</button>
              <button onClick={() => doMute(1440)} className="py-2 rounded-lg text-xs bg-dark-bg border border-dark-border text-skin-base hover:border-dark-gold/40 transition-colors">{t('chatAdmin.mute.day')}</button>
              <button onClick={() => doMute(undefined)} className="py-2 rounded-lg text-xs bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25 transition-colors">{t('chatAdmin.mute.permanent')}</button>
            </div>
            <button
              onClick={async () => { try { await unmuteMut.mutateAsync(muteTarget.id) } catch { /* ignore */ } setMuteTarget(null) }}
              className="w-full py-2 rounded-lg text-xs text-skin-muted border border-dark-border hover:text-skin-base transition-colors"
            >
              {t('chatAdmin.mute.unmute')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
