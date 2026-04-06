import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocalizedField } from '../hooks/useLanguage'
import { useItem, useUsedIn, useCategories } from '../hooks/useItems'
import { useAuth } from '../contexts/AuthContext'
import { updateItem } from '../api/items'
import { useQueryClient } from '@tanstack/react-query'
import RecipeTree from '../components/tree/RecipeTree'
import RawTotals from '../components/tree/RawTotals'
import CategoryBadge from '../components/ui/CategoryBadge'
import Spinner from '../components/ui/Spinner'
import { ArrowLeft, ArrowRight, Clock, Beaker, Pencil, Save, X, Loader2, Check } from 'lucide-react'
import ImageUpload from '../components/items/ImageUpload'

export default function ItemDetailPage() {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const { isAdmin } = useAuth()
  const { id } = useParams<{ id: string }>()
  const itemId = Number(id)
  const { data: item, isLoading, error } = useItem(itemId)
  const { data: usedIn } = useUsedIn(itemId)
  const { data: categories } = useCategories()
  const queryClient = useQueryClient()

  // Edit mode state
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editData, setEditData] = useState({
    categoryId: 0,
    name: '', nameUz: '', nameEn: '', nameUzCyr: '',
    description: '', descriptionUz: '', descriptionEn: '', descriptionUzCyr: '',
  })

  const startEdit = () => {
    if (!item) return
    const cat = categories?.find((c) => c.code === item.categoryCode)
    setEditData({
      categoryId: cat?.id || 0,
      name: item.name || '',
      nameUz: item.nameUz || '',
      nameEn: item.nameEn || '',
      nameUzCyr: item.nameUzCyr || '',
      description: item.description || '',
      descriptionUz: item.descriptionUz || '',
      descriptionEn: item.descriptionEn || '',
      descriptionUzCyr: item.descriptionUzCyr || '',
    })
    setEditing(true)
    setSaved(false)
  }

  const cancelEdit = () => {
    setEditing(false)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateItem(itemId, { ...editData, categoryId: Number(editData.categoryId) || undefined })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setSaved(true)
      setTimeout(() => { setEditing(false); setSaved(false) }, 1000)
    } catch {
      // error handling
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{t('detail.notFound')}</p>
        <Link to="/" className="text-dark-gold hover:underline text-sm flex items-center gap-1 justify-center">
          <ArrowLeft size={14} /> {t('detail.goHome')}
        </Link>
      </div>
    )
  }

  const itemName = getField(item, 'name')
  const itemDesc = getField(item, 'description')

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/" className="text-[#8a7a60] hover:text-[#d4c4a0] text-sm flex items-center gap-1 transition-colors">
        <ArrowLeft size={14} /> {t('detail.back')}
      </Link>

      {/* Item info */}
      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        {item.imageUrl && (
          <div className="bg-dark-panel flex items-center justify-center p-4 overflow-hidden">
            <img
              src={item.imageUrl}
              alt={itemName}
              className={item.imageUrl.endsWith('.png')
                ? 'w-16 h-16 object-contain'
                : 'max-w-md w-full h-auto rounded'
              }
            />
          </div>
        )}
        <div className="p-5">
          {/* Header with edit button */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-xl font-semibold text-[#d4c4a0]">{itemName}</h1>
            <div className="flex items-center gap-2">
              <CategoryBadge code={item.categoryCode} size="md" />
              {isAdmin && !editing && (
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1 text-xs text-[#8a7a60] hover:text-dark-gold transition-colors border border-dark-border rounded px-2 py-1 hover:border-dark-gold/40"
                >
                  <Pencil size={12} />
                  {t('edit.button')}
                </button>
              )}
            </div>
          </div>

          {/* Edit mode */}
          {editing ? (
            <div className="space-y-4 mt-4">
              {/* Category selector */}
              <div>
                <label className="block text-xs text-[#8a7a60] mb-1">{t('edit.category')}</label>
                <select
                  value={editData.categoryId}
                  onChange={(e) => updateField('categoryId', e.target.value)}
                  className="w-full sm:w-64 bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50"
                >
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {getField(cat, 'name')} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'name', label: t('edit.nameRu') },
                  { key: 'nameUz', label: t('edit.nameUz') },
                  { key: 'nameEn', label: t('edit.nameEn') },
                  { key: 'nameUzCyr', label: t('edit.nameUzCyr') },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-[#8a7a60] mb-1">{label}</label>
                    <input
                      value={editData[key as keyof typeof editData]}
                      onChange={(e) => updateField(key, e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'description', label: t('edit.descRu') },
                  { key: 'descriptionUz', label: t('edit.descUz') },
                  { key: 'descriptionEn', label: t('edit.descEn') },
                  { key: 'descriptionUzCyr', label: t('edit.descUzCyr') },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-[#8a7a60] mb-1">{label}</label>
                    <textarea
                      value={editData[key as keyof typeof editData]}
                      onChange={(e) => updateField(key, e.target.value)}
                      rows={2}
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50 resize-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                  {saving ? t('edit.saving') : saved ? t('edit.saved') : t('edit.save')}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-sm text-[#8a7a60] border border-dark-border hover:text-[#d4c4a0] hover:border-[#4a4238] transition-colors"
                >
                  <X size={14} />
                  {t('edit.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {itemDesc && (
                <p className="text-sm text-[#8a7a60] mb-4">{itemDesc}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  {item.craftTimeSeconds > 0 && (
                    <div className="flex items-center gap-1.5 text-[#8a7a60]">
                      <Clock size={14} />
                      <span>{t('detail.craftTime')}</span>
                      <span className="font-mono text-[#d4c4a0]">{item.craftTimeSeconds}s</span>
                    </div>
                  )}
                </div>
                {isAdmin && <ImageUpload itemId={itemId} />}
              </div>

              {item.ingredients && item.ingredients.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <h3 className="text-xs font-medium text-[#8a7a60] mb-2 flex items-center gap-1.5">
                    <Beaker size={13} />
                    {t('detail.directIngredients')}
                  </h3>
                  <div className="space-y-1.5">
                    {item.ingredients.map((ing) => (
                      <div key={ing.ingredientItemId} className="flex items-center gap-2 text-sm">
                        <Link
                          to={`/items/${ing.ingredientItemId}`}
                          className="text-[#d4c4a0] hover:text-dark-gold hover:underline transition-colors"
                        >
                          {getField(ing, 'ingredientName')}
                        </Link>
                        <span className="text-[#3a3228]">—</span>
                        <span className="font-mono text-[#8a7a60]">
                          {ing.quantity % 1 === 0 ? ing.quantity : Number(ing.quantity).toFixed(4)}
                        </span>
                        <CategoryBadge code={ing.ingredientCategory} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recipe tree */}
      {!editing && item.categoryCode !== 'RAW' && <RecipeTree itemId={itemId} />}

      {/* Raw totals */}
      {!editing && item.categoryCode !== 'RAW' && <RawTotals itemId={itemId} itemName={itemName} />}

      {/* Used in */}
      {!editing && usedIn && usedIn.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[#d4c4a0] mb-3 flex items-center gap-2">
            <ArrowRight size={16} className="text-[#8a7a60]" />
            {t('detail.usedIn')}
          </h2>
          <div className="space-y-1.5">
            {usedIn.map((u) => (
              <div key={u.itemId} className="flex items-center gap-2 text-sm">
                <Link
                  to={`/items/${u.itemId}`}
                  className="text-[#d4c4a0] hover:text-dark-gold hover:underline transition-colors"
                >
                  {getField(u, 'itemName')}
                </Link>
                <span className="font-mono text-[#8a7a60]">
                  x{u.quantity % 1 === 0 ? u.quantity : Number(u.quantity).toFixed(4)}
                </span>
                <CategoryBadge code={u.categoryCode} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
