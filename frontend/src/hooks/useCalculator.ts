import { useQueries } from '@tanstack/react-query'
import { fetchRawTotals } from '../api/items'
import { useGameVersion } from '../contexts/GameVersionContext'
import { mergeRawTotals, type MergedRaw } from '../utils/mergeRawTotals'

export interface CalcItem {
  id: number
  quantity: number
}

export type { MergedRaw }

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

  const { rawMaterials, totalCraftTimeSeconds } = mergeRawTotals(
    results.map((r, idx) => ({ data: r.data, quantity: items[idx]?.quantity ?? 1 })),
  )

  return { rawMaterials, totalCraftTimeSeconds, isLoading, isError }
}
