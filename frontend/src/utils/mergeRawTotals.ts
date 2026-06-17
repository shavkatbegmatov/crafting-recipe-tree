import type { RawMaterialEntry, RawTotal } from '../api/types'

/** Bir nechta maqsad-item natijasini birlashtirish uchun kirish birligi. */
export interface RawTotalsInput {
  data: RawTotal | undefined
  quantity: number
}

export interface MergedRaw extends RawMaterialEntry {
  totalQuantity: number
}

export interface MergedTotals {
  rawMaterials: MergedRaw[]
  totalCraftTimeSeconds: number
}

/**
 * Bir nechta maqsad-item uchun olingan xomashyo natijalarini itemId bo'yicha qo'shadi,
 * har birini o'z miqdoriga ko'paytiradi va miqdor bo'yicha kamayish tartibida saralaydi.
 * Sof funksiya — React/server'dan mustaqil, shuning uchun alohida test qilinadi.
 */
export function mergeRawTotals(inputs: RawTotalsInput[]): MergedTotals {
  const rawMap = new Map<number, MergedRaw>()
  let totalCraftTimeSeconds = 0

  for (const { data, quantity } of inputs) {
    if (!data) continue
    const qty = quantity ?? 1
    totalCraftTimeSeconds += data.totalCraftTimeSeconds * qty
    for (const mat of data.rawMaterials) {
      const add = Number(mat.totalQuantity) * qty
      const existing = rawMap.get(mat.id)
      if (existing) {
        existing.totalQuantity += add
      } else {
        // Spread bilan nusxa — asl kirish obyekti o'zgarmaydi.
        rawMap.set(mat.id, { ...mat, totalQuantity: add })
      }
    }
  }

  const rawMaterials = Array.from(rawMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity)
  return { rawMaterials, totalCraftTimeSeconds }
}
