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

export type ConflictPolicy = 'SKIP_EXISTING' | 'OVERWRITE_ALL' | 'FILL_GAPS_ONLY'

export interface CopyTreeReportEntry {
  itemId: number
  itemName: string
  itemNameUz: string | null
  itemNameEn: string | null
  itemNameUzCyr: string | null
  categoryCode: string | null
  imageUrl: string | null
  sourceRecipeId: number | null
}

export interface CopyTreeReport {
  fromVersion: string
  toVersion: string
  rootItemId: number
  conflictPolicy: ConflictPolicy
  dryRun: boolean
  copied: CopyTreeReportEntry[]
  skipped: CopyTreeReportEntry[]
  overwritten: CopyTreeReportEntry[]
  missingInSource: CopyTreeReportEntry[]
  visited: number
  maxDepthReached: boolean
}

export async function copyRecipeTreeFromVersion(
  itemId: number,
  fromVersion: string,
  toVersion: string | undefined,
  policy: ConflictPolicy,
  dryRun: boolean,
): Promise<CopyTreeReport> {
  const params: Record<string, string | boolean> = { fromVersion, policy, dryRun }
  if (toVersion) params.toVersion = toVersion
  const { data } = await client.post(`/items/${itemId}/recipe/copy-tree-from`, undefined, { params })
  return data
}

export async function deleteRecipe(itemId: number, version?: string): Promise<void> {
  const params = version ? { version } : undefined
  await client.delete(`/items/${itemId}/recipe`, { params })
}
