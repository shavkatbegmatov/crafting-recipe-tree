import type { SectionSummary as Section } from '../../api/portage'
import StatChip from './StatChip'

interface Props {
  title: string
  data: Section
}

export default function SectionSummary({ title, data }: Props) {
  const empty = data.total === 0
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-[#d4c4a0] uppercase tracking-wider">{title}</h4>
        <span className="text-[11px] text-[#8a7a60]">{data.total} ta</span>
      </div>
      {empty ? (
        <p className="text-[11px] text-[#8a7a60]/70 italic">—</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.created   > 0 && <StatChip label="Yangi"     value={data.created}   tone="green" />}
          {data.updated   > 0 && <StatChip label="Yangilanish" value={data.updated}   tone="sky" />}
          {data.unchanged > 0 && <StatChip label="O'zgarmas" value={data.unchanged} tone="muted" />}
          {data.skipped   > 0 && <StatChip label="O'tkazib" value={data.skipped}   tone="amber" />}
          {data.failed    > 0 && <StatChip label="Xato"     value={data.failed}    tone="red" />}
        </div>
      )}
    </div>
  )
}
