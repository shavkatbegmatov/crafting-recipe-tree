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
      className="relative block bg-dark-card border border-dark-border rounded-lg overflow-hidden hover:border-dark-gold/40 hover:bg-dark-hover transition-all group"
    >
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
            className={`opacity-85 group-hover:opacity-100 transition-opacity ${
              isPng
                ? 'w-12 h-12 object-contain'
                : 'w-full h-full object-contain'
            }`}
            iconSize={isPng ? 24 : 40}
          />
        </div>
      ) : (
        /* Rasmsiz item — bir xil tepa blok saqlanadi: sarlavha o'z joyida qoladi va
           FavoriteButton (yulduzcha) sarlavha/badge bilan ustma-ust tushmaydi. */
        <div className="aspect-[4/3] bg-dark-panel/40 flex items-center justify-center">
          <ImageOff size={32} strokeWidth={1.5} className="text-dark-border" />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-medium text-[#d4c4a0] group-hover:text-[#e8d8b0] transition-colors truncate">
            {getField(item, 'name')}
          </h3>
          <CategoryBadge code={item.categoryCode} />
        </div>
        {item.craftTimeSeconds > 0 && (
          <div className="flex items-center gap-1 text-xs text-[#8a7a60]">
            <Clock size={12} />
            <span className="font-mono">{formatTime(item.craftTimeSeconds)}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
