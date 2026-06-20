import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Wand2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useLocalizedField } from '../hooks/useLanguage'
import { useCategories } from '../hooks/useItems'
import { useCraftable } from '../hooks/useCraftable'
import { useContentWidth } from '../hooks/useContentWidth'
import { useGoBack } from '../hooks/useGoBack'
import MaterialPicker, { type PickedItem } from '../components/items/MaterialPicker'
import ItemImageIcon from '../components/ui/ItemImageIcon'
import Spinner from '../components/ui/Spinner'
import { DEFAULT_CATEGORY_COLOR } from '../utils/constants'
import type { CraftableItem } from '../api/craftable'

function fmt(n: number): string {
  return String(Math.round(n * 10000) / 10000)
}

export default function CraftableSearchPage() {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const goBack = useGoBack('/')
  const contentWidth = useContentWidth('max-w-4xl')
  const { data: categories } = useCategories()

  const [selected, setSelected] = useState<PickedItem[]>([])
  const materials = selected.map((s) => ({ itemId: s.id, quantity: s.quantity }))
  const { data, isLoading, isError } = useCraftable(materials)

  const colorOf = (code?: string) => categories?.find((c) => c.code === code)?.color || DEFAULT_CATEGORY_COLOR

  const fully = data?.filter((c) => c.fullyCraftable) ?? []
  const partial = data?.filter((c) => !c.fullyCraftable) ?? []

  const card = (c: CraftableItem) => (
    <div key={c.resultItemId} className="panel p-3">
      <div className="flex items-center gap-2.5">
        <ItemImageIcon imageUrl={c.imageUrl} alt={getField(c, 'resultItemName')} size={28} fallbackColor={colorOf(c.categoryCode)} />
        <span className="flex-1 text-sm text-skin-base truncate">{getField(c, 'resultItemName')}</span>
        {c.fullyCraftable && (
          <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">
            {t('craftable.canMake', { count: c.maxCraftable })}
          </span>
        )}
      </div>
      {!c.fullyCraftable && c.missing.length > 0 && (
        <div className="mt-2 pl-1 space-y-0.5">
          {c.missing.map((m) => (
            <div key={m.itemId} className="flex items-center gap-1.5 text-[11px]">
              <AlertCircle size={11} className="text-amber-400 shrink-0" />
              <span className="text-skin-base">{getField(m, 'name')}</span>
              <span className="text-skin-muted">— {t('craftable.needHave', { need: fmt(m.required), have: fmt(m.have) })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

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
        ) : fully.length === 0 && partial.length === 0 ? (
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
                <div className="grid sm:grid-cols-2 gap-2.5">{fully.map(card)}</div>
              </div>
            )}
            {partial.length > 0 && (
              <div className="space-y-2.5">
                <h2 className="text-sm font-medium text-skin-base flex items-center gap-1.5">
                  <AlertCircle size={15} className="text-amber-400" />
                  {t('craftable.almost')} <span className="text-skin-muted">({partial.length})</span>
                </h2>
                <div className="space-y-2.5">{partial.map(card)}</div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
