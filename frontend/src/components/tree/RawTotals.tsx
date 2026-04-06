import { useRawTotals } from '../../hooks/useRecipeTree'
import { useTranslation } from 'react-i18next'
import { useLocalizedField } from '../../hooks/useLanguage'
import Spinner from '../ui/Spinner'
import { Database, Clock } from 'lucide-react'
import { formatTime } from '../../utils/formatTime'

interface Props {
  itemId: number
  itemName: string
}

export default function RawTotals({ itemId, itemName }: Props) {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
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

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-5">
      <h2 className="text-sm font-semibold text-[#d4c4a0] mb-4 flex items-center gap-2">
        <Database size={16} className="text-[#8a7a60]" />
        {t('rawTotals.title', { itemName: localizedItemName })}
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="text-left py-2 px-3 text-[#8a7a60] font-medium">{t('rawTotals.rawMaterial')}</th>
              <th className="text-right py-2 px-3 text-[#8a7a60] font-medium">{t('rawTotals.quantity')}</th>
            </tr>
          </thead>
          <tbody>
            {data.rawMaterials.map((mat) => (
              <tr key={mat.name} className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors">
                <td className="py-2 px-3 text-[#d4c4a0]">{getField(mat, 'name')}</td>
                <td className="py-2 px-3 text-right font-mono text-[#8a7a60]">
                  {mat.totalQuantity % 1 === 0 ? mat.totalQuantity : Number(mat.totalQuantity).toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-dark-border flex items-center gap-2 text-sm">
        <Clock size={14} className="text-dark-gold" />
        <span className="text-[#8a7a60]">{t('rawTotals.totalTime')}</span>
        <span className="font-mono text-dark-gold font-medium">
          {formatTime(data.totalCraftTimeSeconds)}
        </span>
      </div>
    </div>
  )
}
