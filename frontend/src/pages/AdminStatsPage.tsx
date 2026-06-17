import { useTranslation } from 'react-i18next'
import {
  BarChart3, Boxes, Layers, FileText, Tag, Users, Shield, ShieldAlert,
  Ban, MessageCircle, CalendarDays, Star, Package, Loader2, type LucideIcon,
} from 'lucide-react'
import { useAdminStats } from '../hooks/useAdminStats'
import { useCategories } from '../hooks/useItems'
import { useLocalizedField } from '../hooks/useLanguage'
import { useContentWidth } from '../hooks/useContentWidth'
import { DEFAULT_CATEGORY_COLOR } from '../utils/constants'

interface Stat {
  icon: LucideIcon
  label: string
  value: number
  accent?: boolean
}

function StatCard({ icon: Icon, label, value, accent }: Stat) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-3.5 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        accent ? 'bg-dark-gold/15 text-dark-gold' : 'bg-dark-hover text-[#8a7a60]'
      }`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold text-[#d4c4a0] leading-tight">{value}</div>
        <div className="text-[11px] text-[#8a7a60] truncate">{label}</div>
      </div>
    </div>
  )
}

export default function AdminStatsPage() {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const contentWidth = useContentWidth('max-w-5xl')
  const { data: stats, isLoading, isError } = useAdminStats()
  const { data: categories } = useCategories()

  if (isError) {
    return (
      <div className={`${contentWidth} py-16 text-center text-sm text-red-400`}>
        {t('common.loadFailed')}
      </div>
    )
  }
  if (isLoading || !stats) {
    return (
      <div className={`${contentWidth} py-16 text-center`}>
        <Loader2 size={20} className="animate-spin text-dark-gold mx-auto" />
      </div>
    )
  }

  const content: Stat[] = [
    { icon: Boxes, label: t('adminStats.items'), value: stats.totalItems, accent: true },
    { icon: Layers, label: t('adminStats.categories'), value: stats.totalCategories },
    { icon: FileText, label: t('adminStats.recipes'), value: stats.totalRecipes },
    { icon: Tag, label: t('adminStats.tags'), value: stats.totalTags },
  ]
  const users: Stat[] = [
    { icon: Users, label: t('adminStats.users'), value: stats.totalUsers, accent: true },
    { icon: Shield, label: t('adminStats.admins'), value: stats.admins },
    { icon: ShieldAlert, label: t('adminStats.superAdmins'), value: stats.superAdmins },
    { icon: Ban, label: t('adminStats.blocked'), value: stats.blockedUsers },
  ]
  const activity: Stat[] = [
    { icon: MessageCircle, label: t('adminStats.messages'), value: stats.totalMessages, accent: true },
    { icon: CalendarDays, label: t('adminStats.today'), value: stats.todayMessages },
    { icon: Star, label: t('adminStats.favorites'), value: stats.totalFavorites },
    { icon: Package, label: t('adminStats.inventory'), value: stats.inventoryEntries },
  ]

  const maxCount = Math.max(1, ...stats.itemsByCategory.map((c) => c.count))

  const group = (title: string, items: Stat[]) => (
    <div className="space-y-2">
      <h2 className="text-[11px] font-medium text-[#8a7a60] uppercase tracking-wider">{title}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {items.map((s) => <StatCard key={s.label} {...s} />)}
      </div>
    </div>
  )

  return (
    <div className={`space-y-6 ${contentWidth}`}>
      <div>
        <h1 className="text-xl font-semibold text-[#d4c4a0] flex items-center gap-2">
          <BarChart3 size={18} className="text-dark-gold" />
          {t('adminStats.title')}
        </h1>
        <p className="text-xs text-[#8a7a60] mt-1">{t('adminStats.subtitle')}</p>
      </div>

      {group(t('adminStats.groupContent'), content)}
      {group(t('adminStats.groupUsers'), users)}
      {group(t('adminStats.groupActivity'), activity)}

      {/* Kategoriya bo'yicha itemlar — gorizontal bar chart */}
      {stats.itemsByCategory.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[11px] font-medium text-[#8a7a60] uppercase tracking-wider">
            {t('adminStats.byCategory')}
          </h2>
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 space-y-2.5">
            {stats.itemsByCategory.map((c) => {
              const cat = categories?.find((x) => x.code === c.code)
              const color = cat?.color || DEFAULT_CATEGORY_COLOR
              const name = cat ? getField(cat, 'name') : c.code
              const pct = Math.round((c.count / maxCount) * 100)
              return (
                <div key={c.code} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-[#d4c4a0] truncate shrink-0">{name}</span>
                  <div className="flex-1 h-5 bg-dark-bg rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all flex items-center justify-end px-2"
                      style={{ width: `${Math.max(pct, 6)}%`, backgroundColor: `${color}40`, borderRight: `2px solid ${color}` }}
                    >
                      <span className="text-[10px] font-mono text-[#d4c4a0]">{c.count}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
