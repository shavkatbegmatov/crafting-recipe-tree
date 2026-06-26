import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'
import { useLocalizedField } from '../../hooks/useLanguage'
import ItemImageIcon from '../ui/ItemImageIcon'
import type { CraftableItem } from '../../api/craftable'

function fmt(n: number): string {
  return String(Math.round(n * 10000) / 10000)
}

// Tayyorlik foiziga ko'ra rang (Bosqich 1 daraxt ranglariga mos: yetarli/qisman/yo'q)
function barColor(pct: number): string {
  if (pct >= 75) return '#4a9a5a'
  if (pct >= 40) return '#c8a050'
  return '#c2554a'
}

interface Props {
  item: CraftableItem
  categoryColor: string
}

/**
 * "Nima yasay olaman" natija kartasi — to'liq yasaladigan (yashil badge) yoki
 * qisman (tayyorlik progress bari + yetishmayotgan ingredientlar) ko'rinishida.
 * CraftableSearchPage va InventoryPage o'rtasida bo'lishiladi.
 */
export default function CraftableResultCard({ item: c, categoryColor }: Props) {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const pct = Math.round(c.completeness * 100)
  const color = barColor(pct)

  return (
    <div className="panel p-3">
      <div className="flex items-center gap-2.5">
        <ItemImageIcon
          imageUrl={c.imageUrl}
          alt={getField(c, 'resultItemName')}
          size={28}
          fallbackColor={categoryColor}
        />
        <span className="flex-1 text-sm text-skin-base truncate">{getField(c, 'resultItemName')}</span>
        {c.fullyCraftable ? (
          <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">
            {t('craftable.canMake', { count: c.maxCraftable })}
          </span>
        ) : (
          <span
            className="shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
          >
            {t('craftable.missingCount', { count: c.missingCount })}
          </span>
        )}
      </div>

      {!c.fullyCraftable && (
        <>
          {/* Tayyorlik progress bari */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-dark-bg/70 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-[11px] font-mono shrink-0" style={{ color }}>{pct}%</span>
          </div>
          {/* Yetishmayotgan ingredientlar */}
          {c.missing.length > 0 && (
            <div className="mt-2 pl-1 space-y-0.5">
              {c.missing.map((m) => (
                <div key={m.itemId} className="flex items-center gap-1.5 text-[11px]">
                  <AlertCircle size={11} className="text-amber-400 shrink-0" />
                  <span className="text-skin-base">{getField(m, 'name')}</span>
                  <span className="text-skin-muted">
                    — {t('craftable.needHave', { need: fmt(m.required), have: fmt(m.have) })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
