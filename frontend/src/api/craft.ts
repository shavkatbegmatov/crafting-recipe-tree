import client from './client'
import type { InventoryEntry } from './inventory'

export interface MissingEntry {
  itemId: number
  name: string
  nameUz: string
  nameEn: string
  nameUzCyr: string
  needed: number
  have: number
}

export interface CraftLogEntry {
  id: number
  resultItemId: number
  resultItemName: string
  resultItemNameUz: string
  resultItemNameEn: string
  resultItemNameUzCyr: string
  categoryCode: string
  imageUrl: string | null
  resultQuantity: number
  craftedAt: string
}

export interface CraftResult {
  success: boolean
  missing: MissingEntry[] | null
  newInventory: InventoryEntry[] | null
  log: CraftLogEntry | null
}

export interface CraftHistoryPage {
  content: CraftLogEntry[]
  totalElements: number
  totalPages: number
  number: number
}

/** Bulk craft: xomashyo inventardan ayiriladi, natija qo'shiladi, tarixga yoziladi. */
export async function craftBulk(itemId: number, quantity: number, version?: string): Promise<CraftResult> {
  const { data } = await client.post('/inventory/craft', { itemId, quantity, gameVersion: version })
  return data
}

/** Foydalanuvchining kraft tarixi (eng yangisi avval). */
export async function fetchCraftHistory(page = 0, size = 20): Promise<CraftHistoryPage> {
  const { data } = await client.get('/inventory/craft-history', { params: { page, size } })
  return data
}
