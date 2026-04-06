import { useTranslation } from 'react-i18next'
import type { CategoryCode } from '../../api/types'
import { CATEGORY_BG } from '../../utils/constants'

interface Props {
  code: string
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ code, size = 'sm' }: Props) {
  const { t } = useTranslation()
  const bg = CATEGORY_BG[code as CategoryCode] || CATEGORY_BG.RAW
  const label = t(`categories.${code}`, code)
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center rounded border font-medium ${bg} ${sizeClass}`}>
      {label}
    </span>
  )
}
