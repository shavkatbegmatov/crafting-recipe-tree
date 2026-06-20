import { useAuth } from '../contexts/AuthContext'

/**
 * Sahifa kontenti uchun kenglik klassini qaytaradi — foydalanuvchining DB'da saqlangan
 * layout sozlamasiga ko'ra.
 * - CENTERED (default): barcha sahifalarda bir xil markaziy kenglik (max-w-7xl, mx-auto)
 * - FULL: butun mavjud kenglikni egallaydi
 *
 * Izchillik uchun barcha sahifalar bir xil kenglikda bo'ladi — sahifalar orasida
 * kontent kengligi "sakramaydi". `maxWidth` argumenti orqaga-moslik uchun qabul
 * qilinadi (eski chaqiruvlar buzilmasin), lekin endi e'tiborga olinmaydi.
 */
export function useContentWidth(_maxWidth = 'max-w-7xl'): string {
  const { layoutWidth } = useAuth()
  return layoutWidth === 'FULL' ? 'w-full' : 'max-w-7xl mx-auto'
}
