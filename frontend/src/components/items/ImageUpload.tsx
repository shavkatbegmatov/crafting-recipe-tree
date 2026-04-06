import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, Loader2, Check, X, ImageIcon, Clipboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { uploadItemImage } from '../../api/items'
import { useQueryClient } from '@tanstack/react-query'

interface Props {
  itemId: number
}

export default function ImageUpload({ itemId }: Props) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removeBg, setRemoveBg] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const setFileWithPreview = useCallback((f: File) => {
    setFile(f)
    setError(null)
    setStatus('idle')
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFileWithPreview(f)
  }

  // Clipboard paste (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (blob) {
            const f = new File([blob], `screenshot_${Date.now()}.png`, { type: blob.type })
            setFileWithPreview(f)
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [isOpen, setFileWithPreview])

  // Drag & drop
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) {
      setFileWithPreview(f)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setStatus('uploading')
    setError(null)

    try {
      setProgress(0)
      await uploadItemImage(itemId, file, removeBg, (p) => {
        setProgress(p)
        if (p >= 100) setStatus('processing')
      })

      setStatus('done')
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['items'] })

      setTimeout(() => {
        setIsOpen(false)
        setFile(null)
        setPreview(null)
        setStatus('idle')
        setProgress(0)
      }, 1500)
    } catch (err: any) {
      setStatus('error')
      setError(err?.response?.data?.message || t('upload.error'))
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setFile(null)
    setPreview(null)
    setStatus('idle')
    setProgress(0)
    setError(null)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#8a7a60] hover:text-dark-gold transition-colors border border-dark-border rounded px-3 py-1.5 hover:border-dark-gold/40"
      >
        <Upload size={13} />
        {t('upload.button')}
      </button>
    )
  }

  return (
    <div className="bg-dark-panel border border-dark-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#d4c4a0] flex items-center gap-2">
          <ImageIcon size={15} />
          {t('upload.title')}
        </h3>
        <button onClick={handleCancel} className="text-[#8a7a60] hover:text-[#d4c4a0]">
          <X size={16} />
        </button>
      </div>

      {/* Drop zone + paste + click */}
      <div
        ref={dropRef}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-dark-gold bg-dark-gold/5'
            : 'border-dark-border hover:border-dark-gold/40'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded" />
        ) : (
          <div className="text-[#8a7a60]">
            <Upload size={24} className="mx-auto mb-2" />
            <p className="text-sm">{t('upload.selectFile')}</p>
            <p className="text-xs mt-1">{t('upload.fileHint')}</p>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-[#5a4e3a]">
              <Clipboard size={11} />
              {t('upload.pasteHint')}
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {file && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-[#d4c4a0] cursor-pointer">
            <input
              type="checkbox"
              checked={removeBg}
              onChange={(e) => setRemoveBg(e.target.checked)}
              className="rounded border-dark-border bg-dark-bg accent-[#c8a050]"
            />
            {t('upload.removeBg')}
          </label>

          {status === 'uploading' && (
            <div className="space-y-1">
              <div className="w-full bg-dark-bg rounded-full h-1.5">
                <div className="bg-dark-gold h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-[#8a7a60]">{t('upload.uploading', { progress })}</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="flex items-center gap-2 text-xs text-dark-gold">
              <Loader2 size={14} className="animate-spin" />
              {t('upload.processing')}
            </div>
          )}

          {status === 'done' && (
            <div className="flex items-center gap-2 text-xs text-[#4a9a5a]">
              <Check size={14} />
              {t('upload.done')}
            </div>
          )}

          {status === 'error' && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || status === 'done'}
            className="w-full py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {status === 'processing' ? t('upload.reprocessing') : t('upload.uploading', { progress })}
              </span>
            ) : status === 'done' ? (
              <span className="flex items-center justify-center gap-2">
                <Check size={14} /> {t('upload.done')}
              </span>
            ) : (
              t('upload.submit')
            )}
          </button>
        </div>
      )}
    </div>
  )
}
