import client from './client'

export interface InventoryEntry {
  itemId: number
  quantity: number
}

/** Mening inventarim (item id + miqdor). */
export async function fetchInventory(): Promise<InventoryEntry[]> {
  const { data } = await client.get('/inventory')
  return data
}

/** Inventarni to'liq almashtiradi (butun ro'yxat) va yangilangan holatni qaytaradi. */
export async function saveInventory(entries: InventoryEntry[]): Promise<InventoryEntry[]> {
  const { data } = await client.put('/inventory', entries)
  return data
}
