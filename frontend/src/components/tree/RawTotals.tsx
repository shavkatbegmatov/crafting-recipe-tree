import { Link } from 'react-router-dom'
import { useRawTotals } from '../../hooks/useRecipeTree'
import { useTranslation } from 'react-i18next'
import { useLocalizedField } from '../../hooks/useLanguage'
import { useCategories } from '../../hooks/useItems'
import Spinner from '../ui/Spinner'
import ItemImageIcon from '../ui/ItemImageIcon'
import QuantityInput from '../ui/QuantityInput'
import { Database, Clock } from 'lucide-react'
import { formatTime } from '../../utils/formatTime'
import { DEFAULT_CATEGORY_COLOR } from '../../utils/constants'

interface Props {
  itemId: number
  itemName: string
  quantity?: number
  onQuantityChange?: (q: number) => void
}

function formatQty(value: number): string {
  if (value % 1 === 0) return String(value)
  return Number(value.toFixed(4)).toString()
}

export default function RawTotals({ itemId, itemName: _itemName, quantity = 1, onQuantityChange }: Props) {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { data: categories } = useCategories()
  const { data, isLoading } = useRawTotals(itemId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    )
  }

  if (!data || data.rawMaterials.length === 0) return null

  const localizedItemName = getField(data, 'itemName')
  const totalTimeSeconds = data.totalCraftTimeSeconds * quantity

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-sm font-semibold text-[#d4c4a0] flex items-center gap-2">
          <Database size={16} className="text-[#8a7a60]" />
          {t('rawTotals.title', { count: quantity, itemName: localizedItemName })}
        </h2>
        {onQuantityChange && (
          <QuantityInput value={quantity} onChange={onQuantityChange} />
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="text-left py-2 px-3 text-[#8a7a60] font-medium">{t('rawTotals.rawMaterial')}</th>
              <th className="text-right py-2 px-3 text-[#8a7a60] font-medium">{t('rawTotals.quantity')}</th>
            </tr>
          </thead>
          <tbody>
            {data.rawMaterials.map((mat) => {
              const matName = getField(mat, 'name')
              const matColor =
                categories?.find((c) => c.code === mat.categoryCode)?.color || DEFAULT_CATEGORY_COLOR
              const totalQty = Number(mat.totalQuantity) * quantity
              return (
                <tr key={mat.id} className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <ItemImageIcon
                        imageUrl={mat.imageUrl}
                        alt={matName}
                        size={22}
                        fallbackColor={matColor}
                      />
                      <Link
                        to={`/items/${mat.id}`}
                        className="hover:underline transition-colors"
                        style={{ color: matColor }}
                      >
                        {matName}
                      </Link>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[#8a7a60]">
                    {formatQty(totalQty)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-dark-border flex items-center gap-2 text-sm">
        <Clock size={14} className="text-dark-gold" />
        <span className="text-[#8a7a60]">{t('rawTotals.totalTime')}</span>
        <span className="font-mono text-dark-gold font-medium">
          {formatTime(totalTimeSeconds)}
        </span>
      </div>
    </div>
  )
}
