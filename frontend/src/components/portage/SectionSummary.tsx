import { useTranslation } from 'react-i18next'
import type { SectionSummary as Section } from '../../api/portage'
import StatChip from './StatChip'

interface Props {
  title: string
  data: Section
}

export default function SectionSummary({ title, data }: Props) {
  const { t } = useTranslation()
  const empty = data.total === 0
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-skin-base uppercase tracking-wider">{title}</h4>
        <span className="text-[11px] text-skin-muted">{t('portage.summary.count', { n: data.total })}</span>
      </div>
      {empty ? (
        <p className="text-[11px] text-skin-muted/70 italic">—</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.created   > 0 && <StatChip label={t('portage.summary.created')}   value={data.created}   tone="green" />}
          {data.updated   > 0 && <StatChip label={t('portage.summary.updated')}   value={data.updated}   tone="sky" />}
          {data.unchanged > 0 && <StatChip label={t('portage.summary.unchanged')} value={data.unchanged} tone="muted" />}
          {data.skipped   > 0 && <StatChip label={t('portage.summary.skipped')}   value={data.skipped}   tone="amber" />}
          {data.failed    > 0 && <StatChip label={t('portage.summary.failed')}    value={data.failed}    tone="red" />}
        </div>
      )}
    </div>
  )
}
