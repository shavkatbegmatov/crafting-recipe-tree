import type { PortageAction } from '../../api/portage'

const STYLES: Record<PortageAction, { label: string; cls: string }> = {
  CREATE:    { label: '+',  cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  UPDATE:    { label: '~',  cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  REPLACE:   { label: '↻',  cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  SKIP:      { label: '·',  cls: 'bg-dark-hover text-[#8a7a60] border-dark-border' },
  UNCHANGED: { label: '=',  cls: 'bg-dark-hover text-[#8a7a60] border-dark-border' },
  FAIL:      { label: '!',  cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

export default function ActionBadge({ action }: { action: PortageAction }) {
  const s = STYLES[action]
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono font-bold border ${s.cls}`}
      title={action}
    >
      {s.label}
    </span>
  )
}
