import { describe, it, expect } from 'vitest'
import { mergeRawTotals } from './mergeRawTotals'
import type { RawMaterialEntry, RawTotal } from '../api/types'

function raw(id: number, qty: number): RawMaterialEntry {
  const name = `mat${id}`
  return {
    id,
    name,
    nameUz: name,
    nameEn: name,
    nameUzCyr: name,
    categoryCode: 'RAW',
    imageUrl: null,
    totalQuantity: qty,
  }
}

function total(time: number, mats: RawMaterialEntry[]): RawTotal {
  return {
    itemId: 1,
    itemName: 'x',
    itemNameUz: 'x',
    itemNameEn: 'x',
    itemNameUzCyr: 'x',
    totalCraftTimeSeconds: time,
    rawMaterials: mats,
  }
}

describe('mergeRawTotals', () => {
  it("bo'sh kirish — bo'sh natija", () => {
    expect(mergeRawTotals([])).toEqual({ rawMaterials: [], totalCraftTimeSeconds: 0 })
  })

  it('undefined data o\'tkazib yuboriladi (hali yuklanmagan so\'rov)', () => {
    const res = mergeRawTotals([{ data: undefined, quantity: 2 }])
    expect(res.rawMaterials).toEqual([])
    expect(res.totalCraftTimeSeconds).toBe(0)
  })

  it('miqdorga ko\'paytiradi (vaqt va xomashyo)', () => {
    const res = mergeRawTotals([{ data: total(10, [raw(1, 3)]), quantity: 2 }])
    expect(res.totalCraftTimeSeconds).toBe(20)
    expect(res.rawMaterials).toHaveLength(1)
    expect(res.rawMaterials[0].totalQuantity).toBe(6)
  })

  it('bir xil xomashyoni id bo\'yicha birlashtiradi', () => {
    const res = mergeRawTotals([
      { data: total(5, [raw(1, 2), raw(2, 1)]), quantity: 1 },
      { data: total(5, [raw(1, 3)]), quantity: 1 },
    ])
    const byId = Object.fromEntries(res.rawMaterials.map((m) => [m.id, m.totalQuantity]))
    expect(byId[1]).toBe(5) // 2 + 3
    expect(byId[2]).toBe(1)
    expect(res.totalCraftTimeSeconds).toBe(10)
  })

  it('miqdor bo\'yicha kamayish tartibida saralaydi', () => {
    const res = mergeRawTotals([{ data: total(0, [raw(1, 1), raw(2, 9), raw(3, 5)]), quantity: 1 }])
    expect(res.rawMaterials.map((m) => m.id)).toEqual([2, 3, 1])
  })

  it('asl kirish obyektini o\'zgartirmaydi (immutability)', () => {
    const mat = raw(1, 2)
    const data = total(0, [mat])
    mergeRawTotals([{ data, quantity: 5 }])
    expect(mat.totalQuantity).toBe(2)
  })
})
