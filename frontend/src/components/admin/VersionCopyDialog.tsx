import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { X, Loader2, Check, AlertTriangle, Copy, Search, CheckSquare, Square } from 'lucide-react'
import { fetchItems } from '../../api/items'
import { useCopyFromVersion } from '../../hooks/useGameVersions'
import { useLocalizedField } from '../../hooks/useLanguage'
import { useCategories } from '../../hooks/useItems'
import type { GameVersion } from '../../api/types'
import type { VersionCopyResult } from '../../api/gameVersions'
import ItemImageIcon from '../ui/ItemImageIcon'
import { DEFAULT_CATEGORY_COLOR } from '../../utils/constants'

interface Props {
  target: GameVersion
  versions: GameVersion[]
  onClose: () => void
}

/**
 * Bir versiyadan boshqasiga item (va retsept) nusxalash oynasi.
 *
 * Yangi versiya bo'sh boshlanadi — bu oyna uni to'ldirishning asosiy yo'li.
 */
export default function VersionCopyDialog({ target, versions, onClose }: Props) {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { data: categories } = useCategories()
  const copyMutation = useCopyFromVersion()

  const sources = useMemo(() => versions.filter((v) => v.id !== target.id), [versions, target.id])

  const [sourceId, setSourceId] = useState<number | null>(sources[0]?.id ?? null)
  const [withRecipes, setWithRecipes] = useState(true)
  const [selectAll, setSelectAll] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<VersionCopyResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const source = sources.find((v) => v.id === sourceId) ?? null

  const { data: sourceItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['items', undefined, source?.version],
    queryFn: () => fetchItems(undefined, source!.version),
    enabled: !!source,
  })

  const filtered = useMemo(() => {
    if (!sourceItems) return []
    const q = search.trim().toLowerCase()
    if (!q) return sourceItems
    return sourceItems.filter((i) =>
      [i.name, i.nameUz, i.nameEn, i.nameUzCyr].some((n) => n?.toLowerCase().includes(q)),
    )
  }, [sourceItems, search])

  const colorFor = (code: string) =>
    categories?.find((c) => c.code === code)?.color || DEFAULT_CATEGORY_COLOR

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const chosenCount = selectAll ? (sourceItems?.length ?? 0) : selected.size

  const handleCopy = async () => {
    if (!source) return
    setError(null)
    try {
      const res = await copyMutation.mutateAsync({
        targetId: target.id,
        data: {
          sourceVersionId: source.id,
          itemIds: selectAll ? undefined : [...selected],
          withRecipes,
        },
      })
      setResult(res)
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setError(err?.response?.data?.message ?? err?.message ?? String(e))
    }
  }

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
            <h2 className="text-base font-semibold text-skin-base flex items-center gap-2">
              <Copy size={16} className="text-dark-gold" />
              {t('versionCopy.title')}
            </h2>
            <p className="text-xs text-skin-muted mt-1 font-mono">
              {source?.version ?? '—'} <span className="text-skin-dark">→</span> {target.version}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-skin-muted hover:text-skin-base transition-colors shrink-0"
            title={t('edit.cancel')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {result ? (
            <ResultPanel result={result} />
          ) : (
            <>
              <div>
                <label className="block text-xs text-skin-muted mb-1">{t('versionCopy.source')}</label>
                <select
                  value={sourceId ?? ''}
                  onChange={(e) => {
                    setSourceId(Number(e.target.value))
                    setSelected(new Set())
                  }}
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-skin-base focus:outline-none focus:border-dark-gold/50 font-mono"
                >
                  {sources.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.version}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2 text-sm text-skin-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={withRecipes}
                  onChange={(e) => setWithRecipes(e.target.checked)}
                  className="accent-dark-gold mt-0.5"
                />
                <span>
                  {t('versionCopy.withRecipes')}
                  <span className="block text-xs text-skin-dark">{t('versionCopy.withRecipesHint')}</span>
                </span>
              </label>

              {/* Scope */}
              <fieldset className="space-y-1.5">
                <legend className="text-xs text-skin-muted mb-1.5">{t('versionCopy.scope')}</legend>
                {(
                  [
                    { all: true, label: 'versionCopy.scopeAll' },
                    { all: false, label: 'versionCopy.scopeSelected' },
                  ] as const
                ).map(({ all, label }) => (
                  <label
                    key={String(all)}
                    className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${
                      selectAll === all
                        ? 'border-dark-gold/50 bg-dark-gold/10'
                        : 'border-dark-border hover:border-dark-border/80 bg-dark-bg/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="copy-scope"
                      checked={selectAll === all}
                      onChange={() => setSelectAll(all)}
                      className="accent-dark-gold"
                    />
                    <span className="text-sm text-skin-base">
                      {t(label, { count: sourceItems?.length ?? 0 })}
                    </span>
                  </label>
                ))}
              </fieldset>

              {!selectAll && (
                <div className="border-t border-dark-border pt-3 space-y-2">
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-skin-dark pointer-events-none"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('search.placeholder')}
                      className="w-full bg-dark-bg border border-dark-border rounded pl-8 pr-3 py-1.5 text-sm text-skin-base focus:outline-none focus:border-dark-gold/50"
                    />
                  </div>

                  {itemsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-skin-muted py-4">
                      <Loader2 size={14} className="animate-spin" />
                      {t('versionCopy.loading')}
                    </div>
                  ) : (
                    <ul className="max-h-56 overflow-y-auto pr-1 space-y-0.5">
                      {filtered.map((item) => {
                        const checked = selected.has(item.id)
                        const color = colorFor(item.categoryCode)
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => toggle(item.id)}
                              className="w-full flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-dark-hover/50 transition-colors"
                            >
                              {checked ? (
                                <CheckSquare size={14} className="text-dark-gold shrink-0" />
                              ) : (
                                <Square size={14} className="text-skin-dark shrink-0" />
                              )}
                              <ItemImageIcon
                                imageUrl={item.imageUrl}
                                alt={item.name}
                                size={18}
                                fallbackColor={color}
                              />
                              <span style={{ color }} className="text-sm truncate">
                                {getField(item, 'name')}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                      {filtered.length === 0 && (
                        <li className="text-xs text-skin-dark py-3 text-center">{t('itemList.empty')}</li>
                      )}
                    </ul>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-dark-border bg-dark-bg/40">
          <button
            onClick={onClose}
            disabled={copyMutation.isPending}
            className="px-3 py-2 rounded text-sm text-skin-muted hover:text-skin-base hover:bg-dark-hover transition-colors disabled:opacity-50"
          >
            {result ? t('versionCopy.close') : t('edit.cancel')}
          </button>
          {!result && (
            <button
              onClick={handleCopy}
              disabled={!source || copyMutation.isPending || chosenCount === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copyMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {t('versionCopy.confirm', { count: chosenCount })}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultPanel({ result }: { result: VersionCopyResult }) {
  const { t } = useTranslation()
  const rows = [
    { label: t('versionCopy.itemsCopied'), value: result.itemsCopied, accent: 'text-emerald-300' },
    { label: t('versionCopy.itemsSkipped'), value: result.itemsSkipped, accent: 'text-skin-muted' },
    { label: t('versionCopy.recipesCopied'), value: result.recipesCopied, accent: 'text-emerald-300' },
    { label: t('versionCopy.recipesSkipped'), value: result.recipesSkipped, accent: 'text-skin-muted' },
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-emerald-300">
        <Check size={15} />
        {t('versionCopy.done', { from: result.sourceVersion, to: result.targetVersion })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <div key={r.label} className="rounded border border-dark-border bg-dark-bg/40 px-3 py-2">
            <div className={`text-lg font-mono ${r.accent}`}>{r.value}</div>
            <div className="text-xs text-skin-muted">{r.label}</div>
          </div>
        ))}
      </div>
      {result.warnings.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
            <AlertTriangle size={12} />
            {t('versionCopy.warnings', { count: result.warnings.length })}
          </h3>
          <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {result.warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-200/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
