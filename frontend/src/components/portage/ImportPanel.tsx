import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Upload, FileArchive, X, Loader2, AlertCircle, ShieldCheck, ShieldAlert, ImageIcon, Eye, Wand2, ListChecks } from 'lucide-react'
import { runImport, type ConflictMode, type ImportOptions, type ImportReport } from '../../api/portage'
import SectionSummary from './SectionSummary'
import ActionBadge from './ActionBadge'

const CONFLICT_OPTIONS: { value: ConflictMode; titleKey: string; descKey: string }[] = [
  { value: 'SKIP',    titleKey: 'portage.conflict.skipTitle',    descKey: 'portage.conflict.skipDesc' },
  { value: 'UPDATE',  titleKey: 'portage.conflict.updateTitle',  descKey: 'portage.conflict.updateDesc' },
  { value: 'REPLACE', titleKey: 'portage.conflict.replaceTitle', descKey: 'portage.conflict.replaceDesc' },
]

export default function ImportPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [conflictMode, setConflictMode] = useState<ConflictMode>('UPDATE')
  const [importImages, setImportImages] = useState(true)
  const [overwriteImages, setOverwriteImages] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportReport | null>(null)
  const [applied, setApplied] = useState<ImportReport | null>(null)

  const onFileChosen = useCallback((f: File | null) => {
    setFile(f)
    setPreview(null)
    setApplied(null)
    setError(null)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) onFileChosen(f)
  }

  const baseOptions = (dryRun: boolean): ImportOptions => ({
    conflictMode,
    importImages,
    overwriteImages,
    dryRun,
  })

  const runDryRun = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setApplied(null)
    try {
      const report = await runImport(file, baseOptions(true))
      setPreview(report)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Import xatosi')
    } finally {
      setBusy(false)
    }
  }

  const apply = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const report = await runImport(file, baseOptions(false))
      setApplied(report)
      setPreview(null)
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Apply xatosi')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setApplied(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const reportToShow: ImportReport | null = applied ?? preview

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
      <div className="space-y-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-base font-semibold text-[#d4c4a0]">{t('portage.import.fileTitle')}</h3>
          <p className="text-xs text-[#8a7a60] mt-0.5">{t('portage.import.fileHint')}</p>

          {!file ? (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="mt-4 flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed border-dark-border
                bg-dark-bg/40 cursor-pointer hover:border-dark-gold/40 hover:bg-dark-hover/30 transition-colors"
            >
              <Upload size={28} className="text-[#8a7a60]" />
              <span className="text-sm text-[#d4c4a0]">{t('portage.import.dropOrClick')}</span>
              <span className="text-[11px] text-[#8a7a60]">.craftpkg / .zip</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".craftpkg,.zip,application/zip"
                hidden
                onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg border border-dark-border bg-dark-bg">
              <FileArchive size={22} className="text-dark-gold" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#d4c4a0] truncate">{file.name}</p>
                <p className="text-[11px] text-[#8a7a60]">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={reset}
                className="text-[#8a7a60] hover:text-red-400 transition-colors"
                title={t('portage.import.removeFile')}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
          <h3 className="text-base font-semibold text-[#d4c4a0]">{t('portage.import.optionsTitle')}</h3>

          <div className="space-y-2">
            {CONFLICT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${conflictMode === opt.value
                    ? 'bg-dark-gold/10 border-dark-gold/40 ring-1 ring-dark-gold/30'
                    : 'bg-dark-bg border-dark-border hover:border-[#4a4238]'}`}
              >
                <input
                  type="radio"
                  name="conflictMode"
                  className="mt-1 accent-dark-gold"
                  checked={conflictMode === opt.value}
                  onChange={() => setConflictMode(opt.value)}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${conflictMode === opt.value ? 'text-dark-gold' : 'text-[#d4c4a0]'}`}>
                    {t(opt.titleKey)}
                  </p>
                  <p className="text-[11px] text-[#8a7a60] mt-0.5 leading-relaxed">{t(opt.descKey)}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-dark-border">
            <CheckRow
              icon={<ImageIcon size={14} />}
              label={t('portage.import.importImages')}
              checked={importImages}
              onChange={setImportImages}
            />
            <CheckRow
              icon={<Wand2 size={14} />}
              label={t('portage.import.overwriteImages')}
              hint={t('portage.import.overwriteImagesHint')}
              checked={overwriteImages}
              onChange={setOverwriteImages}
              disabled={!importImages}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {reportToShow && (
          <div className="space-y-4">
            <div className={`p-3 rounded-lg border text-xs flex items-start gap-2
              ${applied
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-300'}`}>
              {applied
                ? <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                : <Eye size={16} className="mt-0.5 shrink-0" />}
              <span>
                {applied
                  ? t('portage.import.appliedNotice')
                  : t('portage.import.previewNotice')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SectionSummary title={t('portage.section.categories')} data={reportToShow.categories} />
              <SectionSummary title={t('portage.section.tags')}       data={reportToShow.tags} />
              <SectionSummary title={t('portage.section.items')}      data={reportToShow.items} />
              <SectionSummary title={t('portage.section.recipes')}    data={reportToShow.recipes} />
              <SectionSummary title={t('portage.section.images')}     data={reportToShow.images} />
            </div>

            {reportToShow.warnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-[11px] text-amber-300/90">
                <p className="font-semibold mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert size={12} /> {t('portage.import.warnings', { n: reportToShow.warnings.length })}
                </p>
                <ul className="list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                  {reportToShow.warnings.map((w, i) => (<li key={i}>{w}</li>))}
                </ul>
              </div>
            )}

            {reportToShow.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-[11px] text-red-300/90">
                <p className="font-semibold mb-1.5 flex items-center gap-1.5">
                  <AlertCircle size={12} /> {t('portage.import.errors', { n: reportToShow.errors.length })}
                </p>
                <ul className="list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                  {reportToShow.errors.map((w, i) => (<li key={i}>{w}</li>))}
                </ul>
              </div>
            )}

            <DetailGroup title={t('portage.section.items')}      rows={reportToShow.itemRows} />
            <DetailGroup title={t('portage.section.categories')} rows={reportToShow.categoryRows} />
            <DetailGroup title={t('portage.section.tags')}       rows={reportToShow.tagRows} />
            <DetailGroup title={t('portage.section.images')}     rows={reportToShow.imageRows} />
          </div>
        )}
      </div>

      <aside className="bg-dark-card border border-dark-border rounded-xl p-5 flex flex-col gap-3 h-fit xl:sticky xl:top-2">
        <h3 className="text-base font-semibold text-[#d4c4a0]">{t('portage.import.actionsTitle')}</h3>
        <p className="text-xs text-[#8a7a60]">{t('portage.import.actionsHint')}</p>

        <button
          onClick={runDryRun}
          disabled={!file || busy}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
            bg-dark-bg text-[#d4c4a0] border border-dark-border font-medium text-sm
            hover:border-dark-gold/40 hover:text-dark-gold transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy && !applied ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          {t('portage.import.dryRun')}
        </button>

        <button
          onClick={apply}
          disabled={!file || busy || !preview}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
            bg-dark-gold/20 text-dark-gold border border-dark-gold/40 font-medium text-sm
            hover:bg-dark-gold/30 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy && preview ? <Loader2 size={14} className="animate-spin" /> : <ListChecks size={14} />}
          {t('portage.import.apply')}
        </button>

        {!preview && file && !busy && (
          <p className="text-[11px] text-[#8a7a60] italic">{t('portage.import.dryRunFirst')}</p>
        )}
      </aside>
    </div>
  )
}

