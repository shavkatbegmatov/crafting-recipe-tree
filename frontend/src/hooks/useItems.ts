import { useQuery } from '@tanstack/react-query'
import { fetchCategories, fetchItems, fetchItem, searchItems, fetchUsedIn, fetchTags } from '../api/items'

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
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => fetchItem(id),
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
  return useQuery({
    queryKey: ['usedIn', id],
    queryFn: () => fetchUsedIn(id),
    enabled: id > 0,
  })
}
