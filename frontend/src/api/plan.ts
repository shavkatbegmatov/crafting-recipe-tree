import client from './client'
import type { InventoryEntry } from './inventory'

export interface CraftStep {
  stepNumber: number
  itemId: number
  name: string
  nameUz: string
  nameEn: string
  nameUzCyr: string
  categoryCode: string
  imageUrl: string | null
  quantity: number
  timeSeconds: number
}

export interface ShoppingEntry {
  itemId: number
  name: string
  nameUz: string
  nameEn: string
  nameUzCyr: string
  categoryCode: string
  imageUrl: string | null
  needed: number
  have: number
  toProcure: number
}

export interface CraftPlan {
  targetItemId: number
  targetItemName: string
  targetItemNameUz: string
  targetItemNameEn: string
  targetItemNameUzCyr: string
  targetQuantity: number
  steps: CraftStep[]
  shoppingList: ShoppingEntry[]
  totalTimeSeconds: number
  parallelTimeSeconds: number
}

/** Kraft rejasi: qadamlar + inventardan ayirilgan shopping list + vaqt. */
export async function fetchCraftPlan(
  itemId: number,
  targetQuantity: number,
  inventory: InventoryEntry[],
  version?: string,
): Promise<CraftPlan> {
  const { data } = await client.post(`/items/${itemId}/craft-plan`, {
    targetQuantity,
    gameVersion: version,
    inventory,
  })
  return data
}
