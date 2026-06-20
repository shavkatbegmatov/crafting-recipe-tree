import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, Plus } from 'lucide-react'
import { useItems, useCategories } from '../../hooks/useItems'
import { useLocalizedField } from '../../hooks/useLanguage'
import ItemImageIcon from '../ui/ItemImageIcon'
import { DEFAULT_CATEGORY_COLOR } from '../../utils/constants'

export interface PickedItem {
  id: number
  quantity: number
}

interface Props {
  selected: PickedItem[]
  onChange: (items: PickedItem[]) => void
  searchPlaceholder: string
  /** Tanlanmagan holatdagi yordam matni. */
  emptyHint: string
  targetsLabel: string
}

/**
 * Item + miqdor tanlash bloki: qidirib qo'shish, miqdorni o'zgartirish, olib tashlash.
 * Kalkulyator va "nima yasay olaman?" sahifalarida birgalikda ishlatiladi.
 */
export default function MaterialPicker({ selected, onChange, searchPlaceholder, emptyHint, targetsLabel }: Props) {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { data: allItems } = useItems(undefined)
  const { data: categories } = useCategories()
  const [search, setSearch] = useState('')

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

  const add = (id: number) => { onChange([...selected, { id, quantity: 1 }]); setSearch('') }
  const remove = (id: number) => onChange(selected.filter((s) => s.id !== id))
  const setQty = (id: number, q: number) =>
    onChange(selected.map((s) => (s.id === id ? { ...s, quantity: Math.max(1, q || 1) } : s)))

  return (
    <div className="space-y-3">
      {/* Qidirib qo'shish */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-skin-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-dark-bg border border-dark-border rounded pl-9 pr-3 py-2 text-sm text-skin-base
            placeholder:text-skin-muted/50 focus:outline-none focus:border-dark-gold/50"
        />
        {searchResults.length > 0 && (
          <div className="absolute z-20 mt-1 w-full panel shadow-2xl overflow-hidden">
            {searchResults.map((i) => (
              <button
                key={i.id}
                onClick={() => add(i.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-dark-hover transition-colors"
              >
                <ItemImageIcon imageUrl={i.imageUrl} alt={getField(i, 'name')} size={22} fallbackColor={colorOf(i.categoryCode)} />
                <span className="flex-1 text-sm text-skin-base truncate">{getField(i, 'name')}</span>
                <Plus size={14} className="text-dark-gold" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tanlangan itemlar */}
      {selected.length === 0 ? (
        <div className="panel py-8 text-center text-sm text-skin-dark">
          {emptyHint}
        </div>
      ) : (
        <div className="space-y-2">
          <span className="text-[10px] font-medium text-skin-muted uppercase tracking-wider">{targetsLabel}</span>
          {selected.map((s) => {
            const it = itemOf(s.id)
            return (
              <div key={s.id} className="flex items-center gap-3 panel px-3 py-2">
                <ItemImageIcon imageUrl={it?.imageUrl} alt={it ? getField(it, 'name') : ''} size={26} fallbackColor={colorOf(it?.categoryCode)} />
                <span className="flex-1 text-sm text-skin-base truncate">{it ? getField(it, 'name') : `#${s.id}`}</span>
                <input
                  type="number"
                  min={1}
                  value={s.quantity}
                  onChange={(e) => setQty(s.id, parseInt(e.target.value, 10))}
                  className="w-16 bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-skin-base text-center
                    focus:outline-none focus:border-dark-gold/50"
                />
                <button
                  onClick={() => remove(s.id)}
                  className="p-1.5 rounded border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                  title={t('common.back')}
                >
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
