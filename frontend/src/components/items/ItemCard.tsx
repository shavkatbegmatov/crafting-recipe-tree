import { Link } from 'react-router-dom'
import { Clock, ImageOff } from 'lucide-react'
import type { CraftItem } from '../../api/types'
import CategoryBadge from '../ui/CategoryBadge'
import SafeImage from '../ui/SafeImage'
import FavoriteButton from './FavoriteButton'
import { formatTime } from '../../utils/formatTime'
import { useLocalizedField } from '../../hooks/useLanguage'

interface Props {
  item: CraftItem
}

export default function ItemCard({ item }: Props) {
  const { getField } = useLocalizedField()
  const isPng = item.imageUrl?.endsWith('.png') ?? false

  return (
    <Link
      to={`/items/${item.id}`}
      className="group relative block panel panel-glow overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Hover'da gold yuqori chiziq — "skan" effekti */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-dark-gold/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <FavoriteButton itemId={item.id} />
      </div>
      {item.imageUrl ? (
        <div className={`bg-dark-panel overflow-hidden flex items-center justify-center ${
          isPng ? 'py-4' : 'aspect-[4/3]'
        }`}>
          <SafeImage
            src={item.imageUrl}
            alt={getField(item, 'name')}
            containerClassName={isPng ? 'w-12 h-12' : 'w-full h-full'}
            className={`opacity-85 group-hover:opacity-100 transition-[opacity,transform] duration-500 ${
              isPng
                ? 'w-12 h-12 object-contain group-hover:scale-110'
                : 'w-full h-full object-contain group-hover:scale-105'
            }`}
            iconSize={isPng ? 24 : 40}
          />
        </div>
      ) : (
        /* Rasmsiz item — rasm bloki PNG ikonkalar bilan bir xil balandlikda (py-4 + w-12 h-12),
           shunda karta boshqalardan baland bo'lib qolmaydi; sarlavha o'z joyida qoladi va
           FavoriteButton (yulduzcha) sarlavha/badge bilan ustma-ust tushmaydi. */
        <div className="py-4 bg-dark-panel/40 flex items-center justify-center">
          <ImageOff strokeWidth={1.5} className="w-12 h-12 text-dark-border" />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-medium text-skin-base group-hover:text-skin-accent transition-colors truncate">
            {getField(item, 'name')}
          </h3>
          <CategoryBadge code={item.categoryCode} />
        </div>
        {/* Vaqt qatori har doim joy egallaydi — vaqtli/vaqtsiz kartalar bir xil balandlikda */}
        <div className="h-[18px] flex items-center gap-1 text-xs text-skin-muted">
          {item.craftTimeSeconds > 0 && (
            <>
              <Clock size={12} className="text-dark-gold/70" />
              <span className="font-mono">{formatTime(item.craftTimeSeconds)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
