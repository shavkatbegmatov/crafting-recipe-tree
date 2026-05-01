import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  Copy,
  Check,
  LogOut,
  Shield,
  Users,
  Pencil,
  X,
  Save,
  Lock,
  Calendar,
  Link2,
  User,
  Settings,
  Loader2,
  Package,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

/* ─── Avatar ─── */

function UserAvatar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const initials = name
    .split(/[\s_]+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
        ${isAdmin ? 'bg-dark-gold/25 text-dark-gold ring-1 ring-dark-gold/40' : 'bg-dark-hover text-[#d4c4a0] ring-1 ring-dark-border'}`}
    >
      {initials}
    </div>
  )
}

/* ─── Section divider ─── */

function Divider() {
  return <div className="h-px bg-dark-border mx-3 my-1.5" />
}

/* ─── Main component ─── */

export default function UserDropdown() {
  const { t } = useTranslation()
  const { user, isAdmin, logout, updateProfile } = useAuth()

  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        resetEdit()
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        resetEdit()
      }
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  if (!user) return null

  const displayName = user.displayName || user.username
  const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`

  function resetEdit() {
    setEditMode(false)
    setChangingPassword(false)
    setSaveError(null)
    setCurrentPassword('')
    setNewPassword('')
  }

  function startEdit() {
    setEditDisplayName(user?.displayName || '')
    setEditMode(true)
    setSaveError(null)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await updateProfile({
        displayName: editDisplayName,
        ...(changingPassword && newPassword
          ? { currentPassword, newPassword }
          : {}),
      })
      resetEdit()
    } catch (err: any) {
      const code = err?.response?.data?.error || err?.message || 'Error'
      setSaveError(
        code === 'WRONG_PASSWORD' ? t('profile.wrongPassword') : code
      )
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = referralLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => {
          setOpen(!open)
          if (open) resetEdit()
        }}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all
          ${open
            ? 'bg-dark-hover ring-1 ring-dark-border'
            : 'hover:bg-dark-hover/60'
          }`}
      >
        <UserAvatar name={displayName} isAdmin={isAdmin} />
        <span className="hidden sm:inline text-xs text-[#d4c4a0] max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-[#8a7a60] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-72 sm:w-80
              bg-dark-card border border-dark-border rounded-xl
              shadow-2xl shadow-black/50 z-50 overflow-hidden"
          >
            {/* ── Profile header ── */}
            <div className="px-4 pt-4 pb-3">
              {!editMode ? (
                <div className="flex items-start gap-3">
                  <UserAvatar name={displayName} isAdmin={isAdmin} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[#d4c4a0] truncate">
                        {displayName}
                      </span>
                      {isAdmin && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-dark-gold/15 text-dark-gold border border-dark-gold/25">
                          <Shield className="w-2.5 h-2.5" />
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8a7a60]">@{user.username}</p>
                    {memberSince && (
                      <p className="flex items-center gap-1 text-[10px] text-[#8a7a60]/70 mt-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {t('profile.memberSince', { date: memberSince })}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={startEdit}
                    className="p-1.5 rounded-lg text-[#8a7a60] hover:text-dark-gold hover:bg-dark-hover transition-colors"
                    title={t('profile.editProfile')}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* ── Edit mode ── */
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-dark-gold flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      {t('profile.editProfile')}
                    </span>
                    <button
                      onClick={resetEdit}
                      className="p-1 rounded text-[#8a7a60] hover:text-[#d4c4a0] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Display name */}
                  <div>
                    <label className="block text-[10px] text-[#8a7a60] mb-1">
                      {t('profile.displayName')}
                    </label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      maxLength={50}
                      placeholder={user.username}
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-2.5 py-1.5
                        text-xs text-[#d4c4a0] placeholder:text-[#8a7a60]/40
                        focus:outline-none focus:border-dark-gold/40 transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Password toggle */}
                  {!changingPassword ? (
                    <button
                      onClick={() => setChangingPassword(true)}
                      className="flex items-center gap-1 text-[10px] text-[#8a7a60] hover:text-dark-gold transition-colors"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      {t('profile.changePassword')}
                    </button>
                  ) : (
                    <div className="space-y-2 pt-0.5">
                      <div>
                        <label className="block text-[10px] text-[#8a7a60] mb-1">
                          {t('profile.currentPassword')}
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-2.5 py-1.5
                            text-xs text-[#d4c4a0]
                            focus:outline-none focus:border-dark-gold/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#8a7a60] mb-1">
                          {t('profile.newPassword')}
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-2.5 py-1.5
                            text-xs text-[#d4c4a0]
                            focus:outline-none focus:border-dark-gold/40 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {saveError && (
                    <p className="text-[10px] text-red-400">{saveError}</p>
                  )}

                  {/* Save */}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium
                      bg-dark-gold/20 text-dark-gold border border-dark-gold/30
                      hover:bg-dark-gold/30 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    {t('profile.save')}
                  </button>
                </div>
              )}
            </div>

            <Divider />

            {/* ── Referral section ── */}
            <div className="px-4 py-2.5">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1 text-[10px] font-medium text-[#8a7a60] uppercase tracking-wider">
                  <Link2 className="w-3 h-3" />
                  {t('profile.referral')}
                </span>
                {user.referralCount != null && user.referralCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-dark-gold">
                    <Users className="w-3 h-3" />
                    {user.referralCount}
                  </span>
                )}
              </div>

              {/* Referral link copy */}
              <button
                onClick={copyReferralLink}
                className="w-full flex items-center gap-2 bg-dark-bg border border-dark-border rounded-lg px-3 py-2
                  hover:border-dark-gold/30 transition-colors group"
              >
                <code className="flex-1 text-[11px] text-[#d4c4a0] font-mono truncate text-left">
                  {user.referralCode}
                </code>
                {copied ? (
                  <span className="flex items-center gap-1 text-[10px] text-green-400 shrink-0">
                    <Check className="w-3 h-3" />
                    {t('profile.copied')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-[#8a7a60] group-hover:text-dark-gold shrink-0 transition-colors">
                    <Copy className="w-3 h-3" />
                    {t('profile.copyLink')}
                  </span>
                )}
              </button>
            </div>

            <Divider />

            {/* ── Actions ── */}
            <div className="px-2 py-1.5">
              {isAdmin && (
                <>
                  <Link
                    to="/admin/categories"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#d4c4a0]
                      hover:bg-dark-hover transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-dark-gold" />
                    {t('admin.categories')}
                  </Link>
                  <Link
                    to="/admin/portage"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#d4c4a0]
                      hover:bg-dark-hover transition-colors"
                  >
                    <Package className="w-3.5 h-3.5 text-dark-gold" />
                    {t('admin.portage')}
                  </Link>
                </>
              )}

              <button
                onClick={() => {
                  setOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400/80
                  hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t('auth.logout')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
