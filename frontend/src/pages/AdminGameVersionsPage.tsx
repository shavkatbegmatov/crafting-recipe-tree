import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Loader2, Check, Star, Tag as TagIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGoBack } from '../hooks/useGoBack'
import {
  useGameVersions,
  useCreateGameVersion,
  useUpdateGameVersion,
  useDeleteGameVersion,
  useSetCurrentGameVersion,
} from '../hooks/useGameVersions'
import type { GameVersion } from '../api/types'
import Spinner from '../components/ui/Spinner'

interface FormState {
  version: string
  releasedAt: string
  notes: string
  makeCurrent: boolean
}

const emptyForm: FormState = {
  version: '',
  releasedAt: '',
  notes: '',
  makeCurrent: false,
}

export default function AdminGameVersionsPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const goBack = useGoBack('/')
  const { data: versions, isLoading } = useGameVersions()

  const createMutation = useCreateGameVersion()
  const updateMutation = useUpdateGameVersion()
  const deleteMutation = useDeleteGameVersion()
  const setCurrentMutation = useSetCurrentGameVersion()

  const [editingId, setEditingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [savedFlash, setSavedFlash] = useState(false)

  if (!isAdmin) return <Navigate to="/" />

  const startEdit = (gv: GameVersion) => {
    setForm({
      version: gv.version,
      releasedAt: gv.releasedAt ? gv.releasedAt.slice(0, 16) : '',
      notes: gv.notes ?? '',
      makeCurrent: gv.isCurrent,
    })
    setEditingId(gv.id)
    setCreating(false)
  }

  const startCreate = () => {
    setForm({ ...emptyForm, releasedAt: new Date().toISOString().slice(0, 16) })
    setCreating(true)
    setEditingId(null)
  }

  const cancel = () => {
    setEditingId(null)
    setCreating(false)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    const releasedAt = form.releasedAt ? `${form.releasedAt}:00` : undefined
    if (creating) {
      await createMutation.mutateAsync({
        version: form.version.trim(),
        releasedAt,
        notes: form.notes.trim() || null,
        makeCurrent: form.makeCurrent,
      })
    } else if (editingId != null) {
      await updateMutation.mutateAsync({
        id: editingId,
        data: {
          version: form.version.trim() || undefined,
          releasedAt,
          notes: form.notes.trim() || null,
        },
      })
    }
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1000)
    cancel()
  }

  const handleDelete = async (gv: GameVersion) => {
    if (!confirm(`${t('gameVersion.deleteConfirm')} (${gv.version})`)) return
    try {
      await deleteMutation.mutateAsync(gv.id)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      alert(msg)
    }
  }

  const handleSetCurrent = async (gv: GameVersion) => {
    await setCurrentMutation.mutateAsync(gv.id)
  }

  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-5 max-w-5xl">
      <button
        type="button"
        onClick={goBack}
        className="text-[#8a7a60] hover:text-[#d4c4a0] text-sm flex items-center gap-1 transition-colors"
      >
        <ArrowLeft size={14} /> {t('common.back')}
      </button>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-[#d4c4a0] flex items-center gap-2">
          <TagIcon size={18} className="text-dark-gold" />
          {t('gameVersion.manage')}
        </h1>
        {!creating && editingId == null && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors"
          >
            <Plus size={14} />
            {t('gameVersion.addNew')}
          </button>
        )}
      </div>

      {(creating || editingId != null) && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#d4c4a0]">
            {creating ? t('gameVersion.addNew') : t('gameVersion.update')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8a7a60] mb-1">{t('gameVersion.version')}</label>
              <input
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="5.7.0"
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8a7a60] mb-1">{t('gameVersion.releasedAt')}</label>
              <input
                type="datetime-local"
                value={form.releasedAt}
                onChange={(e) => setForm({ ...form, releasedAt: e.target.value })}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#8a7a60] mb-1">{t('gameVersion.notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50 resize-none"
            />
          </div>
          {creating && (
            <label className="flex items-center gap-2 text-sm text-[#8a7a60] cursor-pointer">
              <input
                type="checkbox"
                checked={form.makeCurrent}
                onChange={(e) => setForm({ ...form, makeCurrent: e.target.checked })}
                className="accent-dark-gold"
              />
              {t('gameVersion.isCurrent')}
            </label>
          )}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.version.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : savedFlash ? <Check size={14} /> : <Save size={14} />}
              {saving ? t('edit.saving') : creating ? t('gameVersion.create') : t('gameVersion.update')}
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm text-[#8a7a60] border border-dark-border hover:text-[#d4c4a0] hover:border-[#4a4238] transition-colors"
            >
              <X size={14} />
              {t('edit.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Versions list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border bg-dark-bg/30">
                <th className="text-left py-2 px-3 text-[#8a7a60] font-medium">{t('gameVersion.version')}</th>
                <th className="text-left py-2 px-3 text-[#8a7a60] font-medium">{t('gameVersion.releasedAt')}</th>
                <th className="text-left py-2 px-3 text-[#8a7a60] font-medium">{t('gameVersion.notes')}</th>
                <th className="text-right py-2 px-3 text-[#8a7a60] font-medium">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {versions?.map((gv) => (
                <tr key={gv.id} className="border-b border-dark-border/50 hover:bg-dark-hover/40 transition-colors">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#d4c4a0]">{gv.version}</span>
                      {gv.isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-gold/20 text-dark-gold border border-dark-gold/30">
                          {t('gameVersion.current')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-xs text-[#8a7a60] font-mono">
                    {gv.releasedAt?.replace('T', ' ').slice(0, 16) ?? '—'}
                  </td>
                  <td className="py-2 px-3 text-xs text-[#8a7a60] truncate max-w-[24rem]">{gv.notes ?? ''}</td>
                  <td className="py-2 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {!gv.isCurrent && (
                        <button
                          onClick={() => handleSetCurrent(gv)}
                          disabled={setCurrentMutation.isPending}
                          className="text-xs px-2 py-1 rounded border border-dark-border text-[#8a7a60] hover:text-dark-gold hover:border-dark-gold/40 transition-colors flex items-center gap-1"
                          title={t('gameVersion.setCurrent')}
                        >
                          <Star size={11} />
                          {t('gameVersion.setCurrent')}
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(gv)}
                        className="text-xs px-2 py-1 rounded border border-dark-border text-[#8a7a60] hover:text-dark-gold hover:border-dark-gold/40 transition-colors"
                        title={t('edit.button')}
                      >
                        <Pencil size={11} />
                      </button>
                      {!gv.isCurrent && (
                        <button
                          onClick={() => handleDelete(gv)}
                          className="text-xs px-2 py-1 rounded border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                          title={t('gameVersion.delete')}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {versions && versions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-[#5a4e3a]">
                    {t('gameVersion.noHistory')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
