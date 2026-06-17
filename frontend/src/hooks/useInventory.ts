import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchInventory, saveInventory, type InventoryEntry } from '../api/inventory'

/** Saqlangan inventar (boshlang'ich yuklash). */
export function useInventory(enabled = true) {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
    enabled,
    staleTime: 30_000,
  })
}

/** Inventarni to'liq saqlaydi va keshni server javobi bilan yangilaydi. */
export function useSaveInventory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entries: InventoryEntry[]) => saveInventory(entries),
    onSuccess: (data) => qc.setQueryData(['inventory'], data),
  })
}
