import client from './client'
import type { Recipe } from './types'

export interface IngredientLine {
  ingredientItemId: number
  quantity: number
}

export interface UpsertRecipeData {
  craftTimeSeconds: number
  notes?: string | null
  ingredients: IngredientLine[]
}

export async function fetchRecipeHistory(itemId: number): Promise<Recipe[]> {
  const { data } = await client.get(`/items/${itemId}/recipes`)
  return data
}

export async function fetchRecipe(itemId: number, version?: string): Promise<Recipe | null> {
  const params = version ? { version } : undefined
  const res = await client.get(`/items/${itemId}/recipe`, { params, validateStatus: () => true })
  if (res.status === 204) return null
  if (res.status >= 200 && res.status < 300) return res.data as Recipe
  throw new Error(`fetchRecipe failed: ${res.status}`)
}

export async function upsertRecipe(itemId: number, version: string | null, data: UpsertRecipeData): Promise<Recipe> {
  const params = version ? { version } : undefined
  const { data: res } = await client.put(`/items/${itemId}/recipe`, data, { params })
  return res
}

export async function copyRecipeFromVersion(
  itemId: number,
  fromVersion: string,
  toVersion?: string,
  overwrite: boolean = false,
): Promise<Recipe> {
  const params: Record<string, string | boolean> = { fromVersion, overwrite }
  if (toVersion) params.toVersion = toVersion
  const { data } = await client.post(`/items/${itemId}/recipe/copy-from`, undefined, { params })
  return data
}

export async function deleteRecipe(itemId: number, version?: string): Promise<void> {
  const params = version ? { version } : undefined
  await client.delete(`/items/${itemId}/recipe`, { params })
}
