import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Plus, ListPlus, Loader2, Check, AlertTriangle, Eye,
  Trash2, Search, CheckSquare, Square,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGoBack } from '../hooks/useGoBack'
import { useContentWidth } from '../hooks/useContentWidth'
import { useCategories, useItems } from '../hooks/useItems'
import { useLocalizedField } from '../hooks/useLanguage'
import { useGameVersion } from '../contexts/GameVersionContext'
import { useCreateItem, useCreateItemsBulk, useDeleteItems } from '../hooks/useCreateItems'
import type { CreateItemData, BulkCreateResult, DeleteItemsResult } from '../api/items'
import type { CraftItem } from '../api/types'

type Tab = 'single' | 'bulk' | 'delete'

/**
 * Yangi item yaratish: bittalab yoki ro'yxatdan ommaviy.
 *
 * Itemlar versiyaga bog'langan, shuning uchun ular DOIM tanlangan versiyada
 * yaratiladi — sahifa tepasida qaysi versiya ekani ko'rsatib turiladi.
 */
export default function AdminItemsPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const goBack = useGoBack('/')
  const contentWidth = useContentWidth('max-w-4xl')
  const { effectiveVersion } = useGameVersion()
  const { data: categories } = useCategories()
  const { data: items } = useItems()
  const [tab, setTab] = useState<Tab>('single')

  if (!isAdmin) return <Navigate to="/" />

  return (
    <div className={`${contentWidth} space-y-5`}>
      <header>
        <button
          type="button"
          onClick={goBack}
          className="text-xs text-skin-muted hover:text-dark-gold inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={12} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-display tracking-wide text-skin-base flex items-center gap-2">
          <Plus size={18} className="text-dark-gold" />
          {t('itemCreate.pageTitle')}
        </h1>
        <p className="text-xs text-skin-muted mt-1">
          {t('itemCreate.pageHint', {
            version: effectiveVersion ?? '—',
            count: items?.length ?? 0,
          })}
        </p>
      </header>

      <nav className="flex border-b border-dark-border">
        <TabButton
          active={tab === 'single'}
          onClick={() => setTab('single')}
          icon={<Plus size={14} />}
          label={t('itemCreate.tabSingle')}
        />
        <TabButton
          active={tab === 'bulk'}
          onClick={() => setTab('bulk')}
          icon={<ListPlus size={14} />}
          label={t('itemCreate.tabBulk')}
        />
        <TabButton
          active={tab === 'delete'}
          onClick={() => setTab('delete')}
          icon={<Trash2 size={14} />}
          label={t('itemCreate.tabDelete')}
        />
      </nav>

      {tab === 'single' && <SinglePanel categories={categories} />}
      {tab === 'bulk' && <BulkPanel categories={categories} />}
      {tab === 'delete' && <DeletePanel items={items} />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
        active
          ? 'border-dark-gold text-dark-gold'
          : 'border-transparent text-skin-muted hover:text-skin-base'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// -- Bittalab ---------------------------------------------------------------

interface Category {
  id: number
  code: string
  nameRu: string
}

const emptyForm: CreateItemData = {
  name: '',
  nameUz: '',
  nameEn: '',
  nameUzCyr: '',
  description: '',
  descriptionUz: '',
  descriptionEn: '',
  descriptionUzCyr: '',
  craftTimeSeconds: 0,
}

function SinglePanel({ categories }: { categories?: Category[] }) {
  const { t } = useTranslation()
  const mutation = useCreateItem()
  const [form, setForm] = useState<CreateItemData>(emptyForm)
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [showDescriptions, setShowDescriptions] = useState(false)
  const [created, setCreated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof CreateItemData, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }))

  const canSubmit = form.name.trim().length > 0 && categoryId !== '' && !mutation.isPending

  const submit = async () => {
    setError(null)
    setCreated(null)
    try {
      const item = await mutation.mutateAsync({ ...form, categoryId: Number(categoryId) })
      setCreated(item.name)
      setForm(emptyForm)
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setError(err?.response?.data?.message ?? err?.message ?? String(e))
    }
  }

  return (
    <section className="panel p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t('itemCreate.category')} required>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-skin-base focus:outline-none focus:border-dark-gold/50"
          >
            <option value="">—</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameRu} ({c.code})
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('itemCreate.craftTime')}>
          <input
            type="number"
            min={0}
            value={form.craftTimeSeconds ?? 0}
            onChange={(e) => set('craftTimeSeconds', Number(e.target.value))}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-skin-base focus:outline-none focus:border-dark-gold/50 font-mono"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t('edit.nameRu')} required>
          <TextInput value={form.name} onChange={(v) => set('name', v)} />
        </Field>
        <Field label={t('edit.nameUz')}>
          <TextInput value={form.nameUz ?? ''} onChange={(v) => set('nameUz', v)} />
        </Field>
        <Field label={t('edit.nameEn')}>
          <TextInput value={form.nameEn ?? ''} onChange={(v) => set('nameEn', v)} />
        </Field>
        <Field label={t('edit.nameUzCyr')}>
          <TextInput value={form.nameUzCyr ?? ''} onChange={(v) => set('nameUzCyr', v)} />
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setShowDescriptions((v) => !v)}
        className="text-xs text-skin-muted hover:text-dark-gold"
      >
        {showDescriptions ? '− ' : '+ '}
        {t('itemCreate.toggleDescriptions')}
      </button>

      {showDescriptions && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('edit.descRu')}>
            <TextInput value={form.description ?? ''} onChange={(v) => set('description', v)} />
          </Field>
          <Field label={t('edit.descUz')}>
            <TextInput value={form.descriptionUz ?? ''} onChange={(v) => set('descriptionUz', v)} />
          </Field>
          <Field label={t('edit.descEn')}>
            <TextInput value={form.descriptionEn ?? ''} onChange={(v) => set('descriptionEn', v)} />
          </Field>
          <Field label={t('edit.descUzCyr')}>
            <TextInput
              value={form.descriptionUzCyr ?? ''}
              onChange={(v) => set('descriptionUzCyr', v)}
            />
          </Field>
        </div>
      )}

      <p className="text-xs text-skin-dark">{t('itemCreate.translationHint')}</p>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {t('itemCreate.submit')}
        </button>
        {created && (
          <span className="text-xs text-emerald-300 flex items-center gap-1.5">
            <Check size={13} />
            {t('itemCreate.created', { name: created })}
          </span>
        )}
      </div>

      {error && <ErrorBox message={error} />}
    </section>
  )
}

