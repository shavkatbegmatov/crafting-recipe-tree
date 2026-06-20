import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useFavoriteIds, useToggleFavorite } from '../../hooks/useFavorites'

interface Props {
  itemId: number
  size?: number
  className?: string
}

/**
 * Itemni sevimlilarga qo'shish/olib tashlash yulduzchasi.
 * Faqat tizimga kirgan foydalanuvchiga ko'rinadi. ItemCard ichida (Link ichida) ishlaganda
 * bosish navigatsiyani triggerlamasligi uchun hodisa to'xtatiladi.
 */
export default function FavoriteButton({ itemId, size = 16, className = '' }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: ids } = useFavoriteIds(!!user)
  const toggle = useToggleFavorite()

  if (!user) return null

  const favorited = ids?.has(itemId) ?? false
  const label = favorited ? t('favorites.remove') : t('favorites.add')

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle.mutate({ itemId, favorited })
      }}
      disabled={toggle.isPending}
      title={label}
      aria-label={label}
      aria-pressed={favorited}
      className={`p-1.5 rounded-lg bg-dark-bg/70 backdrop-blur-sm border transition-all disabled:opacity-50 ${
        favorited
          ? 'border-dark-gold/50 shadow-glow-gold-sm'
          : 'border-dark-border hover:border-dark-gold/40'
      } ${className}`}
    >
      <Star
        size={size}
        className={favorited
          ? 'fill-dark-gold text-dark-gold drop-shadow-[0_0_5px_rgba(200,160,80,0.7)]'
          : 'text-skin-muted'}
      />
    </button>
  )
}
