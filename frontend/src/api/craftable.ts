import client from './client'

export interface MaterialEntry {
  itemId: number
  quantity: number
}

export interface MissingMaterial {
  itemId: number
  name: string
  nameUz: string
  nameEn: string
  nameUzCyr: string
  required: number
  have: number
}

export interface CraftableItem {
  resultItemId: number
  resultItemName: string
  resultItemNameUz: string
  resultItemNameEn: string
  resultItemNameUzCyr: string
  categoryCode: string
  imageUrl: string | null
  maxCraftable: number
  fullyCraftable: boolean
  missing: MissingMaterial[]
}

export async function searchCraftable(materials: MaterialEntry[], version?: string): Promise<CraftableItem[]> {
  const { data } = await client.post('/recipes/search-craftable', {
    materials,
    gameVersion: version,
  })
  return data
}
