import type { CategoryCode } from '../api/types'

export const CATEGORY_COLORS: Record<CategoryCode, string> = {
  RAW: '#6B7280',
  MATERIAL: '#10B981',
  ITEM: '#3B82F6',
  MODULE: '#F59E0B',
}

export const CATEGORY_BG: Record<CategoryCode, string> = {
  RAW: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  MATERIAL: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  ITEM: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  MODULE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
}

export const CATEGORY_DOT: Record<CategoryCode, string> = {
  RAW: 'bg-gray-500',
  MATERIAL: 'bg-emerald-500',
  ITEM: 'bg-blue-500',
  MODULE: 'bg-amber-500',
}

export const CATEGORY_LABELS: Record<CategoryCode, string> = {
  RAW: 'Xomashyo',
  MATERIAL: 'Material',
  ITEM: 'Predmet',
  MODULE: 'Modul',
}
