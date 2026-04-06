import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Boxes, LogIn, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-lg p-8 w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Boxes size={28} className="text-dark-gold" />
          <span className="font-semibold text-xl text-[#d4c4a0]">Craft Tree</span>
        </div>

        <h2 className="text-center text-sm text-[#8a7a60] mb-6">{t('login.title')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#8a7a60] mb-1">{t('login.username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs text-[#8a7a60] mb-1">{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded text-sm font-medium bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
            {t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
