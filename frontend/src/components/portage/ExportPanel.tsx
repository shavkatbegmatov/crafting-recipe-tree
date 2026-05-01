import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Search, CheckSquare, Square, Loader2, AlertCircle, Info, Boxes, Layers, Tag as TagIcon, Globe2 } from 'lucide-react'
import { useCategories, useItems, useTags } from '../../hooks/useItems'
import { useLocalizedField } from '../../hooks/useLanguage'
import { downloadExport, fetchExportPreview, type ExportPreview, type ExportSelectionParams } from '../../api/portage'
import StatChip from './StatChip'

type Mode = 'all' | 'category' | 'tag' | 'pick'

export default function ExportPanel() {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { data: items, isLoading: itemsLoading } = useItems()
  const { data: categories } = useCategories()
  const { data: tags } = useTags()

  const [mode, setMode] = useState<Mode>('all')
  const [categoryCode, setCategoryCode] = useState('')
  const [tagCode, setTagCode] = useState('')
  const [pickedIds, setPickedIds] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [withDeps, setWithDeps] = useState(true)
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (mode === 'category' && !categoryCode && categories?.length) {
      setCategoryCode(categories[0].code)
    }
    if (mode === 'tag' && !tagCode && tags?.length) {
      setTagCode(tags[0].code)
    }
  }, [mode, categoryCode, tagCode, categories, tags])

  const selection: ExportSelectionParams | null = useMemo(() => {
    if (mode === 'all') return { all: true, withDependencies: false }
    if (mode === 'category') return categoryCode ? { category: categoryCode, withDependencies: withDeps } : null
    if (mode === 'tag') return tagCode ? { tag: tagCode, withDependencies: withDeps } : null
    if (mode === 'pick') {
      if (!pickedIds.size) return null
      return { ids: Array.from(pickedIds), withDependencies: withDeps }
    }
    return null
  }, [mode, categoryCode, tagCode, pickedIds, withDeps])

  useEffect(() => {
    if (!selection) {
      setPreview(null)
      return
    }
    let cancelled = false
    const handle = setTimeout(async () => {
      setPreviewing(true)
      setPreviewError(null)
      try {
        const data = await fetchExportPreview(selection)
        if (!cancelled) setPreview(data)
      } catch (err) {
        if (!cancelled) {
          setPreview(null)
          setPreviewError(err instanceof Error ? err.message : 'Preview xatosi')
        }
      } finally {
        if (!cancelled) setPreviewing(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [selection])

  const filteredItems = useMemo(() => {
    if (!items) return []
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => getField(it, 'name').toLowerCase().includes(q))
  }, [items, search, getField])

  const togglePicked = (id: number) => {
    setPickedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const setAllPicked = (ids: number[]) => setPickedIds(new Set(ids))
  const clearPicked = () => setPickedIds(new Set())

  const handleDownload = async () => {
    if (!selection) return
    setDownloading(true)
    try {
      await downloadExport(selection)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Yuklab olishda xato')
    } finally {
      setDownloading(false)
    }
  }

  const previewImageCount = preview?.items.filter((i) => i.imageFilename).length ?? 0

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
      <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-5">
        <header>
          <h3 className="text-base font-semibold text-[#d4c4a0]">{t('portage.export.scope')}</h3>
          <p className="text-xs text-[#8a7a60] mt-0.5">{t('portage.export.scopeHint')}</p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ModeButton active={mode === 'all'} onClick={() => setMode('all')} icon={<Globe2 size={14} />}
            label={t('portage.mode.all')} />
          <ModeButton active={mode === 'category'} onClick={() => setMode('category')} icon={<Layers size={14} />}
            label={t('portage.mode.category')} />
          <ModeButton active={mode === 'tag'} onClick={() => setMode('tag')} icon={<TagIcon size={14} />}
            label={t('portage.mode.tag')} />
          <ModeButton active={mode === 'pick'} onClick={() => setMode('pick')} icon={<Boxes size={14} />}
            label={t('portage.mode.pick')} />
        </div>

        {mode === 'category' && (
          <div className="flex flex-wrap gap-2">
            {categories?.map((c) => (
              <button
                key={c.code}
                onClick={() => setCategoryCode(c.code)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  categoryCode === c.code
                    ? 'bg-dark-gold/20 text-dark-gold border-dark-gold/40'
                    : 'bg-dark-bg text-[#8a7a60] border-dark-border hover:text-[#d4c4a0] hover:border-[#4a4238]'
                }`}
              >
                {getField(c, 'name')}
                <span className="ml-1.5 text-[10px] text-[#8a7a60]">{c.code}</span>
              </button>
            ))}
          </div>
        )}

        {mode === 'tag' && (
          <div className="flex flex-wrap gap-2">
            {tags?.map((t2) => (
              <button
                key={t2.code}
                onClick={() => setTagCode(t2.code)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  tagCode === t2.code
                    ? 'bg-dark-gold/20 text-dark-gold border-dark-gold/40'
                    : 'bg-dark-bg text-[#8a7a60] border-dark-border hover:text-[#d4c4a0] hover:border-[#4a4238]'
                }`}
              >
                {getField(t2, 'name')}
              </button>
            ))}
          </div>
        )}

        {mode === 'pick' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a7a60]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('portage.export.searchItems')}
                  className="w-full bg-dark-bg border border-dark-border rounded-md pl-8 pr-3 py-1.5
                    text-xs text-[#d4c4a0] placeholder:text-[#8a7a60]/60
                    focus:outline-none focus:border-dark-gold/40"
                />
              </div>
              <button
                onClick={() => setAllPicked(filteredItems.map((i) => i.id))}
                className="text-[11px] px-2.5 py-1.5 rounded-md text-[#8a7a60] border border-dark-border hover:text-dark-gold hover:border-dark-gold/40"
                disabled={!filteredItems.length}
              >
                {t('portage.export.selectAllShown')}
              </button>
              <button
                onClick={clearPicked}
                className="text-[11px] px-2.5 py-1.5 rounded-md text-[#8a7a60] border border-dark-border hover:text-red-400 hover:border-red-500/40"
                disabled={!pickedIds.size}
              >
                {t('portage.export.clearSelection')}
              </button>
            </div>

            <div className="max-h-[340px] overflow-y-auto rounded-lg border border-dark-border bg-dark-bg/40 divide-y divide-dark-border/50">
              {itemsLoading ? (
                <div className="text-center text-[#8a7a60] text-xs py-6">{t('sidebar.loading')}</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center text-[#8a7a60] text-xs py-6">{t('itemList.empty')}</div>
              ) : (
                filteredItems.map((it) => {
                  const picked = pickedIds.has(it.id)
                  return (
                    <button
                      key={it.id}
                      onClick={() => togglePicked(it.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-xs transition-colors
                        ${picked ? 'bg-dark-gold/10 text-[#d4c4a0]' : 'text-[#8a7a60] hover:text-[#d4c4a0] hover:bg-dark-hover/40'}`}
                    >
                      {picked ? (
                        <CheckSquare size={14} className="text-dark-gold" />
                      ) : (
                        <Square size={14} className="text-[#8a7a60]" />
                      )}
                      <span className="flex-1 truncate">{getField(it, 'name')}</span>
                      <span className="text-[10px] text-[#8a7a60]/70 font-mono">{it.categoryCode}</span>
                    </button>
                  )
                })
              )}
            </div>
            <p className="text-[11px] text-[#8a7a60]">
              {t('portage.export.pickedCount', { n: pickedIds.size })}
            </p>
          </div>
        )}

        {mode !== 'all' && (
          <label className="flex items-center gap-2 text-xs text-[#d4c4a0] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={withDeps}
              onChange={(e) => setWithDeps(e.target.checked)}
              className="accent-dark-gold w-3.5 h-3.5"
            />
            {t('portage.export.withDependencies')}
            <Info
              size={12}
              className="text-[#8a7a60]"
              aria-label={t('portage.export.withDependenciesHint')}
            />
            <span className="text-[11px] text-[#8a7a60]">{t('portage.export.withDependenciesHint')}</span>
          </label>
        )}
      </div>

      <aside className="bg-dark-card border border-dark-border rounded-xl p-5 flex flex-col gap-4 h-fit xl:sticky xl:top-2">
        <header>
          <h3 className="text-base font-semibold text-[#d4c4a0]">{t('portage.export.previewTitle')}</h3>
          <p className="text-xs text-[#8a7a60] mt-0.5">{t('portage.export.previewHint')}</p>
        </header>

        {!selection ? (
          <p className="text-xs text-[#8a7a60] italic">{t('portage.export.previewEmpty')}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <StatChip label={t('portage.preview.items')}      value={preview?.items.length ?? '—'}      tone="gold" />
              <StatChip label={t('portage.preview.recipes')}    value={preview?.manifest.recipeRowsCount ?? '—'} tone="sky" />
              <StatChip label={t('portage.preview.categories')} value={preview?.categories.length ?? '—'} tone="default" />
              <StatChip label={t('portage.preview.tags')}       value={preview?.tags.length ?? '—'}       tone="default" />
              <StatChip label={t('portage.preview.images')}     value={previewImageCount}                  tone="muted" />
            </div>

            {previewing && (
              <p className="flex items-center gap-2 text-[11px] text-[#8a7a60]">
                <Loader2 size={12} className="animate-spin" /> {t('portage.preview.calculating')}
              </p>
            )}

            {previewError && (
              <p className="flex items-start gap-2 text-[11px] text-red-400">
                <AlertCircle size={12} className="mt-0.5" /> {previewError}
              </p>
            )}

            <button
              onClick={handleDownload}
              disabled={!preview || downloading || previewing || !preview.items.length}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                bg-dark-gold/20 text-dark-gold border border-dark-gold/40 font-medium text-sm
                hover:bg-dark-gold/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {t('portage.export.download')}
            </button>
          </>
        )}
      </aside>
    </div>
  )
}

function ModeButton({
  active, onClick, icon, label,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
        active
          ? 'bg-dark-gold/20 text-dark-gold border-dark-gold/40'
          : 'bg-dark-bg text-[#8a7a60] border-dark-border hover:text-[#d4c4a0] hover:border-[#4a4238]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
