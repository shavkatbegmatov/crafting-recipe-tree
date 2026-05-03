import { useQuery } from '@tanstack/react-query'
import { fetchRecipeTree, fetchRawTotals } from '../api/items'
import { useGameVersion } from '../contexts/GameVersionContext'

export function useRecipeTree(id: number) {
  const { effectiveVersion } = useGameVersion()
  return useQuery({
    queryKey: ['recipeTree', id, effectiveVersion],
    queryFn: () => fetchRecipeTree(id, effectiveVersion ?? undefined),
    enabled: id > 0,
  })
}

export function useRawTotals(id: number) {
  const { effectiveVersion } = useGameVersion()
  return useQuery({
    queryKey: ['rawTotals', id, effectiveVersion],
    queryFn: () => fetchRawTotals(id, effectiveVersion ?? undefined),
    enabled: id > 0,
  })
}
