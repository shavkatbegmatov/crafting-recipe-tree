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
  RAW: 'text-[#8a7a60]',
  MATERIAL: 'text-[#4a9a5a]',
  ITEM: 'text-[#6a8abc]',
  MODULE: 'text-[#c8a050]',
}

export default function HomePage() {
  const { data: items, isLoading } = useItems()
  const { data: categories } = useCategories()

  const stats = categories?.map((cat) => {
    const count = items?.filter((i) => i.categoryCode === cat.code).length ?? 0
    const Icon = STAT_ICONS[cat.code as keyof typeof STAT_ICONS] || Package
    const color = STAT_COLORS[cat.code as keyof typeof STAT_COLORS] || 'text-[#8a7a60]'
    return { ...cat, count, Icon, color }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#d4c4a0] mb-1">Kraft retseptlari</h1>
        <p className="text-sm text-[#8a7a60]">Barcha elementlar va ularning retseptlari</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.code} className="bg-dark-card border border-dark-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.Icon size={18} className={s.color} />
                <span className="text-xs text-[#8a7a60]">{s.nameUz}</span>
              </div>
              <span className="text-2xl font-bold font-mono text-[#d4c4a0]">{s.count}</span>
            </div>
          ))}
        </div>
      )}

      <ItemList items={items} isLoading={isLoading} />
    </div>
  )
}
