import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocalizedField } from '../hooks/useLanguage'
import { useItem, useUsedIn } from '../hooks/useItems'
import RecipeTree from '../components/tree/RecipeTree'
import RawTotals from '../components/tree/RawTotals'
import CategoryBadge from '../components/ui/CategoryBadge'
import Spinner from '../components/ui/Spinner'
import { ArrowLeft, ArrowRight, Clock, Beaker } from 'lucide-react'
import ImageUpload from '../components/items/ImageUpload'

export default function ItemDetailPage() {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { id } = useParams<{ id: string }>()
  const itemId = Number(id)
  const { data: item, isLoading, error } = useItem(itemId)
  const { data: usedIn } = useUsedIn(itemId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{t('detail.notFound')}</p>
        <Link to="/" className="text-dark-gold hover:underline text-sm flex items-center gap-1 justify-center">
          <ArrowLeft size={14} /> {t('detail.goHome')}
        </Link>
      </div>
    )
  }

  const itemName = getField(item, 'name')
  const itemDesc = getField(item, 'description')

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/" className="text-[#8a7a60] hover:text-[#d4c4a0] text-sm flex items-center gap-1 transition-colors">
        <ArrowLeft size={14} /> {t('detail.back')}
      </Link>

      {/* Item info */}
      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        {item.imageUrl && (
          <div className="bg-dark-panel flex items-center justify-center p-4 overflow-hidden">
            <img
              src={item.imageUrl}
              alt={itemName}
              className={item.imageUrl.endsWith('.png')
                ? 'w-16 h-16 object-contain'
                : 'max-w-md w-full h-auto rounded'
              }
            />
          </div>
        )}
        <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-xl font-semibold text-[#d4c4a0]">{itemName}</h1>
          <CategoryBadge code={item.categoryCode} size="md" />
        </div>

        {itemDesc && (
          <p className="text-sm text-[#8a7a60] mb-4">{itemDesc}</p>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {item.craftTimeSeconds > 0 && (
              <div className="flex items-center gap-1.5 text-[#8a7a60]">
                <Clock size={14} />
                <span>{t('detail.craftTime')}</span>
                <span className="font-mono text-[#d4c4a0]">{item.craftTimeSeconds}s</span>
              </div>
            )}
          </div>
          <ImageUpload itemId={itemId} />
        </div>

        {item.ingredients && item.ingredients.length > 0 && (
          <div className="mt-4 pt-4 border-t border-dark-border">
            <h3 className="text-xs font-medium text-[#8a7a60] mb-2 flex items-center gap-1.5">
              <Beaker size={13} />
              {t('detail.directIngredients')}
            </h3>
            <div className="space-y-1.5">
              {item.ingredients.map((ing) => (
                <div key={ing.ingredientItemId} className="flex items-center gap-2 text-sm">
                  <Link
                    to={`/items/${ing.ingredientItemId}`}
                    className="text-[#d4c4a0] hover:text-dark-gold hover:underline transition-colors"
                  >
                    {getField(ing, 'ingredientName')}
                  </Link>
                  <span className="text-[#3a3228]">—</span>
                  <span className="font-mono text-[#8a7a60]">
                    {ing.quantity % 1 === 0 ? ing.quantity : Number(ing.quantity).toFixed(4)}
                  </span>
                  <CategoryBadge code={ing.ingredientCategory} />
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Recipe tree */}
      {item.categoryCode !== 'RAW' && <RecipeTree itemId={itemId} />}

      {/* Raw totals */}
      {item.categoryCode !== 'RAW' && <RawTotals itemId={itemId} itemName={itemName} />}

      {/* Used in */}
      {usedIn && usedIn.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[#d4c4a0] mb-3 flex items-center gap-2">
            <ArrowRight size={16} className="text-[#8a7a60]" />
            {t('detail.usedIn')}
          </h2>
          <div className="space-y-1.5">
            {usedIn.map((u) => (
              <div key={u.itemId} className="flex items-center gap-2 text-sm">
                <Link
                  to={`/items/${u.itemId}`}
                  className="text-[#d4c4a0] hover:text-dark-gold hover:underline transition-colors"
                >
                  {getField(u, 'itemName')}
                </Link>
                <span className="font-mono text-[#8a7a60]">
                  x{u.quantity % 1 === 0 ? u.quantity : Number(u.quantity).toFixed(4)}
                </span>
                <CategoryBadge code={u.categoryCode} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
