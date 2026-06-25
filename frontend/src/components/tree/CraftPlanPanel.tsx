import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ListChecks, ShoppingCart, Clock, Zap, Check, Hammer, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useInventory } from '../../hooks/useInventory'
import { useCraftPlan } from '../../hooks/useCraftPlan'
import { useCraftBulk } from '../../hooks/useCraft'
import { useLocalizedField } from '../../hooks/useLanguage'
import { useCategories } from '../../hooks/useItems'
import { formatTime } from '../../utils/formatTime'
import { DEFAULT_CATEGORY_COLOR } from '../../utils/constants'
import QuantityInput from '../ui/QuantityInput'
import ItemImageIcon from '../ui/ItemImageIcon'
import Spinner from '../ui/Spinner'

interface Props {
  itemId: number
  isRaw?: boolean
}

const fmt = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(2))

/**
 * Kraft rejasi paneli: maqsad miqdori + qadam-baqadam tartib + inventar-aware shopping list +
 * vaqt. Login bo'lsa "Yasash" tugmasi inventardan xomashyo ayiradi va tarixga yozadi.
 */
export default function CraftPlanPanel({ itemId, isRaw }: Props) {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { user } = useAuth()
  const { data: categories } = useCategories()
  const { data: inventory } = useInventory(!!user)
  const [qty, setQty] = useState(1)
  const invEntries = inventory ?? []
  const { data: plan, isLoading } = useCraftPlan(itemId, qty, invEntries, !isRaw)
  const craft = useCraftBulk()
  const colorOf = (code?: string) => categories?.find((c) => c.code === code)?.color || DEFAULT_CATEGORY_COLOR

  if (isRaw) return null // xomashyoda reja yo'q

  const result = craft.data

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-skin-base flex items-center gap-2">
          <ListChecks size={16} className="text-dark-gold" />
          {t('plan.title')}
        </h2>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-skin-muted">{t('plan.targetQty')}:</span>
          <QuantityInput value={qty} onChange={setQty} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : !plan ? null : plan.steps.length === 0 ? (
        <p className="text-sm text-skin-muted">{t('plan.noSteps')}</p>
      ) : (
        <>
          {/* Vaqt xulosasi */}
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span className="flex items-center gap-1 text-skin-muted">
              <Clock size={13} className="text-dark-gold/70" />
              <span className="font-mono text-skin-base">{formatTime(plan.totalTimeSeconds)}</span> {t('plan.sequential')}
            </span>
            <span className="flex items-center gap-1 text-skin-muted">
              <Zap size={13} className="text-dark-gold/70" />
              <span className="font-mono text-skin-base">{formatTime(plan.parallelTimeSeconds)}</span> {t('plan.parallel')}
            </span>
          </div>

          {/* Qadamlar */}
          <div>
            <h3 className="text-xs font-medium text-skin-muted mb-2 flex items-center gap-1.5">
              <ListChecks size={13} /> {t('plan.steps')}
              <span className="text-skin-dark">({plan.steps.length})</span>
            </h3>
            <div className="space-y-1.5">
              {plan.steps.map((s) => (
                <div key={s.itemId} className="flex items-center gap-2.5 py-1.5 px-2 rounded-md bg-dark-bg/40">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-dark-gold/15 text-dark-gold text-[11px] font-mono flex items-center justify-center">
                    {s.stepNumber}
                  </span>
                  <ItemImageIcon imageUrl={s.imageUrl} alt={getField(s, 'name')} size={20} fallbackColor={colorOf(s.categoryCode)} />
                  <Link
                    to={`/items/${s.itemId}`}
                    className="flex-1 text-sm text-skin-base hover:text-skin-accent truncate transition-colors"
                  >
                    {getField(s, 'name')}
                  </Link>
                  <span className="text-xs font-mono text-skin-muted shrink-0">×{fmt(s.quantity)}</span>
                  {s.timeSeconds > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-skin-dark shrink-0">
                      <Clock size={11} /> <span className="font-mono">{formatTime(s.timeSeconds)}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sotib olish ro'yxati (inventardan ayirilgan) */}
          {plan.shoppingList.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-skin-muted mb-2 flex items-center gap-1.5">
                <ShoppingCart size={13} /> {t('plan.shopping')}
                {!user && <span className="text-skin-dark font-normal">— {t('plan.loginForInventory')}</span>}
              </h3>
              <div className="space-y-1">
                {plan.shoppingList.map((sh) => {
                  const enough = sh.toProcure <= 0
                  return (
                    <div key={sh.itemId} className="flex items-center gap-2.5 py-1 px-2 text-sm">
                      <ItemImageIcon imageUrl={sh.imageUrl} alt={getField(sh, 'name')} size={18} fallbackColor={colorOf(sh.categoryCode)} />
                      <Link
                        to={`/items/${sh.itemId}`}
                        className="flex-1 text-skin-base hover:text-skin-accent truncate transition-colors"
                      >
                        {getField(sh, 'name')}
                      </Link>
                      {enough ? (
                        <span className="flex items-center gap-1 text-[11px] text-green-400 shrink-0">
                          <Check size={12} /> {t('plan.have')}
                        </span>
                      ) : (
                        <span className="text-xs font-mono shrink-0" style={{ color: '#c8a050' }}>
                          {fmt(sh.toProcure)}
                          {user && sh.have > 0 && (
                            <span className="text-skin-dark"> ({fmt(sh.have)}/{fmt(sh.needed)})</span>
                          )}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bulk craft — login bo'lsa: inventardan ayirib yasaydi, tarixga yozadi */}
          {user && (
            <div className="pt-3 border-t border-dark-border space-y-2">
              <button
                type="button"
                onClick={() => craft.mutate({ itemId, quantity: qty })}
                disabled={craft.isPending}
                className="btn-base btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {craft.isPending ? <Loader2 size={15} className="animate-spin" /> : <Hammer size={15} />}
                {t('plan.craftNow', { count: qty })}
              </button>

              {result && result.success && (
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <Check size={13} /> {t('plan.craftDone', { count: qty })}
                </div>
              )}
              {result && !result.success && result.missing && result.missing.length > 0 && (
                <div className="text-xs text-red-400">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={13} /> {t('plan.craftMissing')}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 pl-5 text-skin-muted">
                    {result.missing.map((m) => (
                      <span key={m.itemId}>
                        {getField(m, 'name')} <span className="font-mono text-red-400/80">({m.have}/{m.needed})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
