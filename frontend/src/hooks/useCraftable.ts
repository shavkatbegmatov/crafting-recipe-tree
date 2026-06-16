import { useQuery } from '@tanstack/react-query'
import { searchCraftable, type MaterialEntry } from '../api/craftable'
import { useGameVersion } from '../contexts/GameVersionContext'

/**
 * Foydalanuvchi materiallaridan nima yasash mumkinligini qidiradi.
 * Materiallar o'zgarganda avtomatik qayta hisoblaydi (real-vaqt).
 */
export function useCraftable(materials: MaterialEntry[]) {
  const { effectiveVersion } = useGameVersion()
  return useQuery({
    queryKey: ['craftable', materials, effectiveVersion],
    queryFn: () => searchCraftable(materials, effectiveVersion ?? undefined),
    enabled: materials.length > 0,
    staleTime: 30_000,
  })
}
