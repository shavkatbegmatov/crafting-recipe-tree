import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { History, ChevronRight, ChevronDown, Star, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRecipeHistory } from '../../hooks/useRecipes'
import { useCategories } from '../../hooks/useItems'
import { useGameVersion } from '../../contexts/GameVersionContext'
import { useLocalizedField } from '../../hooks/useLanguage'
import ItemImageIcon from '../ui/ItemImageIcon'
import { DEFAULT_CATEGORY_COLOR } from '../../utils/constants'
import { formatTime } from '../../utils/formatTime'

interface Props {
  itemId: number
}

export default function RecipeHistorySection({ itemId }: Props) {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { effectiveVersion, setSelectedVersion } = useGameVersion()
  const { data: history, isLoading } = useRecipeHistory(itemId)
  const { data: categories } = useCategories()
  const [openIds, setOpenIds] = useState<Record<number, boolean>>({})

  if (isLoading) return null
  if (!history || history.length === 0) return null

  const colorFor = (code: string) =>
    categories?.find((c) => c.code === code)?.color || DEFAULT_CATEGORY_COLOR

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-5">
      <h2 className="text-sm font-semibold text-[#d4c4a0] mb-4 flex items-center gap-2">
        <History size={16} className="text-[#8a7a60]" />
        {t('gameVersion.history')}
      </h2>

      <div className="space-y-2">
        {history.map((r) => {
          const isOpen = openIds[r.id] ?? r.gameVersion === effectiveVersion
          const isActive = r.gameVersion === effectiveVersion
          return (
            <div
              key={r.id}
              className={`border rounded-lg overflow-hidden ${
                isActive ? 'border-dark-gold/50 bg-dark-gold/5' : 'border-dark-border bg-dark-bg/30'
              }`}
            >
              <button
                onClick={() => setOpenIds((prev) => ({ ...prev, [r.id]: !isOpen }))}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-dark-hover/50 transition-colors text-left"
              >
                {isOpen ? <ChevronDown size={14} className="text-[#8a7a60]" /> : <ChevronRight size={14} className="text-[#8a7a60]" />}
                <span className="font-mono text-[#d4c4a0]">{r.gameVersion}</span>
                <span className="text-xs text-[#5a4e3a]">·</span>
                <span className="text-xs text-[#8a7a60] flex items-center gap-1">
                  <Clock size={11} />
                  {formatTime(r.craftTimeSeconds)}
                </span>
                {r.notes && (
                  <span className="text-xs text-[#5a4e3a] italic truncate max-w-[18rem]">
                    {r.notes}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-gold/20 text-dark-gold border border-dark-gold/30">
                      {t('gameVersion.current')}
                    </span>
                  )}
                  {!isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedVersion(r.gameVersion)
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded text-[#8a7a60] hover:text-dark-gold hover:bg-dark-gold/10 transition-colors flex items-center gap-1"
                      title={t('gameVersion.viewThisVersion')}
                    >
                      <Star size={10} />
                      {t('gameVersion.view')}
                    </button>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pt-1 border-t border-dark-border/50">
                  {r.ingredients.length === 0 ? (
                    <p className="text-xs text-[#5a4e3a] py-1">{t('gameVersion.noRecipes')}</p>
                  ) : (
                    <div className="space-y-1">
                      {r.ingredients.map((ing) => {
                        const color = colorFor(ing.ingredientCategory)
                        const ingName = getField(ing, 'ingredientName')
                        return (
                          <div key={ing.ingredientItemId} className="flex items-center gap-2 text-sm">
                            <ItemImageIcon
                              imageUrl={ing.ingredientImageUrl}
                              alt={ingName}
                              size={20}
                              fallbackColor={color}
                            />
                            <Link
                              to={`/items/${ing.ingredientItemId}`}
                              className="hover:underline transition-colors"
                              style={{ color }}
                            >
                              {ingName}
                            </Link>
                            <span className="text-[#3a3228]">—</span>
                            <span className="font-mono text-[#8a7a60]">
                              {ing.quantity % 1 === 0 ? ing.quantity : Number(ing.quantity).toFixed(4)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
