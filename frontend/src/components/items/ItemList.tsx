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
      <div className="text-center py-12 text-[#8a7a60] text-sm">
        {t('itemList.empty')}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
