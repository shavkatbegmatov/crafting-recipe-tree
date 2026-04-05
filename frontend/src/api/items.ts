import client from './client'
import type { Category, CraftItem, RecipeTreeNode, RawTotal, UsedIn } from './types'

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await client.get('/categories')
  return data
}

export async function fetchItems(category?: string): Promise<CraftItem[]> {
  const params = category ? { category } : {}
  const { data } = await client.get('/items', { params })
  return data
}

export async function fetchItem(id: number): Promise<CraftItem> {
  const { data } = await client.get(`/items/${id}`)
  return data
}

export async function searchItems(query: string): Promise<CraftItem[]> {
  const { data } = await client.get('/items/search', { params: { q: query } })
  return data
}

export async function fetchRecipeTree(id: number): Promise<RecipeTreeNode> {
  const { data } = await client.get(`/items/${id}/recipe-tree`)
  return data
}

export async function fetchRawTotals(id: number): Promise<RawTotal> {
  const { data } = await client.get(`/items/${id}/raw-totals`)
  return data
}

export async function fetchTotalCraftTime(id: number): Promise<{ itemId: number; totalCraftTimeSeconds: number }> {
  const { data } = await client.get(`/items/${id}/total-craft-time`)
  return data
}

export async function fetchUsedIn(id: number): Promise<UsedIn[]> {
  const { data } = await client.get(`/items/${id}/used-in`)
  return data
}
