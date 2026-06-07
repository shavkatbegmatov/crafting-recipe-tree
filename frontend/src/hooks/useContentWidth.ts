import { useAuth } from '../contexts/AuthContext'

/**
 * Sahifa kontenti uchun kenglik klassini qaytaradi — foydalanuvchining DB'da saqlangan
 * layout sozlamasiga ko'ra.
 * - CENTERED (default): berilgan max-width bilan markazda (mx-auto)
 * - FULL: butun mavjud kenglikni egallaydi
 *
 * @param maxWidth markazlashgan rejimda qo'llanadigan Tailwind max-width klassi (sahifaga xos)
 */
export function useContentWidth(maxWidth = 'max-w-7xl'): string {
  const { layoutWidth } = useAuth()
  return layoutWidth === 'FULL' ? 'w-full' : `${maxWidth} mx-auto`
}
