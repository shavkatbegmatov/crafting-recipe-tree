import { useTranslation } from 'react-i18next'
import { useCategories } from '../../hooks/useItems'
import { DEFAULT_CATEGORY_COLOR } from '../../utils/constants'

interface Props {
  code: string
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ code, size = 'sm' }: Props) {
  const { t } = useTranslation()
  const { data: categories } = useCategories()
  const category = categories?.find((c) => c.code === code)
  const color = category?.color || DEFAULT_CATEGORY_COLOR
  const label = t(`categories.${code}`, { defaultValue: code })
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center rounded border font-medium ${sizeClass}`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}40`,
      }}
    >
      {label}
    </span>
  )
}
