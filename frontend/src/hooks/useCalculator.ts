import { useQueries } from '@tanstack/react-query'
import { fetchRawTotals } from '../api/items'
import { useGameVersion } from '../contexts/GameVersionContext'
import type { RawMaterialEntry } from '../api/types'

export interface CalcItem {
  id: number
  quantity: number
}

export interface MergedRaw extends RawMaterialEntry {
  totalQuantity: number
}

export interface CalcResult {
  rawMaterials: MergedRaw[]
  totalCraftTimeSeconds: number
  isLoading: boolean
  isError: boolean
}

/**
 * Bir nechta maqsad item uchun jami (birlashtirilgan) xomashyo va vaqtni hisoblaydi.
 * Mavjud bitta-item {@code /raw-totals} endpoint'ini har bir item uchun chaqiradi
 * (React Query har birini alohida keshlaydi), so'ng itemId bo'yicha qo'shadi.
 */
export function useCalculator(items: CalcItem[]): CalcResult {
  const { effectiveVersion } = useGameVersion()

  const results = useQueries({
    queries: items.map((it) => ({
      queryKey: ['rawTotals', it.id, effectiveVersion],
      queryFn: () => fetchRawTotals(it.id, effectiveVersion ?? undefined),
      enabled: it.id > 0,
      staleTime: 60_000,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const isError = results.some((r) => r.isError)

  const rawMap = new Map<number, MergedRaw>()
  let totalCraftTimeSeconds = 0

  results.forEach((r, idx) => {
    if (!r.data) return
    const qty = items[idx]?.quantity ?? 1
    totalCraftTimeSeconds += r.data.totalCraftTimeSeconds * qty
    for (const mat of r.data.rawMaterials) {
      const add = Number(mat.totalQuantity) * qty
      const existing = rawMap.get(mat.id)
      if (existing) {
        existing.totalQuantity += add
      } else {
        rawMap.set(mat.id, { ...mat, totalQuantity: add })
      }
    }
  })

  const rawMaterials = Array.from(rawMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity)
  return { rawMaterials, totalCraftTimeSeconds, isLoading, isError }
}
