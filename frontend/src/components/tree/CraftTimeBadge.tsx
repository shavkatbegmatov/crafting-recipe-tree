import { Clock } from 'lucide-react'
import { formatTime } from '../../utils/formatTime'

interface Props {
  seconds: number
  className?: string
}

export default function CraftTimeBadge({ seconds, className = '' }: Props) {
  if (seconds <= 0) return null

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-skin-muted font-mono
      bg-dark-bg/50 px-1.5 py-0.5 rounded border-l-2 border-dark-border ${className}`}>
      <Clock size={11} className="text-dark-gold/70" />
      {formatTime(seconds)}
    </span>
  )
}
