import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { craftBulk, fetchCraftHistory, type CraftResult } from '../api/craft'
import { useGameVersion } from '../contexts/GameVersionContext'

/**
 * Bulk craft mutatsiyasi. Muvaffaqiyatda inventar keshini server javobi bilan yangilaydi
 * va bog'liq querylarni (craftable, plan, history) qayta yuklaydi.
 */
export function useCraftBulk() {
  const qc = useQueryClient()
  const { effectiveVersion } = useGameVersion()
  return useMutation({
    mutationFn: (vars: { itemId: number; quantity: number }) =>
      craftBulk(vars.itemId, vars.quantity, effectiveVersion ?? undefined),
    onSuccess: (res: CraftResult) => {
      if (res.success) {
        if (res.newInventory) qc.setQueryData(['inventory'], res.newInventory)
        qc.invalidateQueries({ queryKey: ['craftHistory'] })
        qc.invalidateQueries({ queryKey: ['craftable'] })
        qc.invalidateQueries({ queryKey: ['craftPlan'] })
      }
    },
  })
}

/** Kraft tarixi (eng yangisi avval). */
export function useCraftHistory(enabled = true) {
  return useQuery({
    queryKey: ['craftHistory'],
    queryFn: () => fetchCraftHistory(0, 20),
    enabled,
    staleTime: 30_000,
  })
}
