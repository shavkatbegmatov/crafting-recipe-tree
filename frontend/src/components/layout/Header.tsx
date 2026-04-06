import { Boxes, Menu, LogIn, LogOut, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { LANGUAGES } from '../../i18n'

interface Props {
  onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: Props) {
  const { t, i18n } = useTranslation()
  const { user, isAdmin, logout } = useAuth()

  return (
    <header className="h-14 bg-dark-card border-b border-dark-border flex items-center px-4 gap-3 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden text-[#8a7a60] hover:text-[#d4c4a0] transition-colors"
      >
        <Menu size={20} />
      </button>
      <Link to="/" className="flex items-center gap-2 text-[#d4c4a0] hover:text-[#e8d8b0] transition-colors">
        <Boxes size={22} className="text-dark-gold" />
        <span className="font-semibold text-lg">{t('app.title')}</span>
      </Link>
      <span className="text-xs text-[#8a7a60] ml-2 hidden sm:inline">{t('app.subtitle')}</span>

      <div className="ml-auto flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center gap-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                i18n.language === lang.code
                  ? 'bg-dark-gold/20 text-dark-gold border border-dark-gold/40'
                  : 'text-[#8a7a60] hover:text-[#d4c4a0] border border-transparent'
              }`}
              title={lang.name}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Auth */}
        <div className="border-l border-dark-border pl-2 flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <span className="flex items-center gap-1 text-xs text-dark-gold">
                  <Shield size={12} />
                  {t('auth.admin')}
                </span>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs text-[#8a7a60] hover:text-[#d4c4a0] transition-colors"
              >
                <LogOut size={13} />
                {t('auth.logout')}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 text-xs text-[#8a7a60] hover:text-dark-gold transition-colors"
            >
              <LogIn size={13} />
              {t('auth.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
