import type { CategoryCode } from '../api/types'

export const CATEGORY_COLORS: Record<CategoryCode, string> = {
  RAW: '#8a7a60',
  MATERIAL: '#4a9a5a',
  ITEM: '#6a8abc',
  MODULE: '#c8a050',
}

export const CATEGORY_BG: Record<CategoryCode, string> = {
  RAW: 'bg-[#8a7a60]/10 text-[#8a7a60] border-[#8a7a60]/30',
  MATERIAL: 'bg-[#4a9a5a]/10 text-[#4a9a5a] border-[#4a9a5a]/30',
  ITEM: 'bg-[#6a8abc]/10 text-[#6a8abc] border-[#6a8abc]/30',
  MODULE: 'bg-[#c8a050]/10 text-[#c8a050] border-[#c8a050]/30',
}

export const CATEGORY_DOT: Record<CategoryCode, string> = {
  RAW: 'bg-[#8a7a60]',
  MATERIAL: 'bg-[#4a9a5a]',
  ITEM: 'bg-[#6a8abc]',
  MODULE: 'bg-[#c8a050]',
}

export const CATEGORY_LABELS: Record<CategoryCode, string> = {
  RAW: 'Xomashyo',
  MATERIAL: 'Material',
  ITEM: 'Predmet',
  MODULE: 'Modul',
}
