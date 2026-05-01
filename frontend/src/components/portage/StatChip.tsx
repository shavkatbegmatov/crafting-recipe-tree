import type { ReactNode } from 'react'

interface Props {
  label: string
  value: ReactNode
  tone?: 'default' | 'gold' | 'green' | 'sky' | 'amber' | 'red' | 'muted'
}

const TONE_CLS: Record<NonNullable<Props['tone']>, string> = {
  default: 'bg-dark-card border-dark-border text-[#d4c4a0]',
  gold:    'bg-dark-gold/10 border-dark-gold/30 text-dark-gold',
  green:   'bg-green-500/10 border-green-500/30 text-green-400',
  sky:     'bg-sky-500/10 border-sky-500/30 text-sky-300',
  amber:   'bg-amber-500/10 border-amber-500/30 text-amber-300',
  red:     'bg-red-500/10 border-red-500/30 text-red-400',
  muted:   'bg-dark-card/50 border-dark-border text-[#8a7a60]',
}

export default function StatChip({ label, value, tone = 'default' }: Props) {
  return (
    <div className={`px-3 py-2 rounded-lg border ${TONE_CLS[tone]} flex flex-col gap-0.5 min-w-[80px]`}>
      <span className="text-[10px] uppercase tracking-wide text-[#8a7a60]">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  )
}
