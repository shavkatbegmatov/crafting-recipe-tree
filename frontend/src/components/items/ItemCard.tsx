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
      className="block bg-dark-card border border-dark-border rounded-lg p-4 hover:border-gray-500 hover:bg-dark-hover transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
          {item.name}
        </h3>
        <CategoryBadge code={item.categoryCode} />
      </div>
      {item.craftTimeSeconds > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={12} />
          <span className="font-mono">{formatTime(item.craftTimeSeconds)}</span>
        </div>
      )}
    </Link>
  )
}
