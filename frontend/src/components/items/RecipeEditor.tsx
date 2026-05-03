import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Save, X, Loader2, Check, Search, Copy } from 'lucide-react'
import type { CraftItem, Recipe } from '../../api/types'
import { useItems, useCategories } from '../../hooks/useItems'
import { useLocalizedField } from '../../hooks/useLanguage'
import { useGameVersion } from '../../contexts/GameVersionContext'
import { useRecipe, useUpsertRecipe, useCopyRecipeFromVersion, useRecipeHistory, useDeleteRecipe } from '../../hooks/useRecipes'
import ItemImageIcon from '../ui/ItemImageIcon'
import { DEFAULT_CATEGORY_COLOR } from '../../utils/constants'

interface Props {
  itemId: number
  itemName: string
  onClose: () => void
}

interface DraftLine {
  ingredientItemId: number
  ingredientName: string
  ingredientImageUrl: string | null
  ingredientCategory: string
  quantity: string
}

export default function RecipeEditor({ itemId, itemName, onClose }: Props) {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { effectiveVersion } = useGameVersion()
  const { data: recipe, isLoading: recipeLoading } = useRecipe(itemId, effectiveVersion)
  const { data: items } = useItems()
  const { data: categories } = useCategories()
  const { data: history } = useRecipeHistory(itemId)

  const upsertMutation = useUpsertRecipe(itemId)
  const copyMutation = useCopyRecipeFromVersion(itemId)
  const deleteMutation = useDeleteRecipe(itemId)

  const [craftTime, setCraftTime] = useState<string>('0')
  const [notes, setNotes] = useState<string>('')
  const [lines, setLines] = useState<DraftLine[]>([])
  const [search, setSearch] = useState<string>('')
  const [savedFlash, setSavedFlash] = useState<boolean>(false)

  // Load existing recipe (or empty draft) when version changes / data arrives.
  useEffect(() => {
    if (recipeLoading) return
    if (recipe) {
      setCraftTime(String(recipe.craftTimeSeconds ?? 0))
      setNotes(recipe.notes ?? '')
      setLines(
        recipe.ingredients.map((ri) => ({
          ingredientItemId: ri.ingredientItemId,
          ingredientName: ri.ingredientName,
          ingredientImageUrl: ri.ingredientImageUrl,
          ingredientCategory: ri.ingredientCategory,
          quantity: String(ri.quantity),
        })),
      )
    } else {
      setCraftTime('0')
      setNotes('')
      setLines([])
    }
  }, [recipe, recipeLoading, effectiveVersion])

  const itemsById = useMemo(() => {
    const map = new Map<number, CraftItem>()
    items?.forEach((it) => map.set(it.id, it))
    return map
  }, [items])

  const colorForCategory = (code: string) =>
    categories?.find((c) => c.code === code)?.color || DEFAULT_CATEGORY_COLOR

  const filteredCandidates = useMemo(() => {
    if (!items || search.trim().length === 0) return []
    const q = search.trim().toLowerCase()
    const usedIds = new Set(lines.map((l) => l.ingredientItemId))
    return items
      .filter((it) => it.id !== itemId && !usedIds.has(it.id))
      .filter((it) =>
        getField(it, 'name').toLowerCase().includes(q) || it.name.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [items, search, itemId, lines, getField])

  const addLine = (it: CraftItem) => {
    setLines((prev) => [
      ...prev,
      {
        ingredientItemId: it.id,
        ingredientName: it.name,
        ingredientImageUrl: it.imageUrl,
        ingredientCategory: it.categoryCode,
        quantity: '1',
      },
    ])
    setSearch('')
  }

  const removeLine = (id: number) =>
    setLines((prev) => prev.filter((l) => l.ingredientItemId !== id))

  const updateQuantity = (id: number, qty: string) =>
    setLines((prev) =>
      prev.map((l) => (l.ingredientItemId === id ? { ...l, quantity: qty } : l)),
    )

  const handleSave = async () => {
    const ct = Number(craftTime)
    const data = {
      craftTimeSeconds: Number.isFinite(ct) ? Math.max(0, Math.floor(ct)) : 0,
      notes: notes.trim() === '' ? null : notes.trim(),
      ingredients: lines
        .filter((l) => l.ingredientItemId > 0)
        .map((l) => ({
          ingredientItemId: l.ingredientItemId,
          quantity: Number(l.quantity) || 0,
        })),
    }
    await upsertMutation.mutateAsync({ version: effectiveVersion ?? null, data })
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
  }

  const handleCopyFrom = async (fromVersion: string) => {
    if (!effectiveVersion) return
    await copyMutation.mutateAsync({
      fromVersion,
      toVersion: effectiveVersion,
      overwrite: true,
    })
  }

  const handleDelete = async () => {
    if (!confirm(t('recipeEditor.deleteConfirm'))) return
    await deleteMutation.mutateAsync(effectiveVersion ?? undefined)
    onClose()
  }

  const otherVersionsForCopy: Recipe[] = useMemo(() => {
    if (!history) return []
    return history.filter((r) => r.gameVersion !== effectiveVersion)
  }, [history, effectiveVersion])

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-[#d4c4a0]">
            {t('recipeEditor.title', { itemName })}
          </h2>
          <p className="text-xs text-[#8a7a60] mt-0.5">
            {t('gameVersion.title')}:{' '}
            <span className="font-mono text-[#d4c4a0]">{effectiveVersion ?? '—'}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[#8a7a60] hover:text-[#d4c4a0] transition-colors"
          title={t('edit.cancel')}
        >
          <X size={18} />
        </button>
      </div>

      {/* Craft time + notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#8a7a60] mb-1">
            {t('detail.craftTime')} (s)
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={craftTime}
            onChange={(e) => setCraftTime(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8a7a60] mb-1">{t('recipeEditor.notes')}</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('recipeEditor.notesPlaceholder')}
            className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50"
          />
        </div>
      </div>

      {/* Ingredient list */}
      <div>
        <h3 className="text-xs font-medium text-[#8a7a60] mb-2 flex items-center gap-1.5">
          {t('detail.directIngredients')}
        </h3>

        {lines.length === 0 && (
          <p className="text-sm text-[#5a4e3a] py-3">{t('recipeEditor.empty')}</p>
        )}

        <div className="space-y-1.5">
          {lines.map((line) => {
            const color = colorForCategory(line.ingredientCategory)
            const fullItem = itemsById.get(line.ingredientItemId)
            const displayName = fullItem ? getField(fullItem, 'name') : line.ingredientName
            return (
              <div
                key={line.ingredientItemId}
                className="flex items-center gap-2 p-2 rounded border border-dark-border/60 bg-dark-bg/40"
              >
                <ItemImageIcon
                  imageUrl={line.ingredientImageUrl}
                  alt={displayName}
                  size={22}
                  fallbackColor={color}
                />
                <span className="text-sm flex-1 min-w-0 truncate" style={{ color }}>
                  {displayName}
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.0001"
                  value={line.quantity}
                  onChange={(e) => updateQuantity(line.ingredientItemId, e.target.value)}
                  className="w-24 bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50 font-mono text-right"
                />
                <button
                  onClick={() => removeLine(line.ingredientItemId)}
                  className="text-[#8a7a60] hover:text-red-400 transition-colors"
                  title={t('edit.cancel')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Add ingredient */}
        <div className="mt-3 relative">
          <div className="flex items-center gap-2 bg-dark-bg border border-dark-border rounded px-2.5 py-1.5">
            <Search size={14} className="text-[#5a4e3a]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('recipeEditor.addIngredientPlaceholder')}
              className="flex-1 bg-transparent text-sm text-[#d4c4a0] focus:outline-none placeholder-[#5a4e3a]"
            />
            <Plus size={14} className="text-[#5a4e3a]" />
          </div>
          {filteredCandidates.length > 0 && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl max-h-72 overflow-y-auto">
              {filteredCandidates.map((it) => {
                const color = colorForCategory(it.categoryCode)
                return (
                  <button
                    key={it.id}
                    onClick={() => addLine(it)}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-dark-hover transition-colors"
                  >
                    <ItemImageIcon
                      imageUrl={it.imageUrl}
                      alt={it.name}
                      size={20}
                      fallbackColor={color}
                    />
                    <span style={{ color }}>{getField(it, 'name')}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Copy from another version */}
      {otherVersionsForCopy.length > 0 && (
        <details className="text-xs text-[#8a7a60]">
          <summary className="cursor-pointer hover:text-[#d4c4a0] flex items-center gap-1.5 select-none">
            <Copy size={12} />
            {t('recipeEditor.copyFromTitle')}
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {otherVersionsForCopy.map((r) => (
              <button
                key={r.id}
                onClick={() => handleCopyFrom(r.gameVersion)}
                className="text-xs px-2.5 py-1 rounded border border-dark-border hover:border-dark-gold/40 hover:text-[#d4c4a0] transition-colors font-mono"
                disabled={copyMutation.isPending}
              >
                {r.gameVersion}
              </button>
            ))}
          </div>
        </details>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dark-border">
        <button
          onClick={handleSave}
          disabled={upsertMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors disabled:opacity-50"
        >
          {upsertMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : savedFlash ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {savedFlash ? t('edit.saved') : upsertMutation.isPending ? t('edit.saving') : t('edit.save')}
        </button>

        {recipe && (
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors disabled:opacity-50 ml-auto"
          >
            <Trash2 size={14} />
            {t('recipeEditor.deleteVersion')}
          </button>
        )}
      </div>
    </div>
  )
}
