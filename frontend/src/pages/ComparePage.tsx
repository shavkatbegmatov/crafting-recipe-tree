import { useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { GitCompare, Search, X, Plus, Clock, Loader2, ArrowLeft } from 'lucide-react'
import { useItems, useCategories } from '../hooks/useItems'
import { useGameVersion } from '../contexts/GameVersionContext'
import { fetchRawTotals } from '../api/items'
import { useLocalizedField } from '../hooks/useLanguage'
import { useContentWidth } from '../hooks/useContentWidth'
import { useGoBack } from '../hooks/useGoBack'
import ItemImageIcon from '../components/ui/ItemImageIcon'
import CategoryBadge from '../components/ui/CategoryBadge'
import { formatTime } from '../utils/formatTime'
import { DEFAULT_CATEGORY_COLOR } from '../utils/constants'

const MAX_COMPARE = 3

function fmt(n: number): string {
  return String(Math.round(n * 10000) / 10000)
}

export default function ComparePage() {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const contentWidth = useContentWidth('max-w-5xl')
  const goBack = useGoBack('/')
  const { effectiveVersion } = useGameVersion()
  const { data: allItems } = useItems(undefined)
  const { data: categories } = useCategories()

  const [selected, setSelected] = useState<number[]>([])
  const [search, setSearch] = useState('')

  const rawResults = useQueries({
    queries: selected.map((id) => ({
      queryKey: ['rawTotals', id, effectiveVersion],
      queryFn: () => fetchRawTotals(id, effectiveVersion ?? undefined),
      enabled: id > 0,
      staleTime: 60_000,
    })),
  })

  const itemOf = (id: number) => allItems?.find((i) => i.id === id)
  const colorOf = (code?: string) => categories?.find((c) => c.code === code)?.color || DEFAULT_CATEGORY_COLOR

  const searchResults =
    search.trim().length > 0 && allItems
      ? allItems
          .filter(
            (i) =>
              getField(i, 'name').toLowerCase().includes(search.trim().toLowerCase()) &&
              !selected.includes(i.id),
          )
          .slice(0, 8)
      : []

  const add = (id: number) => {
    if (selected.length < MAX_COMPARE) {
      setSelected([...selected, id])
      setSearch('')
    }
  }
  const remove = (id: number) => setSelected(selected.filter((s) => s !== id))

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
          <GitCompare size={18} className="text-dark-gold" />
          {t('compare.title')}
        </h1>
        <p className="text-xs text-[#8a7a60] mt-1">{t('compare.subtitle')}</p>
      </div>

      {/* Qidirib qo'shish (limit MAX_COMPARE) */}
      {selected.length < MAX_COMPARE && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a60]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('compare.search')}
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
      )}

      {selected.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-lg py-12 text-center text-sm text-[#5a4e3a]">
          {t('compare.empty')}
        </div>
      ) : (
        <div className={`grid gap-3 ${selected.length === 1 ? 'sm:grid-cols-1' : selected.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
          {selected.map((id, idx) => {
            const item = itemOf(id)
            const res = rawResults[idx]
            const raw = res?.data
            return (
              <div key={id} className="bg-dark-card border border-dark-border rounded-lg overflow-hidden flex flex-col">
                {/* Sarlavha */}
                <div className="p-3 border-b border-dark-border flex items-center gap-2.5">
                  <ItemImageIcon imageUrl={item?.imageUrl} alt={item ? getField(item, 'name') : ''} size={32} fallbackColor={colorOf(item?.categoryCode)} />
                  <span className="flex-1 text-sm font-medium text-[#d4c4a0] truncate">
                    {item ? getField(item, 'name') : `#${id}`}
                  </span>
                  <button
                    onClick={() => remove(id)}
                    className="p-1 rounded text-[#8a7a60] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Qatorlar */}
                <div className="p-3 space-y-3 text-sm flex-1">
                  <div>
                    <div className="text-[10px] text-[#8a7a60] uppercase tracking-wider mb-1">{t('compare.category')}</div>
                    {item && <CategoryBadge code={item.categoryCode} />}
                  </div>

                  <div>
                    <div className="text-[10px] text-[#8a7a60] uppercase tracking-wider mb-1">{t('compare.craftTime')}</div>
                    <span className="flex items-center gap-1 text-[#d4c4a0]">
                      <Clock size={13} className="text-[#8a7a60]" />
                      <span className="font-mono">{item && item.craftTimeSeconds > 0 ? formatTime(item.craftTimeSeconds) : '—'}</span>
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] text-[#8a7a60] uppercase tracking-wider mb-1">
                      {t('compare.totalTime')}
                    </div>
                    <span className="font-mono text-[#d4c4a0]">
                      {res?.isLoading ? <Loader2 size={13} className="animate-spin inline" /> : raw ? formatTime(raw.totalCraftTimeSeconds) : '—'}
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] text-[#8a7a60] uppercase tracking-wider mb-1.5">
                      {t('compare.rawMaterials')}
                    </div>
                    {res?.isLoading ? (
                      <Loader2 size={14} className="animate-spin text-dark-gold" />
                    ) : !raw || raw.rawMaterials.length === 0 ? (
                      <span className="text-xs text-[#5a4e3a]">{t('compare.noRecipe')}</span>
                    ) : (
                      <div className="space-y-1.5">
                        {raw.rawMaterials.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 text-xs">
                            <ItemImageIcon imageUrl={m.imageUrl} alt={getField(m, 'name')} size={18} fallbackColor={colorOf(m.categoryCode)} />
                            <span className="flex-1 text-[#d4c4a0] truncate">{getField(m, 'name')}</span>
                            <span className="font-mono text-dark-gold shrink-0">{fmt(m.totalQuantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
