import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchInventory, saveInventory, type InventoryEntry } from '../api/inventory'
import { useGameVersion } from '../contexts/GameVersionContext'

/** Saqlangan inventar (boshlang'ich yuklash). */
export function useInventory(enabled = true) {
  const { effectiveVersion } = useGameVersion()
  return useQuery({
    queryKey: ['inventory', effectiveVersion],
    queryFn: () => fetchInventory(effectiveVersion ?? undefined),
    enabled,
    staleTime: 30_000,
  })
}

/** Inventarni to'liq saqlaydi va keshni server javobi bilan yangilaydi. */
export function useSaveInventory() {
  const qc = useQueryClient()
  const { effectiveVersion } = useGameVersion()
  return useMutation({
    mutationFn: (entries: InventoryEntry[]) => saveInventory(entries, effectiveVersion ?? undefined),
    onSuccess: (data) => qc.setQueryData(['inventory', effectiveVersion], data),
  })
}
