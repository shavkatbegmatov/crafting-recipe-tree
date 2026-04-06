import { useItems, useCategories } from '../hooks/useItems'
import { useTranslation } from 'react-i18next'
import { useLocalizedField } from '../hooks/useLanguage'
import ItemList from '../components/items/ItemList'
import { Package, Layers, Cpu, Box, Gem, Zap, Wrench, FlaskConical } from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Package, Layers, Cpu, Box, Gem, Zap, Wrench, FlaskConical,
}

export default function HomePage() {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { data: items, isLoading } = useItems()
  const { data: categories } = useCategories()

  const stats = categories?.map((cat) => {
    const count = items?.filter((i) => i.categoryCode === cat.code).length ?? 0
    const Icon = ICON_MAP[cat.icon] || Package
    return { ...cat, count, Icon }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#d4c4a0] mb-1">{t('home.title')}</h1>
        <p className="text-sm text-[#8a7a60]">{t('home.subtitle')}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.code} className="bg-dark-card border border-dark-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.Icon size={18} style={{ color: s.color }} />
                <span className="text-xs text-[#8a7a60]">{getField(s, 'name')}</span>
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
