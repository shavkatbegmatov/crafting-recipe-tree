import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Star, Loader2, LogIn, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../hooks/useFavorites'
import { useContentWidth } from '../hooks/useContentWidth'
import { useGoBack } from '../hooks/useGoBack'
import ItemCard from '../components/items/ItemCard'

export default function FavoritesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const contentWidth = useContentWidth('max-w-6xl')
  const goBack = useGoBack('/')
  const { data: favorites, isLoading, isError } = useFavorites(!!user)

  if (!user) {
    return (
      <div className={`${contentWidth} text-center py-16`}>
        <Star size={32} className="mx-auto text-[#5a4e3a] mb-3" />
        <p className="text-sm text-[#8a7a60] mb-4">{t('favorites.loginRequired')}</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
            bg-dark-gold/15 text-dark-gold border border-dark-gold/30 hover:bg-dark-gold/25 transition-colors"
        >
          <LogIn size={13} /> {t('auth.login')}
        </Link>
      </div>
    )
  }

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
          <Star size={18} className="text-dark-gold" />
          {t('favorites.title')}
        </h1>
        <p className="text-xs text-[#8a7a60] mt-1">{t('favorites.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 size={20} className="animate-spin text-dark-gold mx-auto" />
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-sm text-red-400">{t('common.loadFailed')}</div>
      ) : !favorites || favorites.length === 0 ? (
        <div className="py-16 text-center">
          <Star size={32} className="mx-auto text-[#5a4e3a] mb-3" />
          <p className="text-sm text-[#8a7a60]">{t('favorites.empty')}</p>
          <p className="text-xs text-[#5a4e3a] mt-1">{t('favorites.emptyHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {favorites.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
