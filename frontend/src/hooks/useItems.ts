import { useQuery } from '@tanstack/react-query'
import { fetchCategories, fetchItems, fetchItem, searchItems, fetchUsedIn, fetchTags } from '../api/items'
import { useGameVersion } from '../contexts/GameVersionContext'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })
}

export function useItems(category?: string) {
  const { effectiveVersion } = useGameVersion()
  return useQuery({
    queryKey: ['items', category, effectiveVersion],
    queryFn: () => fetchItems(category, effectiveVersion ?? undefined),
  })
}

export function useItem(id: number) {
  const { effectiveVersion } = useGameVersion()
  return useQuery({
    queryKey: ['item', id, effectiveVersion],
    queryFn: () => fetchItem(id, effectiveVersion ?? undefined),
    enabled: id > 0,
  })
}

export function useSearchItems(query: string) {
  const { effectiveVersion } = useGameVersion()
  return useQuery({
    queryKey: ['search', query, effectiveVersion],
    queryFn: () => searchItems(query, effectiveVersion ?? undefined),
    enabled: query.length >= 1,
  })
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  })
}

export function useUsedIn(id: number) {
  const { effectiveVersion } = useGameVersion()
  return useQuery({
    queryKey: ['usedIn', id, effectiveVersion],
    queryFn: () => fetchUsedIn(id, effectiveVersion ?? undefined),
    enabled: id > 0,
  })
}
