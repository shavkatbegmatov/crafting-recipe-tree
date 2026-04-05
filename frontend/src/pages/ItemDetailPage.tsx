import { useParams, Link } from 'react-router-dom'
import { useItem, useUsedIn } from '../hooks/useItems'
import RecipeTree from '../components/tree/RecipeTree'
import RawTotals from '../components/tree/RawTotals'
import CategoryBadge from '../components/ui/CategoryBadge'
import CraftTimeBadge from '../components/tree/CraftTimeBadge'
import Spinner from '../components/ui/Spinner'
import { ArrowLeft, ArrowRight, Clock, Beaker } from 'lucide-react'

export default function ItemDetailPage() {
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
        <p className="text-red-400 mb-4">Element topilmadi</p>
        <Link to="/" className="text-blue-400 hover:underline text-sm flex items-center gap-1 justify-center">
          <ArrowLeft size={14} /> Bosh sahifaga qaytish
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 transition-colors">
        <ArrowLeft size={14} /> Orqaga
      </Link>

      {/* Item info */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-xl font-semibold text-gray-100">{item.name}</h1>
          <CategoryBadge code={item.categoryCode} size="md" />
        </div>

        {item.description && (
          <p className="text-sm text-gray-400 mb-4">{item.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm">
          {item.craftTimeSeconds > 0 && (
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock size={14} />
              <span>Kraft vaqti:</span>
              <span className="font-mono text-gray-300">{item.craftTimeSeconds}s</span>
            </div>
          )}
        </div>

        {item.ingredients && item.ingredients.length > 0 && (
          <div className="mt-4 pt-4 border-t border-dark-border">
            <h3 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
              <Beaker size={13} />
              Bevosita ingredientlar
            </h3>
            <div className="space-y-1.5">
              {item.ingredients.map((ing) => (
                <div key={ing.ingredientItemId} className="flex items-center gap-2 text-sm">
                  <Link
                    to={`/items/${ing.ingredientItemId}`}
                    className="text-gray-300 hover:text-white hover:underline transition-colors"
                  >
                    {ing.ingredientName}
                  </Link>
                  <span className="text-gray-600">—</span>
                  <span className="font-mono text-gray-500">
                    {ing.quantity % 1 === 0 ? ing.quantity : Number(ing.quantity).toFixed(4)}
                  </span>
                  <CategoryBadge code={ing.ingredientCategory} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recipe tree */}
      {item.categoryCode !== 'RAW' && <RecipeTree itemId={itemId} />}

      {/* Raw totals */}
      {item.categoryCode !== 'RAW' && <RawTotals itemId={itemId} itemName={item.name} />}

      {/* Used in */}
      {usedIn && usedIn.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <ArrowRight size={16} className="text-gray-500" />
            Qayerda ishlatiladi
          </h2>
          <div className="space-y-1.5">
            {usedIn.map((u) => (
              <div key={u.itemId} className="flex items-center gap-2 text-sm">
                <Link
                  to={`/items/${u.itemId}`}
                  className="text-gray-300 hover:text-white hover:underline transition-colors"
                >
                  {u.itemName}
                </Link>
                <span className="font-mono text-gray-500">
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
