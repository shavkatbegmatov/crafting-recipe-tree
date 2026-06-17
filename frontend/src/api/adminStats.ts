import client from './client'

export interface CategoryCount {
  code: string
  count: number
}

export interface AdminStats {
  totalItems: number
  totalCategories: number
  totalRecipes: number
  totalTags: number
  totalUsers: number
  admins: number
  superAdmins: number
  blockedUsers: number
  totalMessages: number
  todayMessages: number
  totalFavorites: number
  inventoryEntries: number
  itemsByCategory: CategoryCount[]
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await client.get('/admin/stats')
  return data
}
