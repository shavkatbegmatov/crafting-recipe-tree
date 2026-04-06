import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useCategories } from '../hooks/useItems'
import { useLocalizedField } from '../hooks/useLanguage'
import { createCategory, updateCategory, deleteCategory } from '../api/items'
import type { Category } from '../api/types'
import type { UpdateCategoryData } from '../api/items'
import { useQueryClient } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Loader2, Check } from 'lucide-react'

const AVAILABLE_ICONS = ['Package', 'Layers', 'Box', 'Cpu', 'Gem', 'Zap', 'Wrench', 'FlaskConical']

export default function AdminCategoriesPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const { getField } = useLocalizedField()
  const { data: categories, isLoading } = useCategories()
  const queryClient = useQueryClient()

  const [editingId, setEditingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<UpdateCategoryData>({
    code: '', nameRu: '', nameUz: '', nameEn: '', nameUzCyr: '',
    color: '#8a7a60', icon: 'Package', sortOrder: 0,
  })

  if (!isAdmin) return <Navigate to="/" />

  const startEdit = (cat: Category) => {
    setForm({
      code: cat.code, nameRu: cat.nameRu, nameUz: cat.nameUz,
      nameEn: cat.nameEn, nameUzCyr: cat.nameUzCyr,
      color: cat.color, icon: cat.icon, sortOrder: cat.sortOrder,
    })
    setEditingId(cat.id)
    setCreating(false)
  }

  const startCreate = () => {
    setForm({
      code: '', nameRu: '', nameUz: '', nameEn: '', nameUzCyr: '',
      color: '#8a7a60', icon: 'Package', sortOrder: (categories?.length || 0) + 1,
    })
    setCreating(true)
    setEditingId(null)
  }

  const cancel = () => {
    setEditingId(null)
    setCreating(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (creating) {
        await createCategory(form)
      } else if (editingId) {
        await updateCategory(editingId, form)
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      cancel()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.confirmDelete'))) return
    try {
      await deleteCategory(id)
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    } catch (err) {
      console.error(err)
    }
  }

  const updateField = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isEditing = editingId !== null || creating

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-[#8a7a60] hover:text-[#d4c4a0] transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-semibold text-[#d4c4a0]">{t('admin.categories')}</h1>
        </div>
        {!isEditing && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors"
          >
            <Plus size={14} />
            {t('admin.addCategory')}
          </button>
        )}
      </div>

      {/* Edit/Create form */}
      {isEditing && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-medium text-[#d4c4a0]">
            {creating ? t('admin.addCategory') : t('edit.button')}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8a7a60] mb-1">{t('admin.code')}</label>
              <input
                value={form.code || ''}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                disabled={!creating}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50 disabled:opacity-50"
                placeholder="RAW"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8a7a60] mb-1">{t('admin.sortOrder')}</label>
              <input
                type="number"
                value={form.sortOrder || 0}
                onChange={(e) => updateField('sortOrder', parseInt(e.target.value) || 0)}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'nameRu', label: t('edit.nameRu') },
              { key: 'nameUz', label: t('edit.nameUz') },
              { key: 'nameEn', label: t('edit.nameEn') },
              { key: 'nameUzCyr', label: t('edit.nameUzCyr') },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-[#8a7a60] mb-1">{label}</label>
                <input
                  value={(form as any)[key] || ''}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8a7a60] mb-1">{t('admin.color')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color || '#8a7a60'}
                  onChange={(e) => updateField('color', e.target.value)}
                  className="w-10 h-10 rounded border border-dark-border cursor-pointer bg-dark-bg"
                />
                <input
                  value={form.color || ''}
                  onChange={(e) => updateField('color', e.target.value)}
                  className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] font-mono focus:outline-none focus:border-dark-gold/50"
                  placeholder="#8a7a60"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#8a7a60] mb-1">{t('admin.icon')}</label>
              <div className="flex flex-wrap gap-1">
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => updateField('icon', ic)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      form.icon === ic
                        ? 'bg-dark-gold/20 text-dark-gold border-dark-gold/40'
                        : 'bg-dark-bg text-[#8a7a60] border-dark-border hover:text-[#d4c4a0]'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? t('edit.saving') : t('edit.save')}
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm text-[#8a7a60] border border-dark-border hover:text-[#d4c4a0] transition-colors"
            >
              <X size={14} /> {t('edit.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#8a7a60]">{t('sidebar.loading')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border text-[#8a7a60]">
                <th className="text-left py-3 px-4">#</th>
                <th className="text-left py-3 px-4">{t('admin.code')}</th>
                <th className="text-left py-3 px-4">{t('admin.name')}</th>
                <th className="text-left py-3 px-4">{t('admin.color')}</th>
                <th className="text-right py-3 px-4">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories?.map((cat) => (
                <tr key={cat.id} className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors">
                  <td className="py-3 px-4 text-[#8a7a60] font-mono">{cat.sortOrder}</td>
                  <td className="py-3 px-4 font-mono text-[#d4c4a0]">{cat.code}</td>
                  <td className="py-3 px-4 text-[#d4c4a0]">{getField(cat, 'name')}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-mono text-[#8a7a60] text-xs">{cat.color}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 rounded text-[#8a7a60] hover:text-dark-gold hover:bg-dark-bg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 rounded text-[#8a7a60] hover:text-red-400 hover:bg-dark-bg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
