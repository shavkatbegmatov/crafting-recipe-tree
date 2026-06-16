import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import {
  ArrowLeft, ScrollText, Search, ChevronLeft, ChevronRight, User as UserIcon, Cpu,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGoBack } from '../hooks/useGoBack'
import { useContentWidth } from '../hooks/useContentWidth'
import { useAuditLogs } from '../hooks/useAuditLogs'
import type { AuditAction, AuditTargetType } from '../api/audit'
import Spinner from '../components/ui/Spinner'

const ACTIONS: AuditAction[] = [
  'CREATE', 'UPDATE', 'DELETE', 'ROLE_CHANGE', 'STATUS_CHANGE', 'PASSWORD_RESET', 'APPROVE', 'REJECT', 'SET_CURRENT',
]
const TARGETS: AuditTargetType[] = ['USER', 'ACCESS_REQUEST', 'CATEGORY', 'ITEM', 'TAG', 'GAME_VERSION']
const PAGE_SIZE = 30

// Amal turini rang oilasiga bog'laydi (yashil=qo'shildi/tasdiq, qizil=o'chirildi/rad, ...).
function actionClasses(action: AuditAction): string {
  switch (action) {
    case 'CREATE':
    case 'APPROVE':
      return 'bg-green-500/15 text-green-300 border-green-500/30'
    case 'DELETE':
    case 'REJECT':
      return 'bg-red-500/15 text-red-300 border-red-500/30'
    case 'UPDATE':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    default:
      return 'bg-dark-gold/20 text-dark-gold border-dark-gold/40'
  }
}

export default function AdminAuditPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const goBack = useGoBack('/')
  const contentWidth = useContentWidth('max-w-6xl')

  const [actorInput, setActorInput] = useState('')
  const [actor, setActor] = useState('')
  const [action, setAction] = useState<AuditAction | ''>('')
  const [targetType, setTargetType] = useState<AuditTargetType | ''>('')
  const [page, setPage] = useState(0)

  // Actor qidiruvini debounce qilamiz (300ms)
  useEffect(() => {
    const timer = setTimeout(() => { setActor(actorInput); setPage(0) }, 300)
    return () => clearTimeout(timer)
  }, [actorInput])

  const { data, isLoading, isFetching } = useAuditLogs({
    actor: actor || undefined,
    action: action || undefined,
    targetType: targetType || undefined,
    page, size: PAGE_SIZE,
  })

  if (!isAdmin) return <Navigate to="/" />

  const totalPages = data?.totalPages ?? 0

  return (
    <div className={`space-y-5 ${contentWidth}`}>
      <button
        type="button"
        onClick={goBack}
        className="text-[#8a7a60] hover:text-[#d4c4a0] text-sm flex items-center gap-1 transition-colors"
      >
        <ArrowLeft size={14} /> {t('common.back')}
      </button>

      <div>
        <h1 className="text-xl font-semibold text-[#d4c4a0] flex items-center gap-2">
          <ScrollText size={18} className="text-dark-gold" />
          {t('audit.title')}
        </h1>
        <p className="text-xs text-[#8a7a60] mt-1">{t('audit.subtitle')}</p>
      </div>

      {/* Filtrlar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a60]" />
          <input
            value={actorInput}
            onChange={(e) => setActorInput(e.target.value)}
            placeholder={t('audit.actorSearch')}
            className="w-full bg-dark-bg border border-dark-border rounded pl-9 pr-3 py-2 text-sm text-[#d4c4a0]
              placeholder:text-[#8a7a60]/50 focus:outline-none focus:border-dark-gold/50"
          />
        </div>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value as AuditAction | ''); setPage(0) }}
          className="bg-dark-bg border border-dark-border rounded px-2.5 py-2 text-sm text-[#d4c4a0]
            focus:outline-none focus:border-dark-gold/50 cursor-pointer"
        >
          <option value="">{t('audit.allActions')}</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{t(`audit.action.${a}`)}</option>)}
        </select>
        <select
          value={targetType}
          onChange={(e) => { setTargetType(e.target.value as AuditTargetType | ''); setPage(0) }}
          className="bg-dark-bg border border-dark-border rounded px-2.5 py-2 text-sm text-[#d4c4a0]
            focus:outline-none focus:border-dark-gold/50 cursor-pointer"
        >
          <option value="">{t('audit.allTargets')}</option>
          {TARGETS.map((tt) => <option key={tt} value={tt}>{t(`audit.target.${tt}`)}</option>)}
        </select>
      </div>

      {/* Jadval */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className={`bg-dark-card border border-dark-border rounded-lg overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-dark-border bg-dark-bg/30 text-[#8a7a60]">
                <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">{t('audit.col.time')}</th>
                <th className="text-left py-2.5 px-3 font-medium">{t('audit.col.actor')}</th>
                <th className="text-left py-2.5 px-3 font-medium">{t('audit.col.action')}</th>
                <th className="text-left py-2.5 px-3 font-medium">{t('audit.col.target')}</th>
                <th className="text-left py-2.5 px-3 font-medium">{t('audit.col.summary')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.content.map((log) => (
                <tr key={log.id} className="border-b border-dark-border/50 hover:bg-dark-hover/40 transition-colors align-top">
                  <td className="py-2.5 px-3 text-xs text-[#8a7a60] font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    {log.actorUsername ? (
                      <span className="inline-flex items-center gap-1.5 text-[#d4c4a0]">
                        <UserIcon className="w-3 h-3 text-[#8a7a60]" /> {log.actorUsername}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[#8a7a60]">
                        <Cpu className="w-3 h-3" /> {t('audit.system')}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full border ${actionClasses(log.action)}`}>
                      {t(`audit.action.${log.action}`)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-[#8a7a60] whitespace-nowrap">
                    {t(`audit.target.${log.targetType}`)}
                    {log.targetId != null && <span className="text-[#5a4e3a]"> #{log.targetId}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-[#d4c4a0]">{log.summary || '—'}</td>
                </tr>
              ))}
              {data && data.content.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-[#5a4e3a]">{t('audit.empty')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sahifalash */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#8a7a60]">
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
    </div>
  )
}
