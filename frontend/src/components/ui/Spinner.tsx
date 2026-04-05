import { Loader2 } from 'lucide-react'

export default function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-gray-400 ${className}`} size={24} />
}
