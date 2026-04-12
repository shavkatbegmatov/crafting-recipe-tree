import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Boxes,
  LogIn,
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  User,
  Lock,
  AlertCircle,
} from 'lucide-react'

/* ── Floating particles for background ── */
const particles = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  size: 120 + Math.random() * 200,
  x: 10 + Math.random() * 80,
  y: 10 + Math.random() * 80,
  duration: 18 + Math.random() * 14,
  delay: i * 1.5,
}))

/* ── Animation variants ── */
const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

const shakeVariants = {
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.45 },
  },
}

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!username.trim() || !password) return
      setLoading(true)
      setError(null)
      try {
        await login(username.trim(), password)
        navigate('/')
      } catch (err: any) {
        setError(err.message || t('login.error'))
      } finally {
        setLoading(false)
      }
    },
    [username, password, login, navigate, t],
  )

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 overflow-hidden relative">
      {/* ── Animated background particles ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background:
                'radial-gradient(circle, rgba(200,160,80,0.06) 0%, transparent 70%)',
            }}
            animate={{
              x: [0, 40, -30, 20, 0],
              y: [0, -30, 20, -40, 0],
              scale: [1, 1.15, 0.9, 1.1, 1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: p.delay,
            }}
          />
        ))}
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(200,160,80,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(200,160,80,1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Login card ── */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-[420px]"
      >
        {/* Glow effect behind card */}
        <div className="absolute -inset-1 bg-gradient-to-br from-dark-gold/10 via-transparent to-dark-gold/5 rounded-3xl blur-xl" />

        <div className="relative bg-dark-card/80 backdrop-blur-xl border border-dark-border/60 rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/40">
          {/* ── Logo ── */}
          <motion.div
            custom={0}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center mb-8"
          >
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dark-gold/20 to-dark-gold/5 border border-dark-gold/20 flex items-center justify-center mb-4"
              whileHover={{ scale: 1.05, rotate: 3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Boxes size={28} className="text-dark-gold" />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#d4c4a0] tracking-tight">
              Craft Tree
            </h1>
            <p className="text-sm text-[#8a7a60] mt-1">{t('login.title')}</p>
          </motion.div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <motion.div
              custom={1}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <label className="block text-xs font-medium text-[#8a7a60] mb-2 uppercase tracking-wider">
                {t('login.username')}
              </label>
              <div
                className={`relative flex items-center rounded-xl border transition-all duration-200
                  ${
                    focusedField === 'username'
                      ? 'border-dark-gold/50 shadow-[0_0_0_3px_rgba(200,160,80,0.08)]'
                      : 'border-dark-border hover:border-dark-border/80'
                  }
                  bg-dark-bg/60`}
              >
                <div className="pl-3.5 pr-0">
                  <User
                    size={16}
                    className={`transition-colors duration-200 ${
                      focusedField === 'username'
                        ? 'text-dark-gold'
                        : 'text-[#8a7a60]/50'
                    }`}
                  />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent px-3 py-3 text-sm text-[#d4c4a0] placeholder-[#8a7a60]/40 focus:outline-none"
                  placeholder="username"
                  autoFocus
                  autoComplete="username"
                  required
                />
              </div>
            </motion.div>

            {/* Password field */}
            <motion.div
              custom={2}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <label className="block text-xs font-medium text-[#8a7a60] mb-2 uppercase tracking-wider">
                {t('login.password')}
              </label>
              <div
                className={`relative flex items-center rounded-xl border transition-all duration-200
                  ${
                    focusedField === 'password'
                      ? 'border-dark-gold/50 shadow-[0_0_0_3px_rgba(200,160,80,0.08)]'
                      : 'border-dark-border hover:border-dark-border/80'
                  }
                  bg-dark-bg/60`}
              >
                <div className="pl-3.5 pr-0">
                  <Lock
                    size={16}
                    className={`transition-colors duration-200 ${
                      focusedField === 'password'
                        ? 'text-dark-gold'
                        : 'text-[#8a7a60]/50'
                    }`}
                  />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent px-3 py-3 text-sm text-[#d4c4a0] placeholder-[#8a7a60]/40 focus:outline-none"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-3.5 pl-1 text-[#8a7a60]/50 hover:text-[#d4c4a0] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Error message */}
            <AnimatePresence mode="wait">
              {error && (
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
                    className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                  >
                    <AlertCircle size={15} className="text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.div
              custom={3}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.button
                type="submit"
                disabled={loading || !username.trim() || !password}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-sm font-semibold
                  bg-gradient-to-r from-dark-gold/25 to-dark-gold/15
                  text-dark-gold border border-dark-gold/30
                  hover:from-dark-gold/35 hover:to-dark-gold/25 hover:border-dark-gold/50
                  hover:shadow-lg hover:shadow-dark-gold/5
                  transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {t('login.submit')}
              </motion.button>
            </motion.div>
          </form>

          {/* ── Divider ── */}
          <motion.div
            custom={4}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="relative my-7"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-dark-card/80 backdrop-blur-sm px-3 text-[11px] text-[#8a7a60]/60 uppercase tracking-widest">
                {t('login.or')}
              </span>
            </div>
          </motion.div>

          {/* ── Register link ── */}
          <motion.div
            custom={5}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Link
              to="/register"
              className="w-full py-2.5 rounded-xl text-sm font-medium
                bg-transparent text-[#8a7a60] border border-dark-border/50
                hover:bg-dark-hover hover:text-[#d4c4a0] hover:border-dark-border
                transition-all duration-200
                flex items-center justify-center gap-2"
            >
              <UserPlus size={15} />
              {t('login.signUp')}
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
