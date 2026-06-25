import { useEffect, useMemo, useState } from 'react'
import { useRecipeTree } from '../../hooks/useRecipeTree'
import { useInventory } from '../../hooks/useInventory'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import TreeNode from './TreeNode'
import Spinner from '../ui/Spinner'
import QuantityInput from '../ui/QuantityInput'
import { GitBranch, Boxes } from 'lucide-react'

interface Props {
  itemId: number
  quantity?: number
  onQuantityChange?: (q: number) => void
}

const STORAGE_KEY = 'craftTree.defaultOpenDepth'
const DEPTH_OPTIONS: number[] = [1, 2, 3, 4, Infinity]
const DEFAULT_DEPTH = 2

function loadDepth(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === null) return DEFAULT_DEPTH
    if (v === 'all') return Infinity
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_DEPTH
  } catch {
    return DEFAULT_DEPTH
  }
}

function saveDepth(d: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, d === Infinity ? 'all' : String(d))
  } catch {
    // ignore quota / privacy-mode failures
  }
}

export default function RecipeTree({ itemId, quantity = 1, onQuantityChange }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: tree, isLoading, error } = useRecipeTree(itemId)
  const { data: inventory } = useInventory(!!user)
  const [defaultOpenDepth, setDefaultOpenDepth] = useState<number>(loadDepth)
  const [showInv, setShowInv] = useState(false)

  useEffect(() => {
    saveDepth(defaultOpenDepth)
  }, [defaultOpenDepth])

  // Inventarni tez qidiruv uchun Map'ga aylantiramiz (itemId -> miqdor)
  const inventoryMap = useMemo(() => {
    const m = new Map<number, number>()
    inventory?.forEach((e) => m.set(e.itemId, e.quantity))
    return m
  }, [inventory])

  const hasInventory = (inventory?.length ?? 0) > 0

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-skin-muted">
        <Spinner />
        <span className="text-sm">{t('tree.loading')}</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-400 text-sm py-4">{t('tree.error')}</div>
  }

  if (!tree) return null

  const isRaw = tree.category === 'RAW'

  return (
    <div className="panel p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-skin-base flex items-center gap-2 mb-3">
          <GitBranch size={16} className="text-skin-muted" />
          {t('tree.title')}
        </h2>

        {!isRaw && (
          <div className="flex items-center gap-x-3 gap-y-2 flex-wrap">
            {onQuantityChange && (
              <QuantityInput value={quantity} onChange={onQuantityChange} />
            )}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-skin-muted">{t('tree.openDepth')}:</span>
              <div className="flex items-center gap-0.5">
                {DEPTH_OPTIONS.map((opt) => {
                  const active = opt === defaultOpenDepth
                  const label = opt === Infinity ? '∞' : String(opt)
                  const title = opt === Infinity ? t('tree.expandAll') : undefined
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setDefaultOpenDepth(opt)}
                      aria-pressed={active}
                      title={title}
                      className={`min-w-6 h-7 px-1 rounded border font-mono transition-colors ${
                        active
                          ? 'bg-[#3a3a3f] border-[#8a7a60] text-skin-base'
                          : 'bg-transparent border-dark-border text-skin-muted hover:bg-dark-hover hover:text-skin-base'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Inventar bilan solishtirish — node'lar yashil/sariq/qizil rang oladi */}
            {hasInventory && (
              <button
                type="button"
                onClick={() => setShowInv((v) => !v)}
                aria-pressed={showInv}
                title={t('tree.compareInventoryHint')}
                className={`flex items-center gap-1 text-xs px-2 h-7 rounded border transition-colors ${
                  showInv
                    ? 'bg-dark-gold/20 text-dark-gold border-dark-gold/40 shadow-glow-gold-sm'
                    : 'text-skin-muted border-dark-border hover:text-skin-base hover:border-dark-border-hover'
                }`}
              >
                <Boxes size={13} />
                {t('tree.compareInventory')}
              </button>
            )}
          </div>
        )}

        {/* Rang izohi (legend) — inventar rejimida */}
        {!isRaw && showInv && (
          <div className="flex items-center gap-3 mt-2.5 text-[11px] text-skin-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4a9a5a' }} />
              {t('tree.invEnough')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c8a050' }} />
              {t('tree.invPartial')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c2554a' }} />
              {t('tree.invNone')}
            </span>
          </div>
        )}
      </div>

      {isRaw ? (
        <p className="text-sm text-skin-muted">{t('tree.rawNoRecipe')}</p>
      ) : (
        <div className="font-mono text-sm">
          <TreeNode
            key={`${defaultOpenDepth}-${showInv}`}
            node={tree}
            defaultOpenDepth={defaultOpenDepth}
            multiplier={quantity}
            inventory={showInv ? inventoryMap : undefined}
          />
        </div>
      )}
    </div>
  )
}
