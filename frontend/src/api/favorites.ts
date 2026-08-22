import client from './client'
import type { CraftItem } from './types'

/** Mening sevimlilarim (item ma'lumotlari bilan, so'nggidan eskisiga). Versiya bo'yicha filtrlanadi. */
export async function fetchFavorites(version?: string): Promise<CraftItem[]> {
  const { data } = await client.get('/favorites', { params: version ? { version } : undefined })
  return data
}

/** Sevimli item id'lari — yulduzcha holatini belgilash uchun (yengil). */
export async function fetchFavoriteIds(version?: string): Promise<number[]> {
  const { data } = await client.get('/favorites/ids', { params: version ? { version } : undefined })
  return data
}

export async function addFavorite(itemId: number): Promise<void> {
  await client.post(`/favorites/${itemId}`)
}

export async function removeFavorite(itemId: number): Promise<void> {
  await client.delete(`/favorites/${itemId}`)
}
