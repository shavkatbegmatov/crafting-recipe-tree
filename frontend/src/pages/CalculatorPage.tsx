import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Calculator, Clock, Loader2 } from 'lucide-react'
import { useLocalizedField } from '../hooks/useLanguage'
import { useCategories } from '../hooks/useItems'
import { useCalculator } from '../hooks/useCalculator'
import { useContentWidth } from '../hooks/useContentWidth'
import { useGoBack } from '../hooks/useGoBack'
import MaterialPicker, { type PickedItem } from '../components/items/MaterialPicker'
import ItemImageIcon from '../components/ui/ItemImageIcon'
import { formatTime } from '../utils/formatTime'
import { DEFAULT_CATEGORY_COLOR } from '../utils/constants'

function formatQty(n: number): string {
  return String(Math.round(n * 10000) / 10000)
}

export default function CalculatorPage() {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const goBack = useGoBack('/')
  const contentWidth = useContentWidth('max-w-4xl')
  const { data: categories } = useCategories()

  const [selected, setSelected] = useState<PickedItem[]>([])
  const calc = useCalculator(selected)

  const colorOf = (code?: string) => categories?.find((c) => c.code === code)?.color || DEFAULT_CATEGORY_COLOR

  return (
    <div className={`space-y-5 ${contentWidth}`}>
      <button
        type="button"
        onClick={goBack}
        className="text-skin-muted hover:text-skin-base text-sm flex items-center gap-1 transition-colors"
      >
        <ArrowLeft size={14} /> {t('common.back')}
      </button>

      <div>
        <h1 className="text-xl font-semibold text-skin-base flex items-center gap-2">
          <Calculator size={18} className="text-dark-gold" />
          {t('calculator.title')}
        </h1>
        <p className="text-xs text-skin-muted mt-1">{t('calculator.subtitle')}</p>
      </div>

      <MaterialPicker
        selected={selected}
        onChange={setSelected}
        searchPlaceholder={t('calculator.search')}
        emptyHint={t('calculator.empty')}
        targetsLabel={t('calculator.targets')}
      />

      {/* Natija — birlashtirilgan xomashyo */}
      {selected.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-dark-border flex items-center justify-between">
            <span className="text-sm font-semibold text-skin-base">{t('calculator.result')}</span>
            {calc.isLoading && <Loader2 size={14} className="animate-spin text-dark-gold" />}
          </div>

          {calc.isError ? (
            <div className="py-8 text-center text-sm text-red-400">{t('calculator.error')}</div>
          ) : calc.rawMaterials.length === 0 && !calc.isLoading ? (
            <div className="py-8 text-center text-sm text-skin-dark">{t('calculator.noMaterials')}</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-bg/30 text-skin-muted">
                    <th className="text-left py-2 px-4 font-medium">{t('calculator.material')}</th>
                    <th className="text-right py-2 px-4 font-medium">{t('calculator.quantity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.rawMaterials.map((m) => (
                    <tr key={m.id} className="border-b border-dark-border/40 hover:bg-dark-hover/40 transition-colors">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2.5">
                          <ItemImageIcon imageUrl={m.imageUrl} alt={getField(m, 'name')} size={22} fallbackColor={colorOf(m.categoryCode)} />
                          <span className="text-skin-base">{getField(m, 'name')}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-dark-gold">{formatQty(m.totalQuantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-dark-border text-xs">
                <span className="flex items-center gap-1.5 text-skin-muted">
                  <Clock size={13} /> {t('calculator.totalTime')}
                </span>
                <span className="font-mono text-skin-base">{formatTime(calc.totalCraftTimeSeconds)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
