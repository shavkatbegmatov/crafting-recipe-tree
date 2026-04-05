export function formatTime(seconds: number): string {
  if (seconds <= 0) return '0s'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes === 0) return `${secs}s`
  if (secs === 0) return `${minutes}m`
  return `${minutes}m ${secs}s`
}
