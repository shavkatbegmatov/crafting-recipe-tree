import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchRecipe,
  fetchRecipeHistory,
  upsertRecipe,
  copyRecipeFromVersion,
  deleteRecipe,
  type UpsertRecipeData,
} from '../api/recipes'
import { useGameVersion } from '../contexts/GameVersionContext'

export function useRecipeHistory(itemId: number) {
  return useQuery({
    queryKey: ['recipeHistory', itemId],
    queryFn: () => fetchRecipeHistory(itemId),
    enabled: itemId > 0,
  })
}

export function useRecipe(itemId: number, version?: string | null) {
  const { effectiveVersion } = useGameVersion()
  const v = version ?? effectiveVersion ?? undefined
  return useQuery({
    queryKey: ['recipe', itemId, v],
    queryFn: () => fetchRecipe(itemId, v),
    enabled: itemId > 0,
  })
}

function invalidateRecipeData(queryClient: ReturnType<typeof useQueryClient>, itemId: number) {
  queryClient.invalidateQueries({ queryKey: ['recipe', itemId] })
  queryClient.invalidateQueries({ queryKey: ['recipeHistory', itemId] })
  queryClient.invalidateQueries({ queryKey: ['recipeTree', itemId] })
  queryClient.invalidateQueries({ queryKey: ['rawTotals', itemId] })
  queryClient.invalidateQueries({ queryKey: ['usedIn'] })
  queryClient.invalidateQueries({ queryKey: ['item', itemId] })
}

export function useUpsertRecipe(itemId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ version, data }: { version: string | null; data: UpsertRecipeData }) =>
      upsertRecipe(itemId, version, data),
    onSuccess: () => invalidateRecipeData(qc, itemId),
  })
}

export function useCopyRecipeFromVersion(itemId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      fromVersion,
      toVersion,
      overwrite,
    }: { fromVersion: string; toVersion?: string; overwrite?: boolean }) =>
      copyRecipeFromVersion(itemId, fromVersion, toVersion, overwrite),
    onSuccess: () => invalidateRecipeData(qc, itemId),
  })
}

export function useDeleteRecipe(itemId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (version?: string) => deleteRecipe(itemId, version),
    onSuccess: () => invalidateRecipeData(qc, itemId),
  })
}
