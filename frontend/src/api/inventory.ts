import client from './client'

export interface InventoryEntry {
  itemId: number
  quantity: number
}

/** Mening inventarim (item id + miqdor). Har versiyaning o'z inventari bor. */
export async function fetchInventory(version?: string): Promise<InventoryEntry[]> {
  const { data } = await client.get('/inventory', { params: version ? { version } : undefined })
  return data
}

/** Inventarni to'liq almashtiradi (faqat shu versiya yozuvlari) va yangilangan holatni qaytaradi. */
export async function saveInventory(entries: InventoryEntry[], version?: string): Promise<InventoryEntry[]> {
  const { data } = await client.put('/inventory', entries, { params: version ? { version } : undefined })
  return data
}
