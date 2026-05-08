import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Loader2, AlertTriangle, Check, SkipForward, Replace, HelpCircle } from 'lucide-react'
import { useLocalizedField } from '../../hooks/useLanguage'
import { useCategories } from '../../hooks/useItems'
import { useCopyRecipeTreeFromVersion } from '../../hooks/useRecipes'
import type { ConflictPolicy, CopyTreeReport, CopyTreeReportEntry } from '../../api/recipes'
import ItemImageIcon from '../ui/ItemImageIcon'
import { DEFAULT_CATEGORY_COLOR } from '../../utils/constants'

interface Props {
  itemId: number
  itemName: string
  fromVersion: string
  toVersion: string
  onClose: () => void
  onSuccess: (report: CopyTreeReport) => void
}

export default function CopyTreeDialog({
  itemId,
  itemName,
  fromVersion,
  toVersion,
  onClose,
  onSuccess,
}: Props) {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { data: categories } = useCategories()

  const [policy, setPolicy] = useState<ConflictPolicy>('SKIP_EXISTING')
  const [preview, setPreview] = useState<CopyTreeReport | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const treeMutation = useCopyRecipeTreeFromVersion(itemId)

  // Refresh preview whenever the policy changes.
  useEffect(() => {
    let cancelled = false
    setPreview(null)
    setPreviewError(null)
    treeMutation
      .mutateAsync({ fromVersion, toVersion, policy, dryRun: true })
      .then((report) => {
        if (!cancelled) setPreview(report)
      })
      .catch((err) => {
        if (!cancelled) {
          setPreviewError(
            err?.response?.data?.message ?? err?.message ?? t('recipeEditor.copyTreePreviewError'),
          )
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy, fromVersion, toVersion])

  const colorForCategory = (code: string | null) =>
    (code && categories?.find((c) => c.code === code)?.color) || DEFAULT_CATEGORY_COLOR

  const handleConfirm = async () => {
    try {
      const report = await treeMutation.mutateAsync({
        fromVersion,
        toVersion,
        policy,
        dryRun: false,
      })
      onSuccess(report)
    } catch (err) {
      // Surface the same error inline as preview did
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setPreviewError(e?.response?.data?.message ?? e?.message ?? t('recipeEditor.copyTreePreviewError'))
    }
  }

  const isPreviewing = treeMutation.isPending && !preview
  const isConfirming = treeMutation.isPending && !!preview

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-dark-card border border-dark-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-dark-border">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#d4c4a0] truncate">
              {t('recipeEditor.copyTreeTitle', { itemName })}
            </h2>
            <p className="text-xs text-[#8a7a60] mt-1 font-mono">
              {fromVersion} <span className="text-[#5a4e3a]">→</span> {toVersion}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8a7a60] hover:text-[#d4c4a0] transition-colors shrink-0"
            title={t('edit.cancel')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Policy selector */}
          <fieldset className="space-y-1.5">
            <legend className="text-xs text-[#8a7a60] mb-1.5">
              {t('recipeEditor.copyTreePolicyLabel')}
            </legend>
            {(
              [
                { v: 'SKIP_EXISTING', icon: SkipForward, label: 'copyTreePolicySkip' },
                { v: 'OVERWRITE_ALL', icon: Replace, label: 'copyTreePolicyOverwrite' },
                { v: 'FILL_GAPS_ONLY', icon: HelpCircle, label: 'copyTreePolicyFill' },
              ] as const
            ).map(({ v, icon: Icon, label }) => (
              <label
                key={v}
                className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${
                  policy === v
                    ? 'border-dark-gold/50 bg-dark-gold/10'
                    : 'border-dark-border hover:border-dark-border/80 bg-dark-bg/40'
                }`}
              >
                <input
                  type="radio"
                  name="conflict-policy"
                  value={v}
                  checked={policy === v}
                  onChange={() => setPolicy(v)}
                  className="accent-dark-gold"
                />
                <Icon size={14} className="text-[#8a7a60]" />
                <span className="text-sm text-[#d4c4a0]">
                  {t(`recipeEditor.${label}`)}
                </span>
              </label>
            ))}
          </fieldset>

          {/* Preview section */}
          <div className="border-t border-dark-border pt-4">
            <h3 className="text-xs font-medium text-[#8a7a60] mb-2">
              {t('recipeEditor.copyTreePreviewTitle')}
            </h3>

            {isPreviewing && (
              <div className="flex items-center gap-2 text-sm text-[#8a7a60] py-4">
                <Loader2 size={14} className="animate-spin" />
                {t('recipeEditor.copyTreePreviewLoading')}
              </div>
            )}

            {previewError && !isPreviewing && (
              <div className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span className="break-words">{previewError}</span>
              </div>
            )}

            {preview && !isPreviewing && (
              <div className="space-y-3">
                {preview.maxDepthReached && (
                  <div className="flex items-start gap-2 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    <span>{t('recipeEditor.copyTreeMaxDepthWarning')}</span>
                  </div>
                )}

                <PreviewSection
                  title={t('recipeEditor.copyTreeWillCopy', { count: preview.copied.length })}
                  entries={preview.copied}
                  variant="copied"
                  getColor={colorForCategory}
                  getName={(e) => getField(toItemLike(e), 'name')}
                />
                {preview.overwritten.length > 0 && (
                  <PreviewSection
                    title={t('recipeEditor.copyTreeWillOverwrite', { count: preview.overwritten.length })}
                    entries={preview.overwritten}
                    variant="overwritten"
                    getColor={colorForCategory}
                    getName={(e) => getField(toItemLike(e), 'name')}
                  />
                )}
                {preview.skipped.length > 0 && (
                  <PreviewSection
                    title={t('recipeEditor.copyTreeWillSkip', { count: preview.skipped.length })}
                    entries={preview.skipped}
                    variant="skipped"
                    getColor={colorForCategory}
                    getName={(e) => getField(toItemLike(e), 'name')}
                  />
                )}
                {preview.missingInSource.length > 0 && (
                  <PreviewSection
                    title={t('recipeEditor.copyTreeMissingInSource', {
                      count: preview.missingInSource.length,
                    })}
                    entries={preview.missingInSource}
                    variant="missing"
                    getColor={colorForCategory}
                    getName={(e) => getField(toItemLike(e), 'name')}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-dark-border bg-dark-bg/40">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="px-3 py-2 rounded text-sm text-[#8a7a60] hover:text-[#d4c4a0] hover:bg-dark-hover transition-colors disabled:opacity-50"
          >
            {t('edit.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!preview || isConfirming || (preview && preview.copied.length + preview.overwritten.length === 0)}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {t('recipeEditor.copyTreeConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

// -- Helpers ----------------------------------------------------------------

interface PreviewSectionProps {
  title: string
  entries: CopyTreeReportEntry[]
  variant: 'copied' | 'overwritten' | 'skipped' | 'missing'
  getColor: (code: string | null) => string
  getName: (entry: CopyTreeReportEntry) => string
}

function PreviewSection({ title, entries, variant, getColor, getName }: PreviewSectionProps) {
  const accent: Record<typeof variant, string> = {
    copied: 'text-emerald-300',
    overwritten: 'text-amber-300',
    skipped: 'text-[#8a7a60]',
    missing: 'text-sky-300',
  }
  return (
    <details open={variant === 'copied' || variant === 'overwritten'} className="group">
      <summary className={`text-xs cursor-pointer select-none flex items-center gap-1.5 ${accent[variant]}`}>
        <span>{title}</span>
      </summary>
      {entries.length === 0 ? (
        <p className="text-xs text-[#5a4e3a] mt-1.5 ml-3">—</p>
      ) : (
        <ul className="mt-1.5 ml-1 space-y-1 max-h-40 overflow-y-auto pr-1">
          {entries.map((e) => {
            const color = getColor(e.categoryCode)
            return (
              <li
                key={`${variant}-${e.itemId}`}
                className="flex items-center gap-2 text-sm py-0.5"
              >
                <ItemImageIcon
                  imageUrl={e.imageUrl}
                  alt={e.itemName}
                  size={18}
                  fallbackColor={color}
                />
                <span style={{ color }} className="truncate">
                  {getName(e)}
                </span>
                {e.categoryCode && (
                  <span className="text-[10px] text-[#5a4e3a] ml-auto font-mono shrink-0">
                    {e.categoryCode}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </details>
  )
}

/** Adapt a report entry to the shape `useLocalizedField` expects (name/nameUz/nameEn/nameUzCyr). */
function toItemLike(e: CopyTreeReportEntry) {
  return {
    name: e.itemName,
    nameUz: e.itemNameUz,
    nameEn: e.itemNameEn,
    nameUzCyr: e.itemNameUzCyr,
  }
}
