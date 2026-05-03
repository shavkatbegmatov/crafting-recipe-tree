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
  return useQuery({
    queryKey: ['items', category],
    queryFn: () => fetchItems(category),
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
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchItems(query),
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
