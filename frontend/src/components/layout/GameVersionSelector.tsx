import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Tag as TagIcon, ChevronDown, Check, Star } from 'lucide-react'
import { useGameVersion } from '../../contexts/GameVersionContext'
import { useGameVersions } from '../../hooks/useGameVersions'

export default function GameVersionSelector() {
  const { t } = useTranslation()
  const { selectedVersion, effectiveVersion, setSelectedVersion } = useGameVersion()
  const { data: versions, isLoading } = useGameVersions()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const label = effectiveVersion ?? '—'
  const followingCurrent = selectedVersion === null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-dark-border hover:border-dark-gold/40 hover:text-[#d4c4a0] text-[#8a7a60] transition-colors"
        title={t('gameVersion.selectorTitle')}
      >
        <TagIcon size={12} />
        <span className="font-mono">{label}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 z-50 min-w-[14rem] bg-dark-card border border-dark-border rounded-lg shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-dark-border">
            <p className="text-[10px] uppercase tracking-wider text-[#5a4e3a]">{t('gameVersion.title')}</p>
          </div>

          {/* "Follow current" entry */}
          <button
            type="button"
            onClick={() => {
              setSelectedVersion(null)
              setOpen(false)
            }}
            className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-dark-hover transition-colors"
          >
            <Star size={12} className="text-dark-gold" />
            <span className="text-[#d4c4a0]">{t('gameVersion.followCurrent')}</span>
            {followingCurrent && <Check size={12} className="text-dark-gold ml-auto" />}
          </button>

          <div className="border-t border-dark-border max-h-72 overflow-y-auto">
            {isLoading && (
              <div className="px-3 py-2 text-xs text-[#8a7a60]">{t('sidebar.loading')}</div>
            )}
            {versions?.map((v) => {
              const isSelected = selectedVersion === v.version
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVersion(v.version)
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-dark-hover transition-colors"
                >
                  <span className="font-mono text-[#d4c4a0]">{v.version}</span>
                  {v.isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-gold/20 text-dark-gold border border-dark-gold/30">
                      {t('gameVersion.current')}
                    </span>
                  )}
                  {isSelected && <Check size={12} className="text-dark-gold ml-auto" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
