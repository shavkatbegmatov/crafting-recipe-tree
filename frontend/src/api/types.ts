export interface Category {
  id: number
  code: string
  nameRu: string
  nameUz: string
  nameEn: string
  nameUzCyr: string
  color: string
  icon: string
  sortOrder: number
}

export interface Tag {
  id: number
  code: string
  nameRu: string
  nameUz: string
  nameEn: string
  nameUzCyr: string
  color: string
  sortOrder: number
}

export interface CraftItem {
  id: number
  name: string
  nameUz: string
  nameEn: string
  nameUzCyr: string
  description: string | null
  descriptionUz: string | null
  descriptionEn: string | null
  descriptionUzCyr: string | null
  categoryCode: string
  categoryNameRu: string
  categoryNameUz: string
  categoryNameEn: string
  categoryNameUzCyr: string
  craftTimeSeconds: number
  imageUrl: string | null
  tags?: Tag[]
  ingredients?: RecipeIngredient[]
}

export interface RecipeIngredient {
  ingredientItemId: number
  ingredientName: string
  ingredientNameUz: string
  ingredientNameEn: string
  ingredientNameUzCyr: string
  ingredientCategory: string
  ingredientImageUrl: string | null
  quantity: number
}

export interface RecipeTreeNode {
  id: number
  name: string
  nameUz: string
  nameEn: string
  nameUzCyr: string
  category: string
  craftTimeSeconds: number
  imageUrl: string | null
  quantity: number
  children: RecipeTreeNode[]
}

export interface RawMaterialEntry {
  name: string
  nameUz: string
  nameEn: string
  nameUzCyr: string
  totalQuantity: number
}

export interface RawTotal {
  itemId: number
  itemName: string
  itemNameUz: string
  itemNameEn: string
  itemNameUzCyr: string
  totalCraftTimeSeconds: number
  rawMaterials: RawMaterialEntry[]
}

export interface UsedIn {
  itemId: number
  itemName: string
  itemNameUz: string
  itemNameEn: string
  itemNameUzCyr: string
  categoryCode: string
  quantity: number
}

export type CategoryCode = 'RAW' | 'MATERIAL' | 'ITEM' | 'MODULE'
