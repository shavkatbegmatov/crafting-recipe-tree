/**
 * Foydalanuvchi nomidan barqaror (deterministik), dark-temaga mos avatar rangini hosil qiladi.
 * Bir xil nom — doimo bir xil rang.
 */
export function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h)
  }
  const hue = Math.abs(h) % 360
  return `hsl(${hue}, 42%, 52%)`
}

/** Nomdan 1-2 harfli bosh harflar (avatar ichi uchun). */
export function initials(name: string): string {
  return name
    .split(/[\s_]+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
