import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchGameVersions,
  fetchCurrentGameVersion,
  createGameVersion,
  updateGameVersion,
  setCurrentGameVersion,
  deleteGameVersion,
  fetchGameVersionStats,
  copyFromVersion,
  type CreateGameVersionData,
  type UpdateGameVersionData,
  type CopyFromVersionData,
} from '../api/gameVersions'

export function useGameVersions() {
  return useQuery({
    queryKey: ['gameVersions'],
    queryFn: fetchGameVersions,
    staleTime: 60_000,
  })
}

export function useCurrentGameVersion() {
  return useQuery({
    queryKey: ['gameVersions', 'current'],
    queryFn: fetchCurrentGameVersion,
    staleTime: 60_000,
  })
}

export function useGameVersionStats() {
  return useQuery({
    queryKey: ['gameVersions', 'stats'],
    queryFn: fetchGameVersionStats,
  })
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['gameVersions'] })
  // Recipe data depends on selected version, so invalidate everything that uses it.
  queryClient.invalidateQueries({ queryKey: ['recipeTree'] })
  queryClient.invalidateQueries({ queryKey: ['rawTotals'] })
  queryClient.invalidateQueries({ queryKey: ['usedIn'] })
  queryClient.invalidateQueries({ queryKey: ['item'] })
  // Itemlar ham versiyaga bog'langan — ro'yxat va qidiruv ham eskiradi.
  queryClient.invalidateQueries({ queryKey: ['items'] })
  queryClient.invalidateQueries({ queryKey: ['search'] })
}

export function useCreateGameVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGameVersionData) => createGameVersion(data),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useUpdateGameVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGameVersionData }) => updateGameVersion(id, data),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useSetCurrentGameVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => setCurrentGameVersion(id),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteGameVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteGameVersion(id),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useCopyFromVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ targetId, data }: { targetId: number; data: CopyFromVersionData }) =>
      copyFromVersion(targetId, data),
    onSuccess: () => invalidateAll(qc),
  })
}
