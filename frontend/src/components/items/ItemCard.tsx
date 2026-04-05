import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import type { CraftItem } from '../../api/types'
import CategoryBadge from '../ui/CategoryBadge'
import { formatTime } from '../../utils/formatTime'

interface Props {
  item: CraftItem
}

export default function ItemCard({ item }: Props) {
  return (
    <Link
      to={`/items/${item.id}`}
      className="block bg-dark-card border border-dark-border rounded-lg overflow-hidden hover:border-dark-gold/40 hover:bg-dark-hover transition-all group"
    >
      {item.imageUrl && (
        <div className={`bg-dark-panel overflow-hidden flex items-center justify-center ${
          item.imageUrl.endsWith('.png') ? 'py-4' : 'aspect-[4/3]'
        }`}>
          <img
            src={item.imageUrl}
            alt={item.name}
            className={`opacity-85 group-hover:opacity-100 transition-opacity ${
              item.imageUrl.endsWith('.png')
                ? 'w-12 h-12 object-contain'
                : 'w-full h-full object-contain'
            }`}
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-medium text-[#d4c4a0] group-hover:text-[#e8d8b0] transition-colors truncate">
            {item.name}
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
