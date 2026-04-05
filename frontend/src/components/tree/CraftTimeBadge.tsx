import { Clock } from 'lucide-react'
import { formatTime } from '../../utils/formatTime'

interface Props {
  seconds: number
  className?: string
}

export default function CraftTimeBadge({ seconds, className = '' }: Props) {
  if (seconds <= 0) return null

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-gray-500 font-mono ${className}`}>
      <Clock size={11} />
      {formatTime(seconds)}
    </span>
  )
}
