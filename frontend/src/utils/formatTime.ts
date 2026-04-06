import i18n from '../i18n'

export function formatTime(seconds: number): string {
  if (seconds <= 0) return i18n.t('time.zero')
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes === 0) return i18n.t('time.seconds', { count: secs })
  if (secs === 0) return i18n.t('time.minutes', { count: minutes })
  return i18n.t('time.minutesSeconds', { minutes, seconds: secs })
}
