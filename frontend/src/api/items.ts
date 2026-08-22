import client from './client'
import type { Category, CraftItem, RecipeTreeNode, RawTotal, UsedIn, Tag } from './types'

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await client.get('/categories')
  return data
}

export interface UpdateCategoryData {
  code?: string
  nameRu?: string
  nameUz?: string
  nameEn?: string
  nameUzCyr?: string
  color?: string
  icon?: string
  sortOrder?: number
}

export async function createCategory(data: UpdateCategoryData): Promise<Category> {
  const { data: res } = await client.post('/categories', data)
  return res
}

export async function updateCategory(id: number, data: UpdateCategoryData): Promise<Category> {
  const { data: res } = await client.put(`/categories/${id}`, data)
  return res
}

export async function deleteCategory(id: number): Promise<void> {
  await client.delete(`/categories/${id}`)
}

export async function fetchItems(category?: string, version?: string): Promise<CraftItem[]> {
  // Itemlar versiyaga bog'langan: versiya berilmasa backend joriy versiyani oladi.
  const params: Record<string, string> = {}
  if (category) params.category = category
  if (version) params.version = version
  const { data } = await client.get('/items', { params })
  return data
}

export async function fetchItem(id: number, version?: string): Promise<CraftItem> {
  const params = version ? { version } : undefined
  const { data } = await client.get(`/items/${id}`, { params })
  return data
}

export async function searchItems(query: string, version?: string): Promise<CraftItem[]> {
  const params: Record<string, string> = { q: query }
  if (version) params.version = version
  const { data } = await client.get('/items/search', { params })
  return data
}

export async function fetchRecipeTree(id: number, version?: string): Promise<RecipeTreeNode> {
  const params = version ? { version } : undefined
  const { data } = await client.get(`/items/${id}/recipe-tree`, { params })
  return data
}

export async function fetchRawTotals(id: number, version?: string): Promise<RawTotal> {
  const params = version ? { version } : undefined
  const { data } = await client.get(`/items/${id}/raw-totals`, { params })
  return data
}

export async function fetchTotalCraftTime(id: number): Promise<{ itemId: number; totalCraftTimeSeconds: number }> {
  const { data } = await client.get(`/items/${id}/total-craft-time`)
  return data
}

export async function fetchUsedIn(id: number, version?: string): Promise<UsedIn[]> {
  const params = version ? { version } : undefined
  const { data } = await client.get(`/items/${id}/used-in`, { params })
  return data
}

export interface CreateItemData {
  categoryId?: number
  categoryCode?: string
  name: string
  nameUz?: string
  nameEn?: string
  nameUzCyr?: string
  description?: string
  descriptionUz?: string
  descriptionEn?: string
  descriptionUzCyr?: string
  craftTimeSeconds?: number
  tagIds?: number[]
}

/** Yangi item — joriy (yoki berilgan) versiyada yaratiladi. */
export async function createItem(data: CreateItemData, version?: string): Promise<CraftItem> {
  const { data: res } = await client.post('/items', data, {
    params: version ? { version } : undefined,
  })
  return res
}

export interface BulkCreateResultRow {
  line: number
  name: string
  categoryCode: string | null
  /** NEW | DUPLICATE | INVALID — kod, tayyor matn emas: tarjimani UI qiladi. */
  status: string
  /** Sabab kodi (status NEW bo'lsa null). */
  reason: string | null
  /** Sababga tegishli qiymat, masalan noma'lum kategoriya kodi. */
  detail: string | null
}

export interface BulkCreateResult {
  dryRun: boolean
  version: string
  willCreate: number
  duplicates: number
  invalid: number
  rows: BulkCreateResultRow[]
}

/**
 * Ommaviy qo'shish. `dryRun` bilan bazaga hech narsa yozilmaydi —
 * avval natijani ko'rish uchun.
 */
export async function createItemsBulk(
  items: CreateItemData[],
  defaultCategoryCode: string | undefined,
  dryRun: boolean,
  version?: string
): Promise<BulkCreateResult> {
  const params: Record<string, string> = { dryRun: String(dryRun) }
  if (version) params.version = version
  const { data } = await client.post('/items/bulk', { items, defaultCategoryCode }, { params })
  return data
}

export interface UpdateItemData {
  categoryId?: number
  name?: string
  nameUz?: string
  nameEn?: string
  nameUzCyr?: string
  description?: string
  descriptionUz?: string
  descriptionEn?: string
  descriptionUzCyr?: string
}

export async function updateItem(id: number, data: UpdateItemData): Promise<CraftItem> {
  const { data: res } = await client.put(`/items/${id}`, data)
  return res
}

export async function uploadItemImage(
  id: number,
  file: File,
  removeBg: boolean = true,
  onProgress?: (percent: number) => void
): Promise<{ imageUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await client.post(`/items/${id}/upload-image`, formData, {
    params: { removeBg },
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return data
}

// Tags
export async function fetchTags(): Promise<Tag[]> {
  const { data } = await client.get('/tags')
  return data
}

export async function setItemTags(itemId: number, tagIds: number[]): Promise<Tag[]> {
  const { data } = await client.put(`/tags/items/${itemId}`, tagIds)
  return data
}

export async function createTag(tag: Partial<Tag>): Promise<Tag> {
  const { data } = await client.post('/tags', tag)
  return data
}

export async function updateTag(id: number, tag: Partial<Tag>): Promise<Tag> {
  const { data } = await client.put(`/tags/${id}`, tag)
  return data
}

export async function deleteTag(id: number): Promise<void> {
  await client.delete(`/tags/${id}`)
}
