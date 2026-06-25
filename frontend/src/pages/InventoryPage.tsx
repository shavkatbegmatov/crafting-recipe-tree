import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Boxes, CheckCircle2, AlertCircle, Check, Loader2, LogIn, ArrowLeft, Filter } from 'lucide-react'
import { useCategories } from '../hooks/useItems'
import { useCraftable } from '../hooks/useCraftable'
import { useContentWidth } from '../hooks/useContentWidth'
import { useGoBack } from '../hooks/useGoBack'
import { useAuth } from '../contexts/AuthContext'
import { useInventory, useSaveInventory } from '../hooks/useInventory'
import MaterialPicker, { type PickedItem } from '../components/items/MaterialPicker'
import CraftableResultCard from '../components/items/CraftableResultCard'
import Spinner from '../components/ui/Spinner'
import { DEFAULT_CATEGORY_COLOR } from '../utils/constants'

export default function InventoryPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const contentWidth = useContentWidth('max-w-4xl')
  const goBack = useGoBack('/')
  const { data: categories } = useCategories()
  const { data: inventory } = useInventory(!!user)
  const saveInv = useSaveInventory()

  const [selected, setSelected] = useState<PickedItem[]>([])
  const [almostOnly, setAlmostOnly] = useState(false)
  const loadedRef = useRef(false)

  // Saqlangan inventarni bir marta local holatga ko'chiramiz.
  useEffect(() => {
    if (inventory && !loadedRef.current) {
      setSelected(inventory.map((e) => ({ id: e.itemId, quantity: e.quantity })))
      loadedRef.current = true
    }
  }, [inventory])

  // O'zgarishlarni debounce bilan avtomatik saqlaymiz (boshlang'ich yuklashdan keyin).
  useEffect(() => {
    if (!user || !loadedRef.current) return
    const handle = setTimeout(() => {
      saveInv.mutate(selected.map((s) => ({ itemId: s.id, quantity: s.quantity })))
    }, 700)
    return () => clearTimeout(handle)
    // saveInv barqaror; faqat selected o'zgarishi saqlashni boshlaydi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, user])

  const materials = selected.map((s) => ({ itemId: s.id, quantity: s.quantity }))
  const { data, isLoading, isError } = useCraftable(materials)

  const colorOf = (code?: string) => categories?.find((c) => c.code === code)?.color || DEFAULT_CATEGORY_COLOR
  const fully = data?.filter((c) => c.fullyCraftable) ?? []
  const partialAll = data?.filter((c) => !c.fullyCraftable) ?? []
  const partial = almostOnly ? partialAll.filter((c) => c.missingCount <= 2) : partialAll

  if (!user) {
    return (
      <div className={`${contentWidth} text-center py-16`}>
        <Boxes size={32} className="mx-auto text-skin-dark mb-3" />
        <p className="text-sm text-skin-muted mb-4">{t('inventory.loginRequired')}</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
            bg-dark-gold/15 text-dark-gold border border-dark-gold/30 hover:bg-dark-gold/25 transition-colors"
        >
          <LogIn size={13} /> {t('auth.login')}
        </Link>
      </div>
    )
  }

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
          <Boxes size={18} className="text-dark-gold" />
          {t('inventory.title')}
          {/* Saqlash indikatori */}
          {saveInv.isPending ? (
            <span className="flex items-center gap-1 text-[11px] font-normal text-skin-muted">
              <Loader2 size={11} className="animate-spin" /> {t('inventory.saving')}
            </span>
          ) : loadedRef.current && saveInv.isSuccess ? (
            <span className="flex items-center gap-1 text-[11px] font-normal text-green-400/80">
              <Check size={11} /> {t('inventory.saved')}
            </span>
          ) : null}
        </h1>
        <p className="text-xs text-skin-muted mt-1">{t('inventory.subtitle')}</p>
      </div>

      <MaterialPicker
        selected={selected}
        onChange={setSelected}
        searchPlaceholder={t('inventory.search')}
        emptyHint={t('inventory.empty')}
        targetsLabel={t('craftable.inventory')}
      />

      {selected.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-skin-base mb-3">{t('inventory.resultsTitle')}</h2>
          {isLoading ? (
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
                  <h3 className="text-sm font-medium text-skin-base flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-green-400" />
                    {t('craftable.canCraft')} <span className="text-skin-muted">({fully.length})</span>
                  </h3>
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
                    <h3 className="text-sm font-medium text-skin-base flex items-center gap-1.5">
                      <AlertCircle size={15} className="text-amber-400" />
                      {t('craftable.almost')} <span className="text-skin-muted">({partial.length})</span>
                    </h3>
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
          )}
        </div>
      )}
    </div>
  )
}