// -- Ommaviy ----------------------------------------------------------------

/**
 * Bir qator = bitta item. Maydonlar `;` yoki tabulyatsiya bilan ajratiladi:
 *   Nomi ; Kategoriya ; NomiUZ ; NomiEN ; NomiUZCYR ; KraftVaqti
 * Faqat nom majburiy — kategoriya ko'rsatilmasa yuqoridagi tanlov ishlatiladi.
 */
function parseLines(text: string): CreateItemData[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'))
    .map((line) => {
      const parts = line.split(/[;\t]/).map((p) => p.trim())
      const [name, categoryCode, nameUz, nameEn, nameUzCyr, craftTime] = parts
      const row: CreateItemData = { name }
      if (categoryCode) row.categoryCode = categoryCode
      if (nameUz) row.nameUz = nameUz
      if (nameEn) row.nameEn = nameEn
      if (nameUzCyr) row.nameUzCyr = nameUzCyr
      const secs = Number(craftTime)
      if (craftTime && Number.isFinite(secs) && secs >= 0) row.craftTimeSeconds = secs
      return row
    })
}

function BulkPanel({ categories }: { categories?: Category[] }) {
  const { t } = useTranslation()
  const mutation = useCreateItemsBulk()
  const [text, setText] = useState('')
  const [defaultCategory, setDefaultCategory] = useState('')
  const [result, setResult] = useState<BulkCreateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parsed = useMemo(() => parseLines(text), [text])

  const run = async (dryRun: boolean) => {
    setError(null)
    try {
      const res = await mutation.mutateAsync({
        items: parsed,
        defaultCategoryCode: defaultCategory || undefined,
        dryRun,
      })
      setResult(res)
      // Haqiqiy qo'shishdan keyin matnni tozalaymiz — takror bosish takror qo'shmaydi.
      if (!dryRun && res.willCreate > 0) setText('')
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setError(err?.response?.data?.message ?? err?.message ?? String(e))
    }
  }

  const previewed = result?.dryRun === true && result.rows.length > 0

  return (
    <section className="panel p-5 space-y-4">
      <Field label={t('itemCreate.defaultCategory')}>
        <select
          value={defaultCategory}
          onChange={(e) => setDefaultCategory(e.target.value)}
          className="w-full sm:w-72 bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-skin-base focus:outline-none focus:border-dark-gold/50"
        >
          <option value="">—</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.code}>
              {c.nameRu} ({c.code})
            </option>
          ))}
        </select>
      </Field>

      <div>
        <label className="block text-xs text-skin-muted mb-1">{t('itemCreate.listLabel')}</label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setResult(null)
          }}
          rows={10}
          spellCheck={false}
          placeholder={'Кремний\nМедь; RAW\nСталь; MATERIAL; Po`lat; Steel; Пўлат; 12'}
          className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-skin-base focus:outline-none focus:border-dark-gold/50 font-mono resize-y"
        />
        <p className="text-xs text-skin-dark mt-1 whitespace-pre-line">
          {t('itemCreate.formatHint')}
        </p>
        {parsed.length > 0 && (
          <p className="text-xs text-skin-muted mt-1">
            {t('itemCreate.parsedCount', { count: parsed.length })}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => run(true)}
          disabled={parsed.length === 0 || mutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded text-sm text-skin-muted border border-dark-border hover:text-skin-base hover:border-dark-gold/40 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          {t('itemCreate.preview')}
        </button>
        <button
          onClick={() => run(false)}
          disabled={!previewed || (result?.willCreate ?? 0) === 0 || mutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={!previewed ? t('itemCreate.previewFirst') : undefined}
        >
          <ListPlus size={14} />
          {t('itemCreate.confirm', { count: result?.willCreate ?? 0 })}
        </button>
      </div>

      {result && <BulkResult result={result} />}
      {error && <ErrorBox message={error} />}
    </section>
  )
}

function BulkResult({ result }: { result: BulkCreateResult }) {
  const { t } = useTranslation()
  const badge = (status: string) => {
    if (status === 'NEW') return 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10'
    if (status === 'DUPLICATE') return 'text-amber-200 border-amber-400/30 bg-amber-500/10'
    return 'text-red-300 border-red-400/30 bg-red-500/10'
  }
  // Backend kod qaytaradi, matnni shu yerda tarjima qilamiz.
  const statusLabel = (s: string) => t(`itemCreate.status.${s}`, { defaultValue: s })
  const reasonLabel = (r: string | null, detail: string | null) =>
    r ? t(`itemCreate.reason.${r}`, { defaultValue: r, detail: detail ?? '' }) : null
  return (
    <div className="space-y-3 border-t border-dark-border pt-4">
      <div className="flex items-center gap-2 text-sm">
        {result.dryRun ? (
          <span className="text-skin-muted">{t('itemCreate.previewResult', { version: result.version })}</span>
        ) : (
          <span className="text-emerald-300 flex items-center gap-1.5">
            <Check size={14} />
            {t('itemCreate.bulkDone', { count: result.willCreate, version: result.version })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label={t('itemCreate.statNew')} value={result.willCreate} accent="text-emerald-300" />
        <Stat label={t('itemCreate.statDuplicate')} value={result.duplicates} accent="text-amber-200" />
        <Stat label={t('itemCreate.statInvalid')} value={result.invalid} accent="text-red-300" />
      </div>

      <div className="max-h-72 overflow-y-auto rounded border border-dark-border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-dark-bg">
            <tr className="border-b border-dark-border">
              <th className="text-left py-1.5 px-2 text-skin-muted font-medium w-10">#</th>
              <th className="text-left py-1.5 px-2 text-skin-muted font-medium">{t('itemCreate.colName')}</th>
              <th className="text-left py-1.5 px-2 text-skin-muted font-medium w-24">{t('itemCreate.colCategory')}</th>
              <th className="text-left py-1.5 px-2 text-skin-muted font-medium w-40">{t('itemCreate.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.line} className="border-b border-dark-border/40">
                <td className="py-1 px-2 text-skin-dark font-mono">{r.line}</td>
                <td className="py-1 px-2 text-skin-base break-all">{r.name || '—'}</td>
                <td className="py-1 px-2 text-skin-muted font-mono">{r.categoryCode ?? '—'}</td>
                <td className="py-1 px-2">
                  <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] ${badge(r.status)}`}>
                    {statusLabel(r.status)}
                  </span>
                  {r.reason && (
                    <span className="ml-1.5 text-skin-dark">{reasonLabel(r.reason, r.detail)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


// -- O'chirish --------------------------------------------------------------

/**
 * Itemlarni o'chirish. Avval "ko'rib chiqish" — bazaga tegilmaydi, foydalanuvchi
 * nima o'chishini va u bilan birga yana nimalar ketishini ko'radi. O'chirish
 * qaytarilmaydi, shuning uchun tasdiqlash faqat shundan keyin ochiladi.
 */
function DeletePanel({ items }: { items?: CraftItem[] }) {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const mutation = useDeleteItems()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<DeleteItemsResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const list = items ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((i) =>
      [i.name, i.nameUz, i.nameEn, i.nameUzCyr].some((n) => n?.toLowerCase().includes(q)),
    )
  }, [items, search])

  const toggle = (id: number) => {
    setResult(null)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const run = async (dryRun: boolean) => {
    setError(null)
    try {
      const res = await mutation.mutateAsync({ itemIds: [...selected], dryRun })
      setResult(res)
      if (!dryRun && res.deleted > 0) {
        // O'chirilganlar tanlovdan chiqadi, bloklanganlar qoladi — ular hali ham u yerda.
        const gone = new Set(res.rows.filter((r) => r.status === 'DELETABLE').map((r) => r.itemId))
        setSelected((prev) => new Set([...prev].filter((id) => !gone.has(id))))
      }
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setError(err?.response?.data?.message ?? err?.message ?? String(e))
    }
  }

  const previewed = result?.dryRun === true

  return (
    <section className="panel p-5 space-y-4 border-red-500/25">
      <div className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-200">
        <AlertTriangle size={13} className="mt-0.5 shrink-0" />
        <span>{t('itemCreate.deleteWarning')}</span>
      </div>

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

      <ul className="max-h-72 overflow-y-auto pr-1 space-y-0.5 border border-dark-border rounded p-1">
        {filtered.map((item) => {
          const checked = selected.has(item.id)
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="w-full flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-dark-hover/50 transition-colors"
              >
                {checked ? (
                  <CheckSquare size={14} className="text-red-400 shrink-0" />
                ) : (
                  <Square size={14} className="text-skin-dark shrink-0" />
                )}
                <span className="text-sm text-skin-base truncate">{getField(item, 'name')}</span>
                <span className="ml-auto text-[10px] text-skin-dark font-mono shrink-0">
                  {item.categoryCode}
                </span>
              </button>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="text-xs text-skin-dark py-3 text-center">{t('itemList.empty')}</li>
        )}
      </ul>

      <div className="flex items-center gap-2">
        <button
          onClick={() => run(true)}
          disabled={selected.size === 0 || mutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded text-sm text-skin-muted border border-dark-border hover:text-skin-base hover:border-dark-gold/40 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          {t('itemCreate.preview')}
        </button>
        <button
          onClick={() => run(false)}
          disabled={!previewed || (result?.deleted ?? 0) === 0 || mutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={!previewed ? t('itemCreate.previewFirst') : undefined}
        >
          <Trash2 size={14} />
          {t('itemCreate.deleteConfirm', { count: result?.deleted ?? 0 })}
        </button>
        <span className="text-xs text-skin-muted ml-1">
          {t('itemCreate.selectedCount', { count: selected.size })}
        </span>
      </div>

      {result && <DeleteResult result={result} />}
      {error && <ErrorBox message={error} />}
    </section>
  )
}

function DeleteResult({ result }: { result: DeleteItemsResult }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3 border-t border-dark-border pt-4">
      <div className="text-sm">
        {result.dryRun ? (
          <span className="text-skin-muted">
            {t('itemCreate.previewResult', { version: result.version })}
          </span>
        ) : (
          <span className="text-emerald-300 flex items-center gap-1.5">
            <Check size={14} />
            {t('itemCreate.deleteDone', { count: result.deleted, version: result.version })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat
          label={result.dryRun ? t('itemCreate.statWillDelete') : t('itemCreate.statDeleted')}
          value={result.deleted}
          accent="text-red-300"
        />
        <Stat label={t('itemCreate.statBlocked')} value={result.blocked} accent="text-amber-200" />
      </div>

      <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {result.rows.map((r) => {
          const extras: string[] = []
          if (r.ownRecipe) extras.push(t('itemCreate.alsoRecipe'))
          if (r.favorites > 0) extras.push(t('itemCreate.alsoFavorites', { count: r.favorites }))
          if (r.inventory > 0) extras.push(t('itemCreate.alsoInventory', { count: r.inventory }))
          if (r.craftLogs > 0) extras.push(t('itemCreate.alsoCraftLogs', { count: r.craftLogs }))
          const isBlocked = r.status === 'BLOCKED'
          return (
            <li
              key={r.itemId}
              className={`text-xs rounded px-2 py-1.5 border ${
                isBlocked
                  ? 'text-amber-200 border-amber-400/30 bg-amber-500/5'
                  : 'text-skin-base border-dark-border bg-dark-bg/40'
              }`}
            >
              <span className="font-medium">{r.name}</span>
              {isBlocked ? (
                <span className="block text-amber-200/80 mt-0.5">
                  {t('itemCreate.blockedBy', { recipes: r.usedIn.join(', ') })}
                </span>
              ) : (
                extras.length > 0 && (
                  <span className="block text-skin-dark mt-0.5">{extras.join(' · ')}</span>
                )
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// -- Umumiy qismlar ---------------------------------------------------------


function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs text-skin-muted mb-1">
        {label}
        {required && <span className="text-dark-gold ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-skin-base focus:outline-none focus:border-dark-gold/50"
    />
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded border border-dark-border bg-dark-bg/40 px-3 py-2">
      <div className={`text-lg font-mono ${accent}`}>{value}</div>
      <div className="text-xs text-skin-muted">{label}</div>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/30 text-sm text-red-300">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      <span className="break-words">{message}</span>
    </div>
  )
}
