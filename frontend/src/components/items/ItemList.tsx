import type { CraftItem } from '../../api/types'
import ItemCard from './ItemCard'
import Spinner from '../ui/Spinner'
import { useTranslation } from 'react-i18next'

interface Props {
  items: CraftItem[] | undefined
  isLoading: boolean
}

export default function ItemList({ items, isLoading }: Props) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 text-skin-muted text-sm">
        {t('itemList.empty')}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <div
          key={item.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${Math.min(i * 0.03, 0.45)}s` }}
        >
          <ItemCard item={item} />
        </div>
      ))}
    </div>
  )
}
