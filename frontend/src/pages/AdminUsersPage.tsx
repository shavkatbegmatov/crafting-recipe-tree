import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import {
  ArrowLeft, Search, Users, Shield, Crown, User as UserIcon,
  Ban, CheckCircle2, Trash2, KeyRound, ChevronLeft, ChevronRight,
  Loader2, X, Copy, Check,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGoBack } from '../hooks/useGoBack'
import {
  useAdminUsers, useUserStats, useUpdateUserRole,
  useUpdateUserStatus, useResetUserPassword, useDeleteUser,
} from '../hooks/useAdminUsers'
import type { AdminUser, UserRole } from '../api/users'
import Spinner from '../components/ui/Spinner'
import { useContentWidth } from '../hooks/useContentWidth'

const ROLES: UserRole[] = ['USER', 'ADMIN', 'SUPER_ADMIN']
const PAGE_SIZE = 20

/* ─── Avatar ─── */
function Avatar({ name, role }: { name: string; role: UserRole }) {
  const initials = name.split(/[\s_]+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  const gold = role === 'SUPER_ADMIN'
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

/* ─── Rol nishoni ─── */
function RoleBadge({ role, label }: { role: UserRole; label: string }) {
  const cfg = {
    SUPER_ADMIN: { Icon: Crown, cls: 'bg-dark-gold/20 text-dark-gold border-dark-gold/40' },
    ADMIN: { Icon: Shield, cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    USER: { Icon: UserIcon, cls: 'bg-dark-hover text-skin-muted border-dark-border' },
  }[role]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${cfg.cls}`}>
      <cfg.Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  )
}

/* ─── Statistika kartasi ─── */
function StatCard({ label, value, Icon, accent }: { label: string; value?: number; Icon: typeof Users; accent?: boolean }) {
  return (
    <div className={`bg-dark-card border rounded-lg p-3 ${accent ? 'border-dark-gold/30' : 'border-dark-border'}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-skin-muted mb-1">
        <Icon className={`w-3 h-3 ${accent ? 'text-dark-gold' : ''}`} />
        {label}
      </div>
      <div className={`text-xl font-semibold ${accent ? 'text-dark-gold' : 'text-skin-base'}`}>
        {value ?? '—'}
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const { isAdmin, isSuperAdmin, user } = useAuth()
  const goBack = useGoBack('/')
  const contentWidth = useContentWidth('max-w-6xl')

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [page, setPage] = useState(0)

  // Parol reset modali
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [resetPwInput, setResetPwInput] = useState('')
  const [resultPw, setResultPw] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Qidiruvni debounce qilamiz (300ms)
  useEffect(() => {
    const timer = setTimeout(() => { setAppliedSearch(search); setPage(0) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const enabled = statusFilter === 'all' ? undefined : statusFilter === 'active'
  const { data, isLoading, isFetching } = useAdminUsers({
    search: appliedSearch, role: roleFilter || undefined, enabled, page, size: PAGE_SIZE,
  })
  const { data: stats } = useUserStats()

  const roleMut = useUpdateUserRole()
  const statusMut = useUpdateUserStatus()
  const resetMut = useResetUserPassword()
  const deleteMut = useDeleteUser()

  if (!isAdmin) return <Navigate to="/" />

  const errMessage = (e: unknown): string => {
    const err = e as { response?: { data?: { message?: string; error?: string } } }
    const code = err?.response?.data?.message || err?.response?.data?.error || 'UNKNOWN_ERROR'
    return t(`adminUsers.errors.${code}`, { defaultValue: code })
  }

  const isSelf = (u: AdminUser) => u.username === user?.username
  // ADMIN faqat oddiy USER ustidan amal qiladi; SUPER_ADMIN hamma ustidan (o'zidan tashqari)
  const canManage = (u: AdminUser) => !isSelf(u) && (isSuperAdmin || u.role === 'USER')
  const canChangeRole = (u: AdminUser) => isSuperAdmin && !isSelf(u)

  const changeRole = async (u: AdminUser, role: UserRole) => {
    if (role === u.role) return
    try {
      await roleMut.mutateAsync({ id: u.id, role })
    } catch (e) { alert(errMessage(e)) }
  }

  const toggleStatus = async (u: AdminUser) => {
    try {
      await statusMut.mutateAsync({ id: u.id, enabled: !u.enabled })
    } catch (e) { alert(errMessage(e)) }
  }

  const removeUser = async (u: AdminUser) => {
    if (!confirm(t('adminUsers.confirmDelete', { name: u.displayName || u.username }))) return
    try {
      await deleteMut.mutateAsync(u.id)
    } catch (e) { alert(errMessage(e)) }
  }

  const openReset = (u: AdminUser) => {
    setResetTarget(u); setResetPwInput(''); setResultPw(null); setCopied(false)
  }
  const closeReset = () => {
    setResetTarget(null); setResetPwInput(''); setResultPw(null); setCopied(false)
  }
  const submitReset = async () => {
    if (!resetTarget) return
    try {
      const pw = await resetMut.mutateAsync({ id: resetTarget.id, newPassword: resetPwInput || undefined })
      setResultPw(pw)
    } catch (e) { alert(errMessage(e)) }
  }
  const copyResult = async () => {
    if (!resultPw) return
    try {
      await navigator.clipboard.writeText(resultPw)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const filterBtn = (active: boolean) =>
    `text-xs px-2.5 py-1.5 rounded border transition-colors ${
      active ? 'bg-dark-gold/20 text-dark-gold border-dark-gold/40'
             : 'bg-dark-bg text-skin-muted border-dark-border hover:text-skin-base'
    }`

  const totalPages = data?.totalPages ?? 0

  return (
    <div className={`space-y-5 ${contentWidth}`}>
      {/* Sarlavha */}
      <button
        type="button"
        onClick={goBack}
        className="text-skin-muted hover:text-skin-base text-sm flex items-center gap-1 transition-colors"
      >
        <ArrowLeft size={14} /> {t('common.back')}
      </button>

      <div>
        <h1 className="text-xl font-semibold text-skin-base flex items-center gap-2">
          <Users size={18} className="text-dark-gold" />
          {t('adminUsers.title')}
        </h1>
        <p className="text-xs text-skin-muted mt-1">{t('adminUsers.subtitle')}</p>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label={t('adminUsers.stats.total')} value={stats?.total} Icon={Users} />
        <StatCard label={t('adminUsers.stats.superAdmins')} value={stats?.superAdmins} Icon={Crown} accent />
        <StatCard label={t('adminUsers.stats.admins')} value={stats?.admins} Icon={Shield} />
        <StatCard label={t('adminUsers.stats.users')} value={stats?.users} Icon={UserIcon} />
        <StatCard label={t('adminUsers.stats.blocked')} value={stats?.blocked} Icon={Ban} />
      </div>

      {/* Filtrlar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-skin-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('adminUsers.search')}
            className="w-full bg-dark-bg border border-dark-border rounded pl-9 pr-3 py-2 text-sm text-skin-base
              placeholder:text-skin-muted/50 focus:outline-none focus:border-dark-gold/50"
          />
        </div>

        {/* Rol filtri */}
        <div className="flex items-center gap-1">
          <button className={filterBtn(roleFilter === '')} onClick={() => { setRoleFilter(''); setPage(0) }}>
            {t('adminUsers.filter.allRoles')}
          </button>
          {ROLES.map((r) => (
            <button key={r} className={filterBtn(roleFilter === r)} onClick={() => { setRoleFilter(r); setPage(0) }}>
              {t(`adminUsers.role.${r}`)}
            </button>
          ))}
        </div>

        {/* Status filtri */}
        <div className="flex items-center gap-1">
          {(['all', 'active', 'blocked'] as const).map((s) => (
            <button key={s} className={filterBtn(statusFilter === s)} onClick={() => { setStatusFilter(s); setPage(0) }}>
              {t(`adminUsers.filter.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Jadval */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className={`bg-dark-card border border-dark-border rounded-lg overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-dark-border bg-dark-bg/30 text-skin-muted">
                <th className="text-left py-2.5 px-3 font-medium">{t('adminUsers.col.user')}</th>
                <th className="text-left py-2.5 px-3 font-medium">{t('adminUsers.col.role')}</th>
                <th className="text-left py-2.5 px-3 font-medium">{t('adminUsers.col.status')}</th>
                <th className="text-left py-2.5 px-3 font-medium">{t('adminUsers.col.referral')}</th>
                <th className="text-left py-2.5 px-3 font-medium">{t('adminUsers.col.joined')}</th>
                <th className="text-right py-2.5 px-3 font-medium">{t('adminUsers.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.content.map((u) => (
                <tr key={u.id} className="border-b border-dark-border/50 hover:bg-dark-hover/40 transition-colors">
                  {/* Foydalanuvchi */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.displayName || u.username} role={u.role} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-skin-base truncate">{u.displayName || u.username}</span>
                          {isSelf(u) && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-dark-gold/15 text-dark-gold border border-dark-gold/25">
                              {t('adminUsers.self')}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-skin-muted">@{u.username}</div>
                      </div>
                    </div>
                  </td>

                  {/* Rol */}
                  <td className="py-2.5 px-3">
                    {canChangeRole(u) ? (
                      <select
                        value={u.role}
                        disabled={roleMut.isPending}
                        onChange={(e) => changeRole(u, e.target.value as UserRole)}
                        className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-skin-base
                          focus:outline-none focus:border-dark-gold/50 cursor-pointer"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{t(`adminUsers.role.${r}`)}</option>
                        ))}
                      </select>
                    ) : (
                      <RoleBadge role={u.role} label={t(`adminUsers.role.${u.role}`)} />
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3">
                    {u.enabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-green-400">
                        <CheckCircle2 className="w-3 h-3" /> {t('adminUsers.status.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
                        <Ban className="w-3 h-3" /> {t('adminUsers.status.blocked')}
                      </span>
                    )}
                  </td>

                  {/* Referral */}
                  <td className="py-2.5 px-3 text-xs text-skin-muted">
                    <div className="font-mono text-skin-base">{u.referralCode}</div>
                    {u.referralCount > 0 && <div>{t('adminUsers.referralsCount', { count: u.referralCount })}</div>}
                    {u.referredByUsername && <div className="text-[10px]">{t('adminUsers.invitedBy', { name: u.referredByUsername })}</div>}
                  </td>

                  {/* Sana */}
                  <td className="py-2.5 px-3 text-xs text-skin-muted font-mono whitespace-nowrap">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>

                  {/* Amallar */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={!canManage(u) || statusMut.isPending}
                        title={u.enabled ? t('adminUsers.action.block') : t('adminUsers.action.unblock')}
                        className="p-1.5 rounded border border-dark-border text-skin-muted enabled:hover:text-dark-gold
                          enabled:hover:border-dark-gold/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {u.enabled ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                      </button>
                      <button
                        onClick={() => openReset(u)}
                        disabled={!canManage(u)}
                        title={t('adminUsers.action.resetPassword')}
                        className="p-1.5 rounded border border-dark-border text-skin-muted enabled:hover:text-dark-gold
                          enabled:hover:border-dark-gold/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <KeyRound size={13} />
                      </button>
                      <button
                        onClick={() => removeUser(u)}
                        disabled={!canManage(u) || deleteMut.isPending}
                        title={t('adminUsers.action.delete')}
                        className="p-1.5 rounded border border-red-400/30 text-red-400 enabled:hover:bg-red-400/10
                          transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && data.content.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-skin-dark">
                    {t('adminUsers.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

      {/* Parol reset modali */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeReset}>
          <div
            className="bg-dark-card border border-dark-border rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-skin-base flex items-center gap-2">
                <KeyRound size={15} className="text-dark-gold" />
                {t('adminUsers.reset.title')}
              </h3>
              <button onClick={closeReset} className="text-skin-muted hover:text-skin-base transition-colors">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-skin-muted">
              {t('adminUsers.reset.forUser', { name: resetTarget.displayName || resetTarget.username })}
            </p>

            {!resultPw ? (
              <>
                <div>
                  <label className="block text-xs text-skin-muted mb-1">{t('adminUsers.reset.passwordLabel')}</label>
                  <input
                    type="text"
                    value={resetPwInput}
                    onChange={(e) => setResetPwInput(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-skin-base
                      focus:outline-none focus:border-dark-gold/50 font-mono"
                  />
                  <p className="text-[10px] text-skin-muted/70 mt-1">{t('adminUsers.reset.passwordHint')}</p>
                </div>
                <button
                  onClick={submitReset}
                  disabled={resetMut.isPending}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-sm font-medium
                    bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors disabled:opacity-50"
                >
                  {resetMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  {t('adminUsers.reset.generate')}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-skin-muted mb-1">{t('adminUsers.reset.resultLabel')}</label>
                  <button
                    onClick={copyResult}
                    className="w-full flex items-center gap-2 bg-dark-bg border border-dark-border rounded px-3 py-2
                      hover:border-dark-gold/30 transition-colors group"
                  >
                    <code className="flex-1 text-sm text-dark-gold font-mono text-left">{resultPw}</code>
                    {copied ? (
                      <span className="flex items-center gap-1 text-[10px] text-green-400"><Check className="w-3 h-3" />{t('adminUsers.reset.copied')}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-skin-muted group-hover:text-dark-gold"><Copy className="w-3 h-3" />{t('adminUsers.reset.copy')}</span>
                    )}
                  </button>
                  <p className="text-[10px] text-amber-400/80 mt-1.5">{t('adminUsers.reset.resultHint')}</p>
                </div>
                <button
                  onClick={closeReset}
                  className="w-full py-2 rounded text-sm text-skin-muted border border-dark-border hover:text-skin-base transition-colors"
                >
                  {t('adminUsers.reset.close')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
