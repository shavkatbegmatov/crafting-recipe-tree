import { useItems, useCategories } from '../hooks/useItems'
import ItemList from '../components/items/ItemList'
import { Package, Layers, Cpu, Box } from 'lucide-react'

const STAT_ICONS = {
  RAW: Package,
  MATERIAL: Layers,
  ITEM: Box,
  MODULE: Cpu,
}

const STAT_COLORS = {
  RAW: 'text-gray-400',
  MATERIAL: 'text-emerald-400',
  ITEM: 'text-blue-400',
  MODULE: 'text-amber-400',
}

export default function HomePage() {
  const { data: items, isLoading } = useItems()
  const { data: categories } = useCategories()

  const stats = categories?.map((cat) => {
    const count = items?.filter((i) => i.categoryCode === cat.code).length ?? 0
    const Icon = STAT_ICONS[cat.code as keyof typeof STAT_ICONS] || Package
    const color = STAT_COLORS[cat.code as keyof typeof STAT_COLORS] || 'text-gray-400'
    return { ...cat, count, Icon, color }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100 mb-1">Kraft retseptlari</h1>
        <p className="text-sm text-gray-500">Barcha elementlar va ularning retseptlari</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.code} className="bg-dark-card border border-dark-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.Icon size={18} className={s.color} />
                <span className="text-xs text-gray-500">{s.nameUz}</span>
              </div>
              <span className="text-2xl font-bold font-mono text-gray-200">{s.count}</span>
            </div>
          ))}
        </div>
      )}

      <ItemList items={items} isLoading={isLoading} />
    </div>
  )
}
