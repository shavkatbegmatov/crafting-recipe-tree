import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Boxes, CheckCircle2, AlertCircle, Check, Loader2, LogIn } from 'lucide-react'
import { useLocalizedField } from '../hooks/useLanguage'
import { useCategories } from '../hooks/useItems'
import { useCraftable } from '../hooks/useCraftable'
import { useContentWidth } from '../hooks/useContentWidth'
import { useAuth } from '../contexts/AuthContext'
import { useInventory, useSaveInventory } from '../hooks/useInventory'
import MaterialPicker, { type PickedItem } from '../components/items/MaterialPicker'
import ItemImageIcon from '../components/ui/ItemImageIcon'
import Spinner from '../components/ui/Spinner'
import { DEFAULT_CATEGORY_COLOR } from '../utils/constants'
import type { CraftableItem } from '../api/craftable'

function fmt(n: number): string {
  return String(Math.round(n * 10000) / 10000)
}

export default function InventoryPage() {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { user } = useAuth()
  const contentWidth = useContentWidth('max-w-4xl')
  const { data: categories } = useCategories()
  const { data: inventory } = useInventory(!!user)
  const saveInv = useSaveInventory()

  const [selected, setSelected] = useState<PickedItem[]>([])
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
  const partial = data?.filter((c) => !c.fullyCraftable) ?? []

  if (!user) {
    return (
      <div className={`${contentWidth} text-center py-16`}>
        <Boxes size={32} className="mx-auto text-[#5a4e3a] mb-3" />
        <p className="text-sm text-[#8a7a60] mb-4">{t('inventory.loginRequired')}</p>
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

  const card = (c: CraftableItem) => (
    <div key={c.resultItemId} className="bg-dark-card border border-dark-border rounded-lg p-3">
      <div className="flex items-center gap-2.5">
        <ItemImageIcon imageUrl={c.imageUrl} alt={getField(c, 'resultItemName')} size={28} fallbackColor={colorOf(c.categoryCode)} />
        <span className="flex-1 text-sm text-[#d4c4a0] truncate">{getField(c, 'resultItemName')}</span>
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
              <span className="text-[#d4c4a0]">{getField(m, 'name')}</span>
              <span className="text-[#8a7a60]">— {t('craftable.needHave', { need: fmt(m.required), have: fmt(m.have) })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className={`space-y-5 ${contentWidth}`}>
      <div>
        <h1 className="text-xl font-semibold text-[#d4c4a0] flex items-center gap-2">
          <Boxes size={18} className="text-dark-gold" />
          {t('inventory.title')}
          {/* Saqlash indikatori */}
          {saveInv.isPending ? (
            <span className="flex items-center gap-1 text-[11px] font-normal text-[#8a7a60]">
              <Loader2 size={11} className="animate-spin" /> {t('inventory.saving')}
            </span>
          ) : loadedRef.current && saveInv.isSuccess ? (
            <span className="flex items-center gap-1 text-[11px] font-normal text-green-400/80">
              <Check size={11} /> {t('inventory.saved')}
            </span>
          ) : null}
        </h1>
        <p className="text-xs text-[#8a7a60] mt-1">{t('inventory.subtitle')}</p>
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
          <h2 className="text-sm font-medium text-[#d4c4a0] mb-3">{t('inventory.resultsTitle')}</h2>
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : isError ? (
            <div className="py-8 text-center text-sm text-red-400">{t('craftable.error')}</div>
          ) : fully.length === 0 && partial.length === 0 ? (
            <div className="bg-dark-card border border-dark-border rounded-lg py-10 text-center text-sm text-[#5a4e3a]">
              {t('craftable.noResults')}
            </div>
          ) : (
            <div className="space-y-5">
              {fully.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-medium text-[#d4c4a0] flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-green-400" />
                    {t('craftable.canCraft')} <span className="text-[#8a7a60]">({fully.length})</span>
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2.5">{fully.map(card)}</div>
                </div>
              )}
              {partial.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-medium text-[#d4c4a0] flex items-center gap-1.5">
                    <AlertCircle size={15} className="text-amber-400" />
                    {t('craftable.almost')} <span className="text-[#8a7a60]">({partial.length})</span>
                  </h3>
                  <div className="space-y-2.5">{partial.map(card)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
