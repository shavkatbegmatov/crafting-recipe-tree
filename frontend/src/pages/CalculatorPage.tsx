import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Calculator, Search, X, Plus, Clock, Loader2 } from 'lucide-react'
import { useItems, useCategories } from '../hooks/useItems'
import { useLocalizedField } from '../hooks/useLanguage'
import { useCalculator, type CalcItem } from '../hooks/useCalculator'
import { useContentWidth } from '../hooks/useContentWidth'
import { useGoBack } from '../hooks/useGoBack'
import ItemImageIcon from '../components/ui/ItemImageIcon'
import { formatTime } from '../utils/formatTime'
import { DEFAULT_CATEGORY_COLOR } from '../utils/constants'

// Kasrli miqdorni ixcham ko'rsatadi (butun bo'lsa — kasrsiz, aks holda 2 xona).
function formatQty(n: number): string {
  const r = Math.round(n * 10000) / 10000
  return Number.isInteger(r) ? String(r) : String(r)
}

export default function CalculatorPage() {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const goBack = useGoBack('/')
  const contentWidth = useContentWidth('max-w-4xl')
  const { data: allItems } = useItems(undefined)
  const { data: categories } = useCategories()

  const [selected, setSelected] = useState<CalcItem[]>([])
  const [search, setSearch] = useState('')

  const calc = useCalculator(selected)

  const searchResults =
    search.trim().length > 0 && allItems
      ? allItems
          .filter(
            (i) =>
              getField(i, 'name').toLowerCase().includes(search.trim().toLowerCase()) &&
              !selected.some((s) => s.id === i.id)
          )
          .slice(0, 8)
      : []

  const itemOf = (id: number) => allItems?.find((i) => i.id === id)
  const colorOf = (code?: string) => categories?.find((c) => c.code === code)?.color || DEFAULT_CATEGORY_COLOR

  const add = (id: number) => { setSelected((p) => [...p, { id, quantity: 1 }]); setSearch('') }
  const remove = (id: number) => setSelected((p) => p.filter((s) => s.id !== id))
  const setQty = (id: number, q: number) =>
    setSelected((p) => p.map((s) => (s.id === id ? { ...s, quantity: Math.max(1, q || 1) } : s)))

  return (
    <div className={`space-y-5 ${contentWidth}`}>
      <button
        type="button"
        onClick={goBack}
        className="text-[#8a7a60] hover:text-[#d4c4a0] text-sm flex items-center gap-1 transition-colors"
      >
        <ArrowLeft size={14} /> {t('common.back')}
      </button>

      <div>
        <h1 className="text-xl font-semibold text-[#d4c4a0] flex items-center gap-2">
          <Calculator size={18} className="text-dark-gold" />
          {t('calculator.title')}
        </h1>
        <p className="text-xs text-[#8a7a60] mt-1">{t('calculator.subtitle')}</p>
      </div>

      {/* Qidiruv + qo'shish */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a60]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('calculator.search')}
          className="w-full bg-dark-bg border border-dark-border rounded pl-9 pr-3 py-2 text-sm text-[#d4c4a0]
            placeholder:text-[#8a7a60]/50 focus:outline-none focus:border-dark-gold/50"
        />
        {searchResults.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-dark-card border border-dark-border rounded-lg shadow-2xl overflow-hidden">
            {searchResults.map((i) => (
              <button
                key={i.id}
                onClick={() => add(i.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-dark-hover transition-colors"
              >
                <ItemImageIcon imageUrl={i.imageUrl} alt={getField(i, 'name')} size={22} fallbackColor={colorOf(i.categoryCode)} />
                <span className="flex-1 text-sm text-[#d4c4a0] truncate">{getField(i, 'name')}</span>
                <Plus size={14} className="text-dark-gold" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tanlangan maqsadlar */}
      {selected.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-lg py-10 text-center text-sm text-[#5a4e3a]">
          {t('calculator.empty')}
        </div>
      ) : (
        <div className="space-y-2">
          <span className="text-[10px] font-medium text-[#8a7a60] uppercase tracking-wider">
            {t('calculator.targets')}
          </span>
          {selected.map((s) => {
            const it = itemOf(s.id)
            return (
              <div key={s.id} className="flex items-center gap-3 bg-dark-card border border-dark-border rounded-lg px-3 py-2">
                <ItemImageIcon imageUrl={it?.imageUrl} alt={it ? getField(it, 'name') : ''} size={26} fallbackColor={colorOf(it?.categoryCode)} />
                <span className="flex-1 text-sm text-[#d4c4a0] truncate">{it ? getField(it, 'name') : `#${s.id}`}</span>
                <input
                  type="number"
                  min={1}
                  value={s.quantity}
                  onChange={(e) => setQty(s.id, parseInt(e.target.value, 10))}
                  className="w-16 bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-[#d4c4a0] text-center
                    focus:outline-none focus:border-dark-gold/50"
                />
                <button
                  onClick={() => remove(s.id)}
                  className="p-1.5 rounded border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                  title={t('calculator.remove')}
                >
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Natija — birlashtirilgan xomashyo */}
      {selected.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-dark-border flex items-center justify-between">
            <span className="text-sm font-semibold text-[#d4c4a0]">{t('calculator.result')}</span>
            {calc.isLoading && <Loader2 size={14} className="animate-spin text-dark-gold" />}
          </div>

          {calc.isError ? (
            <div className="py-8 text-center text-sm text-red-400">{t('calculator.error')}</div>
          ) : calc.rawMaterials.length === 0 && !calc.isLoading ? (
            <div className="py-8 text-center text-sm text-[#5a4e3a]">{t('calculator.noMaterials')}</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-bg/30 text-[#8a7a60]">
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
                          <span className="text-[#d4c4a0]">{getField(m, 'name')}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-dark-gold">{formatQty(m.totalQuantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-dark-border text-xs">
                <span className="flex items-center gap-1.5 text-[#8a7a60]">
                  <Clock size={13} /> {t('calculator.totalTime')}
                </span>
                <span className="font-mono text-[#d4c4a0]">{formatTime(calc.totalCraftTimeSeconds)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
