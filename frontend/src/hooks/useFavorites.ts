import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addFavorite, fetchFavoriteIds, fetchFavorites, removeFavorite } from '../api/favorites'
import { useGameVersion } from '../contexts/GameVersionContext'

/** Sevimlilar ro'yxati (item ma'lumotlari bilan) — Sevimlilar sahifasi ishlatadi. */
export function useFavorites(enabled = true) {
  const { effectiveVersion } = useGameVersion()
  return useQuery({
    queryKey: ['favorites', effectiveVersion],
    queryFn: () => fetchFavorites(effectiveVersion ?? undefined),
    enabled,
    staleTime: 15_000,
  })
}

/** Sevimli id'lar Set ko'rinishida — yulduzcha holatini O(1) tekshirish uchun. */
export function useFavoriteIds(enabled = true) {
  const { effectiveVersion } = useGameVersion()
  return useQuery({
    queryKey: ['favoriteIds', effectiveVersion],
    queryFn: () => fetchFavoriteIds(effectiveVersion ?? undefined),
    enabled,
    staleTime: 30_000,
    select: (ids: number[]) => new Set(ids),
  })
}

/** Sevimlini qo'shadi/olib tashlaydi va ikkala querysni yangilaydi. */
export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, favorited }: { itemId: number; favorited: boolean }) =>
      favorited ? removeFavorite(itemId) : addFavorite(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] })
      qc.invalidateQueries({ queryKey: ['favoriteIds'] })
    },
  })
}
