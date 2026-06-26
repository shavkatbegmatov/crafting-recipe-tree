import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Wand2, CheckCircle2, AlertCircle, Filter } from 'lucide-react'
import { useCategories } from '../hooks/useItems'
import { useCraftable } from '../hooks/useCraftable'
import { useContentWidth } from '../hooks/useContentWidth'
import { useGoBack } from '../hooks/useGoBack'
import MaterialPicker, { type PickedItem } from '../components/items/MaterialPicker'
import CraftableResultCard from '../components/items/CraftableResultCard'
import Spinner from '../components/ui/Spinner'
import { DEFAULT_CATEGORY_COLOR } from '../utils/constants'

export default function CraftableSearchPage() {
  const { t } = useTranslation()
  const goBack = useGoBack('/')
  const contentWidth = useContentWidth('max-w-4xl')
  const { data: categories } = useCategories()

  const [selected, setSelected] = useState<PickedItem[]>([])
  const [almostOnly, setAlmostOnly] = useState(false)
  const materials = selected.map((s) => ({ itemId: s.id, quantity: s.quantity }))
  const { data, isLoading, isError } = useCraftable(materials)

  const colorOf = (code?: string) => categories?.find((c) => c.code === code)?.color || DEFAULT_CATEGORY_COLOR
  const fully = data?.filter((c) => c.fullyCraftable) ?? []
  const partialAll = data?.filter((c) => !c.fullyCraftable) ?? []
  // "Deyarli" filtri: faqat 1-2 ta resurs yetishmayotganlar (backend completeness bo'yicha saralangan)
  const partial = almostOnly ? partialAll.filter((c) => c.missingCount <= 2) : partialAll

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
        <h1 className="text-xl font-display tracking-wide text-skin-base flex items-center gap-2">
          <Wand2 size={18} className="text-dark-gold" />
          {t('craftable.title')}
        </h1>
        <p className="text-xs text-skin-muted mt-1">{t('craftable.subtitle')}</p>
      </div>

      <MaterialPicker
        selected={selected}
        onChange={setSelected}
        searchPlaceholder={t('craftable.search')}
        emptyHint={t('craftable.empty')}
        targetsLabel={t('craftable.inventory')}
      />

      {selected.length > 0 && (
        isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : isError ? (
          <div className="py-8 text-center text-sm text-red-400">{t('craftable.error')}</div>
        ) : fully.length === 0 && partialAll.length === 0 ? (
          <div className="panel py-10 text-center text-sm text-skin-dark">
            {t('craftable.noResults')}
          </div>
        ) : (
          <div className="space-y-5">
            {fully.length > 0 && (
              <div className="space-y-2.5">
                <h2 className="text-sm font-medium text-skin-base flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-green-400" />
                  {t('craftable.canCraft')} <span className="text-skin-muted">({fully.length})</span>
                </h2>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {fully.map((c) => (
                    <CraftableResultCard key={c.resultItemId} item={c} categoryColor={colorOf(c.categoryCode)} />
                  ))}
                </div>
              </div>
            )}
            {partialAll.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-medium text-skin-base flex items-center gap-1.5">
                    <AlertCircle size={15} className="text-amber-400" />
                    {t('craftable.almost')} <span className="text-skin-muted">({partial.length})</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setAlmostOnly((v) => !v)}
                    aria-pressed={almostOnly}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      almostOnly
                        ? 'bg-dark-gold/20 text-dark-gold border-dark-gold/40'
                        : 'text-skin-muted border-dark-border hover:text-skin-base hover:border-dark-border-hover'
                    }`}
                  >
                    <Filter size={11} /> {t('craftable.almostOnly')}
                  </button>
                </div>
                {partial.length === 0 ? (
                  <p className="text-xs text-skin-dark py-3 text-center">{t('craftable.almostNone')}</p>
                ) : (
                  <div className="space-y-2.5">
                    {partial.map((c) => (
                      <CraftableResultCard key={c.resultItemId} item={c} categoryColor={colorOf(c.categoryCode)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
