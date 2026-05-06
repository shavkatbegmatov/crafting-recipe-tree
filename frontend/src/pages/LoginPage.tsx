import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Eye,
  EyeOff,
  GitBranch,
  Layers3,
  Loader2,
  Lock,
  LogIn,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGoBack } from '../hooks/useGoBack'
import AmbientBackdrop from '../components/layout/AmbientBackdrop'

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.12 + index * 0.08,
      duration: 0.42,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

const shakeVariants = {
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.45 },
  },
}

const statusItems: Array<{ icon: LucideIcon; labelKey: string }> = [
  { icon: ShieldCheck, labelKey: 'login.statusSecure' },
  { icon: Sparkles, labelKey: 'login.statusLive' },
  { icon: Boxes, labelKey: 'login.statusCommand' },
]

const featureItems: Array<{
  icon: LucideIcon
  titleKey: string
  descriptionKey: string
}> = [
  {
    icon: GitBranch,
    titleKey: 'login.featureTreeTitle',
    descriptionKey: 'login.featureTreeDescription',
  },
  {
    icon: Layers3,
    titleKey: 'login.featureMaterialsTitle',
    descriptionKey: 'login.featureMaterialsDescription',
  },
  {
    icon: MessageSquare,
    titleKey: 'login.featureChatTitle',
    descriptionKey: 'login.featureChatDescription',
  },
]

