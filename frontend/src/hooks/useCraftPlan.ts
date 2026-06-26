import { useQuery } from '@tanstack/react-query'
import { fetchCraftPlan } from '../api/plan'
import { useGameVersion } from '../contexts/GameVersionContext'
import type { InventoryEntry } from '../api/inventory'

/**
 * Kraft rejasini hisoblaydi (qadamlar + shopping list + vaqt).
 * Inventar berilsa, shopping list undan ayiriladi.
 */
export function useCraftPlan(
  itemId: number,
  targetQuantity: number,
  inventory: InventoryEntry[],
  enabled = true,
) {
  const { effectiveVersion } = useGameVersion()
  return useQuery({
    queryKey: ['craftPlan', itemId, targetQuantity, inventory, effectiveVersion],
    queryFn: () => fetchCraftPlan(itemId, targetQuantity, inventory, effectiveVersion ?? undefined),
    enabled: enabled && itemId > 0 && targetQuantity > 0,
    staleTime: 30_000,
  })
}
