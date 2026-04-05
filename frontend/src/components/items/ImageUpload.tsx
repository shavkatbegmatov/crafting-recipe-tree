import { useState, useRef } from 'react'
import { Upload, Loader2, Check, X, ImageIcon } from 'lucide-react'
import { uploadItemImage } from '../../api/items'
import { useQueryClient } from '@tanstack/react-query'

interface Props {
  itemId: number
}

export default function ImageUpload({ itemId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removeBg, setRemoveBg] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
    setStatus('idle')
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setStatus('uploading')
    setError(null)

    try {
      setProgress(0)
      const result = await uploadItemImage(itemId, file, removeBg, (p) => {
        setProgress(p)
        if (p >= 100) setStatus('processing')
      })

      setStatus('done')
      // Invalidate queries to refresh item data
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['items'] })

      // Reset after delay
      setTimeout(() => {
        setIsOpen(false)
        setFile(null)
        setPreview(null)
        setStatus('idle')
        setProgress(0)
      }, 1500)
    } catch (err: any) {
      setStatus('error')
      setError(err?.response?.data?.message || 'Yuklashda xatolik yuz berdi')
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
        Rasm yuklash
      </button>
    )
  }

  return (
    <div className="bg-dark-panel border border-dark-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#d4c4a0] flex items-center gap-2">
          <ImageIcon size={15} />
          Rasm yuklash
        </h3>
        <button onClick={handleCancel} className="text-[#8a7a60] hover:text-[#d4c4a0]">
          <X size={16} />
        </button>
      </div>

      {/* File input */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-dark-border rounded-lg p-6 text-center cursor-pointer hover:border-dark-gold/40 transition-colors"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded" />
        ) : (
          <div className="text-[#8a7a60]">
            <Upload size={24} className="mx-auto mb-2" />
            <p className="text-sm">Screenshot tanlang</p>
            <p className="text-xs mt-1">JPG, PNG — max 10MB</p>
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

      {/* Options */}
      {file && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-[#d4c4a0] cursor-pointer">
            <input
              type="checkbox"
              checked={removeBg}
              onChange={(e) => setRemoveBg(e.target.checked)}
              className="rounded border-dark-border bg-dark-bg accent-[#c8a050]"
            />
            Fonni avtomatik olib tashlash (rembg)
          </label>

          {/* Progress / Status */}
          {status === 'uploading' && (
            <div className="space-y-1">
              <div className="w-full bg-dark-bg rounded-full h-1.5">
                <div className="bg-dark-gold h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-[#8a7a60]">Yuklanmoqda... {progress}%</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="flex items-center gap-2 text-xs text-dark-gold">
              <Loader2 size={14} className="animate-spin" />
              Fon olib tashlanmoqda...
            </div>
          )}

          {status === 'done' && (
            <div className="flex items-center gap-2 text-xs text-[#4a9a5a]">
              <Check size={14} />
              Tayyor!
            </div>
          )}

          {status === 'error' && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={uploading || status === 'done'}
            className="w-full py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {status === 'processing' ? 'Qayta ishlanmoqda...' : 'Yuklanmoqda...'}
              </span>
            ) : status === 'done' ? (
              <span className="flex items-center justify-center gap-2">
                <Check size={14} /> Tayyor
              </span>
            ) : (
              'Yuklash'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
