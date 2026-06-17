import client from './client'
import type { CraftItem } from './types'

/** Mening sevimlilarim (item ma'lumotlari bilan, so'nggidan eskisiga). */
export async function fetchFavorites(): Promise<CraftItem[]> {
  const { data } = await client.get('/favorites')
  return data
}

/** Sevimli item id'lari — yulduzcha holatini belgilash uchun (yengil). */
export async function fetchFavoriteIds(): Promise<number[]> {
  const { data } = await client.get('/favorites/ids')
  return data
}

export async function addFavorite(itemId: number): Promise<void> {
  await client.post(`/favorites/${itemId}`)
}

export async function removeFavorite(itemId: number): Promise<void> {
  await client.delete(`/favorites/${itemId}`)
}
