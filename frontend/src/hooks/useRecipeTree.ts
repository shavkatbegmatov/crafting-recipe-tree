import { useQuery } from '@tanstack/react-query'
import { fetchRecipeTree, fetchRawTotals } from '../api/items'

export function useRecipeTree(id: number) {
  return useQuery({
    queryKey: ['recipeTree', id],
    queryFn: () => fetchRecipeTree(id),
    enabled: id > 0,
  })
}

export function useRawTotals(id: number) {
  return useQuery({
    queryKey: ['rawTotals', id],
    queryFn: () => fetchRawTotals(id),
    enabled: id > 0,
  })
}
