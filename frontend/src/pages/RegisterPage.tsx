import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useGoBack } from '../hooks/useGoBack'
import { lookupReferrer } from '../api/auth'
import {
  Boxes,
  UserPlus,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Users,
  ArrowLeft,
} from 'lucide-react'
import AmbientBackdrop from '../components/layout/AmbientBackdrop'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const goBack = useGoBack('/')
  const [searchParams] = useSearchParams()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [referrerName, setReferrerName] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Detect ?ref=CODE from URL
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setReferralCode(ref.toUpperCase())
    }
  }, [searchParams])

  // Lookup referrer name when code changes
  useEffect(() => {
    if (referralCode.length >= 8) {
      lookupReferrer(referralCode).then(setReferrerName)
    } else {
      setReferrerName(null)
    }
  }, [referralCode])

  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const passwordTooShort = password.length > 0 && password.length < 6
  const usernameTooShort = username.length > 0 && username.length < 3
  const usernameInvalid = username.length > 0 && !/^[a-zA-Z0-9_]+$/.test(username)

  const canSubmit =
    username.length >= 3 &&
    !usernameInvalid &&
    password.length >= 6 &&
    password === confirmPassword &&
    !loading

  const resolveError = (code: string): string => {
    switch (code) {
      case 'USERNAME_TAKEN':
        return t('register.usernameTaken')
      case 'INVALID_REFERRAL_CODE':
        return t('register.invalidReferral')
      default:
        return code
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError(null)
    try {
      await register({
        username: username.trim(),
        password,
        displayName: displayName.trim() || undefined,
        referralCode: referralCode.trim() || undefined,
      })
      setSuccess(true)
      setTimeout(() => navigate('/'), 1200)
    } catch (err: any) {
      setError(resolveError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070509] flex items-center justify-center p-4">
      <AmbientBackdrop showRings={false} showCenterHalo={false} intensity="soft" />

      <button
        type="button"
        onClick={goBack}
        aria-label={t('common.back')}
        className="group absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-dark-border/70 bg-black/40 px-3.5 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a8916a] backdrop-blur-sm transition-all duration-200 hover:border-dark-gold/40 hover:bg-black/60 hover:text-[#f0dfb8] sm:left-6 sm:top-6"
      >
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        <span>{t('common.back')}</span>
      </button>

      <div className="relative z-10 bg-dark-card/90 border border-dark-border rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/50 backdrop-blur-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Boxes size={28} className="text-dark-gold" />
          <span className="font-semibold text-xl text-[#d4c4a0]">Craft Tree</span>
        </div>

        <h2 className="text-center text-sm text-[#8a7a60] mb-6">
          {t('register.title')}
        </h2>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center gap-3 py-8 animate-in">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-sm text-[#d4c4a0]">{t('register.success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Referral banner */}
            {referrerName && (
              <div className="flex items-center gap-2 bg-dark-gold/10 border border-dark-gold/20 rounded-xl px-4 py-2.5">
                <Users className="w-4 h-4 text-dark-gold shrink-0" />
                <span className="text-xs text-dark-gold">
                  {t('register.referredBy', { name: referrerName })}
                </span>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs text-[#8a7a60] mb-1.5 font-medium">
                {t('register.username')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={30}
                className={`w-full bg-dark-bg border rounded-xl px-3 py-2.5 text-sm text-[#d4c4a0]
                  focus:outline-none transition-colors
                  ${usernameTooShort || usernameInvalid
                    ? 'border-red-400/50 focus:border-red-400'
                    : 'border-dark-border focus:border-dark-gold/50'
                  }`}
                placeholder="player_one"
                autoFocus
                required
              />
              {usernameTooShort && (
                <p className="text-[11px] text-red-400/80 mt-1">{t('register.usernameTooShort')}</p>
              )}
              {usernameInvalid && (
                <p className="text-[11px] text-red-400/80 mt-1">{t('register.usernameInvalid')}</p>
              )}
            </div>

            {/* Display name (optional) */}
            <div>
              <label className="block text-xs text-[#8a7a60] mb-1.5 font-medium">
                {t('register.displayName')}
                <span className="ml-1 text-[#8a7a60]/50 font-normal">{t('register.optional')}</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm
                  text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50 transition-colors"
                placeholder={t('register.displayNamePlaceholder')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-[#8a7a60] mb-1.5 font-medium">
                {t('register.password')} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={100}
                  className={`w-full bg-dark-bg border rounded-xl px-3 py-2.5 pr-10 text-sm text-[#d4c4a0]
                    focus:outline-none transition-colors
                    ${passwordTooShort
                      ? 'border-red-400/50 focus:border-red-400'
                      : 'border-dark-border focus:border-dark-gold/50'
                    }`}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a7a60] hover:text-[#d4c4a0] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordTooShort && (
                <p className="text-[11px] text-red-400/80 mt-1">{t('register.passwordTooShort')}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs text-[#8a7a60] mb-1.5 font-medium">
                {t('register.confirmPassword')} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  maxLength={100}
                  className={`w-full bg-dark-bg border rounded-xl px-3 py-2.5 text-sm text-[#d4c4a0]
                    focus:outline-none transition-colors
                    ${confirmPassword && !passwordsMatch
                      ? 'border-red-400/50 focus:border-red-400'
                      : 'border-dark-border focus:border-dark-gold/50'
                    }`}
                  required
                />
                {passwordsMatch && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                )}
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-red-400/80 mt-1">{t('register.passwordMismatch')}</p>
              )}
            </div>

            {/* Referral Code */}
            <div>
              <label className="block text-xs text-[#8a7a60] mb-1.5 font-medium">
                {t('register.referralCode')}
                <span className="ml-1 text-[#8a7a60]/50 font-normal">{t('register.optional')}</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                maxLength={12}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm
                  text-[#d4c4a0] tracking-wider font-mono uppercase
                  focus:outline-none focus:border-dark-gold/50 transition-colors"
                placeholder="ABCD1234"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2.5 rounded-xl text-sm font-medium
                bg-dark-gold/20 text-dark-gold border border-dark-gold/40
                hover:bg-dark-gold/30 hover:border-dark-gold/60 transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              {t('register.submit')}
            </button>

            {/* Link to login */}
            <div className="text-center pt-1">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-[#8a7a60] hover:text-dark-gold transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                {t('register.hasAccount')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
