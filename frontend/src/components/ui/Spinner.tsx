/**
 * Game-style yuklash indikatori — gold ikki-yoyli aylanma halqa.
 * `className` orqali o'lcham (masalan `h-8 w-8`) override qilinadi.
 */
export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block w-6 h-6 rounded-full border-2 border-dark-border
        border-t-dark-gold border-r-dark-gold animate-spin ${className}`}
    />
  )
}
