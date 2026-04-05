export interface Category {
  id: number
  code: string
  nameRu: string
  nameUz: string
  sortOrder: number
}

export interface CraftItem {
  id: number
  name: string
  description: string | null
  categoryCode: string
  categoryNameRu: string
  categoryNameUz: string
  craftTimeSeconds: number
  ingredients?: RecipeIngredient[]
}

export interface RecipeIngredient {
  ingredientItemId: number
  ingredientName: string
  ingredientCategory: string
  quantity: number
}

export interface RecipeTreeNode {
  id: number
  name: string
  category: string
  craftTimeSeconds: number
  quantity: number
  children: RecipeTreeNode[]
}

export interface RawMaterialEntry {
  name: string
  totalQuantity: number
}

export interface RawTotal {
  itemId: number
  itemName: string
  totalCraftTimeSeconds: number
  rawMaterials: RawMaterialEntry[]
}

export interface UsedIn {
  itemId: number
  itemName: string
  categoryCode: string
  quantity: number
}

export type CategoryCode = 'RAW' | 'MATERIAL' | 'ITEM' | 'MODULE'
