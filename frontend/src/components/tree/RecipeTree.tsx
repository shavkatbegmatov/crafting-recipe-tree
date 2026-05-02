import { useEffect, useState } from 'react'
import { useRecipeTree } from '../../hooks/useRecipeTree'
import { useTranslation } from 'react-i18next'
import TreeNode from './TreeNode'
import Spinner from '../ui/Spinner'
import { GitBranch } from 'lucide-react'

interface Props {
  itemId: number
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

export default function RecipeTree({ itemId }: Props) {
  const { t } = useTranslation()
  const { data: tree, isLoading, error } = useRecipeTree(itemId)
  const [defaultOpenDepth, setDefaultOpenDepth] = useState<number>(loadDepth)

  useEffect(() => {
    saveDepth(defaultOpenDepth)
  }, [defaultOpenDepth])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-[#8a7a60]">
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
    <div className="bg-dark-card border border-dark-border rounded-lg p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-sm font-semibold text-[#d4c4a0] flex items-center gap-2">
          <GitBranch size={16} className="text-[#8a7a60]" />
          {t('tree.title')}
        </h2>

        {!isRaw && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8a7a60]">{t('tree.openDepth')}:</span>
            <div className="flex items-center gap-1">
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
                    className={`min-w-7 h-7 px-2 rounded border font-mono transition-colors ${
                      active
                        ? 'bg-[#3a3a3f] border-[#8a7a60] text-[#d4c4a0]'
                        : 'bg-transparent border-dark-border text-[#8a7a60] hover:bg-dark-hover hover:text-[#d4c4a0]'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {isRaw ? (
        <p className="text-sm text-[#8a7a60]">{t('tree.rawNoRecipe')}</p>
      ) : (
        <div className="font-mono text-sm">
          <TreeNode
            key={defaultOpenDepth}
            node={tree}
            defaultOpenDepth={defaultOpenDepth}
          />
        </div>
      )}
    </div>
  )
}