function CheckRow({
  icon, label, hint, checked, onChange, disabled,
}: {
  icon: React.ReactNode; label: string; hint?: string;
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        className="mt-0.5 accent-dark-gold w-3.5 h-3.5"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#d4c4a0] flex items-center gap-1.5">
          <span className="text-[#8a7a60]">{icon}</span>
          {label}
        </p>
        {hint && <p className="text-[11px] text-[#8a7a60] mt-0.5">{hint}</p>}
      </div>
    </label>
  )
}

function DetailGroup({ title, rows }: { title: string; rows: ImportReport['itemRows'] }) {
  if (!rows.length) return null
  return (
    <details className="bg-dark-card border border-dark-border rounded-xl">
      <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-[#d4c4a0] uppercase tracking-wider flex items-center justify-between">
        {title}
        <span className="text-[11px] text-[#8a7a60]">{rows.length}</span>
      </summary>
      <div className="border-t border-dark-border max-h-[260px] overflow-y-auto divide-y divide-dark-border/40">
        {rows.map((r, i) => (
          <div key={i} className="px-4 py-2 flex items-center gap-2.5 text-xs">
            <ActionBadge action={r.action} />
            <span className="flex-1 truncate text-[#d4c4a0]">{r.identifier}</span>
            {r.detail && <span className="text-[11px] text-[#8a7a60] truncate max-w-[40%]">{r.detail}</span>}
          </div>
        ))}
      </div>
    </details>
  )
}