const backgroundGrid = {
  backgroundImage: `
    linear-gradient(rgba(200,160,80,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(200,160,80,0.08) 1px, transparent 1px)
  `,
  backgroundSize: '72px 72px',
}

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const goBack = useGoBack('/')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const errorContent =
    error === 'INVALID_CREDENTIALS'
      ? {
          title: t('login.invalidCredentialsTitle'),
          description: t('login.invalidCredentialsDescription'),
          toneClass: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
          iconClass: 'text-amber-300',
        }
      : error
        ? {
            title: t('login.unavailableTitle'),
            description: t('login.unavailableDescription'),
            toneClass: 'border-red-500/20 bg-red-500/10 text-red-100',
            iconClass: 'text-red-300',
          }
        : null

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (!username.trim() || !password) return

      setLoading(true)
      setError(null)

      try {
        const result = await login(username.trim(), password)
        if (result.success) {
          navigate('/')
          return
        }
        setError(result.errorCode)
      } catch {
        setError('LOGIN_UNAVAILABLE')
      } finally {
        setLoading(false)
      }
    },
    [username, password, login, navigate],
  )

  const isSubmitDisabled = loading || !username.trim() || !password

  const getFieldShellClass = (fieldName: string) =>
    `relative flex items-center rounded-2xl border transition-all duration-200 ${
      focusedField === fieldName
        ? 'border-dark-gold/60 bg-dark-bg/85 shadow-[0_0_0_4px_rgba(200,160,80,0.08)]'
        : 'border-dark-border/80 bg-dark-bg/65 hover:border-[#514639]'
    }`

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070509]">
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

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-6 lg:grid-cols-[1.15fr_0.85fr] xl:gap-8">
          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="relative overflow-hidden rounded-[32px] border border-dark-border/70 bg-dark-card/70 shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-sm"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 18% 18%, rgba(200,160,80,0.18), transparent 28%), linear-gradient(145deg, rgba(26,22,16,0.92), rgba(12,10,8,0.96))',
              }}
            />
            <div className="absolute inset-0 opacity-[0.08]" style={backgroundGrid} />
            <div className="absolute -right-16 top-10 h-72 w-72 rounded-full border border-dark-gold/10" />
            <div className="absolute -right-10 top-16 h-60 w-60 rounded-full border border-dark-gold/10" />
            <div className="absolute bottom-0 left-0 h-40 w-full bg-[linear-gradient(180deg,transparent,rgba(13,11,8,0.42))]" />

            <div className="relative flex h-full flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
              <motion.div
                custom={0}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-dark-gold/25 bg-dark-gold/10 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
                    <Boxes className="text-dark-gold" size={28} />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-dark-gold/15 bg-dark-gold/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-dark-gold/90">
                      <Sparkles size={12} />
                      {t('login.eyebrow')}
                    </div>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#f0dfb8] sm:text-4xl">
                      {t('app.title')}
                    </h1>
                  </div>
                </div>

                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.34em] text-[#8a7a60]">
                    {t('app.subtitle')}
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#f3e0b5] sm:text-5xl">
                    {t('login.heroTitle')}
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-[#a9987a] sm:text-base">
                    {t('login.heroDescription')}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {statusItems.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <motion.div
                        key={item.labelKey}
                        custom={index + 1}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2 rounded-full border border-dark-border/80 bg-black/15 px-4 py-2 text-xs font-medium text-[#d7c6a3] backdrop-blur-sm"
                      >
                        <Icon size={14} className="text-dark-gold" />
                        <span>{t(item.labelKey)}</span>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>

              <div className="grid gap-4 sm:grid-cols-3">
                {featureItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.titleKey}
                      custom={index + 4}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="rounded-3xl border border-dark-border/75 bg-black/20 p-4 backdrop-blur-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-dark-gold/10 text-dark-gold">
                        <Icon size={18} />
                      </div>
                      <h3 className="mt-4 text-sm font-semibold text-[#f0dfb8]">
                        {t(item.titleKey)}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#8f7f66]">
                        {t(item.descriptionKey)}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="relative w-full max-w-[460px] justify-self-center lg:justify-self-end"
          >
            <div className="absolute -inset-2 rounded-[36px] bg-[radial-gradient(circle_at_top,rgba(200,160,80,0.16),transparent_55%)] blur-2xl" />

            <div className="relative overflow-hidden rounded-[28px] border border-dark-border/75 bg-dark-card/85 shadow-[0_24px_90px_rgba(0,0,0,0.52)] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-dark-gold/70 to-transparent" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_16%,transparent_84%,rgba(255,255,255,0.03))]" />

              <div className="relative p-6 sm:p-8">
                <motion.div
                  custom={0}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="mb-8"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-dark-gold/15 bg-dark-gold/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-dark-gold/90">
                    <LogIn size={12} />
                    {t('app.subtitle')}
                  </div>

                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight text-[#f3e0b5]">
                        {t('login.title')}
                      </h3>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-[#8a7a60]">
                        {t('login.cardDescription')}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-dark-gold/20 bg-dark-gold/10 text-dark-gold">
                      <Boxes size={22} />
                    </div>
                  </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div
                    custom={1}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.24em] text-[#8a7a60]">
                      {t('login.username')}
                    </label>
                    <div className={getFieldShellClass('username')}>
                      <div className="pl-4 pr-0">
                        <User
                          size={17}
                          className={
                            focusedField === 'username'
                              ? 'text-dark-gold'
                              : 'text-[#8a7a60]/55'
                          }
                        />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(event) => {
                          setUsername(event.target.value)
                          if (error) setError(null)
                        }}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-transparent px-3 py-3.5 text-sm text-[#f0dfb8] placeholder:text-[#8a7a60]/40 focus:outline-none"
                        placeholder={t('login.username')}
                        autoFocus
                        autoComplete="username"
                        spellCheck={false}
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    custom={2}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.24em] text-[#8a7a60]">
                      {t('login.password')}
                    </label>
                    <div className={getFieldShellClass('password')}>
                      <div className="pl-4 pr-0">
                        <Lock
                          size={17}
                          className={
                            focusedField === 'password'
                              ? 'text-dark-gold'
                              : 'text-[#8a7a60]/55'
                          }
                        />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value)
                          if (error) setError(null)
                        }}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-transparent px-3 py-3.5 text-sm text-[#f0dfb8] placeholder:text-[#8a7a60]/40 focus:outline-none"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="mr-2 rounded-xl p-2 text-[#8a7a60]/60 transition-colors hover:text-[#d4c4a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-gold/30"
                        aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {errorContent && (
                      <motion.div
                        variants={shakeVariants}
                        animate="shake"
                        initial={{ opacity: 0, height: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${errorContent.toneClass}`}
                          role="alert"
                        >
                          <AlertCircle
                            size={16}
                            className={`mt-0.5 shrink-0 ${errorContent.iconClass}`}
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{errorContent.title}</p>
                            <p className="text-xs leading-5 opacity-85">
                              {errorContent.description}
                            </p>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    custom={3}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.button
                      type="submit"
                      disabled={isSubmitDisabled}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dark-gold/35 bg-gradient-to-r from-dark-gold/25 via-dark-gold/18 to-dark-gold/25 px-4 py-3.5 text-sm font-semibold text-dark-gold transition-all duration-200 hover:border-dark-gold/55 hover:from-dark-gold/35 hover:to-dark-gold/30 hover:shadow-[0_14px_32px_rgba(200,160,80,0.08)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
                    >
                      <span className="absolute inset-0 translate-x-[-110%] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.14),transparent)] transition-transform duration-700 group-hover:translate-x-[120%]" />
                      {loading ? (
                        <Loader2 size={16} className="relative animate-spin" />
                      ) : (
                        <LogIn size={16} className="relative" />
                      )}
                      <span className="relative">{t('login.submit')}</span>
                    </motion.button>
                  </motion.div>
                </form>

                <motion.div
                  custom={4}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative my-7"
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dark-border/60" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-dark-card/90 px-3 text-[11px] uppercase tracking-[0.26em] text-[#8a7a60]/70">
                      {t('login.or')}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  custom={5}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  <p className="text-center text-sm text-[#8a7a60]">{t('login.noAccount')}</p>
                  <Link
                    to="/register"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dark-border/80 bg-black/10 px-4 py-3 text-sm font-medium text-[#d4c4a0] transition-all duration-200 hover:border-dark-gold/35 hover:bg-dark-hover hover:text-[#f0dfb8]"
                  >
                    <UserPlus size={16} className="text-dark-gold" />
                    <span>{t('login.signUp')}</span>
                    <ArrowRight size={15} className="text-[#8a7a60]" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
