import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageOff } from 'lucide-react'
import { resolveImageUrl } from '../../utils/resolveImageUrl'

type Status = 'loading' | 'loaded' | 'error'

interface Props {
  src: string | null | undefined
  alt: string
  className?: string
  containerClassName?: string
  iconSize?: number
}

export default function SafeImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  iconSize = 32,
}: Props) {
  const { t } = useTranslation()
  const resolved = resolveImageUrl(src)
  const [status, setStatus] = useState<Status>(resolved ? 'loading' : 'error')

  useEffect(() => {
    setStatus(resolved ? 'loading' : 'error')
  }, [resolved])

  if (!resolved || status === 'error') {
    return (
      <div
        className={`relative flex flex-col items-center justify-center gap-1.5 bg-dark-panel/60 border border-dashed border-dark-border/60 rounded text-[#6a5d48] group/missing ${containerClassName}`}
        role="img"
        aria-label={t('image.notFound')}
        title={t('image.notFoundHint') ?? ''}
      >
        <ImageOff size={iconSize} className="opacity-60" strokeWidth={1.5} />
        <span className="text-[10px] uppercase tracking-wider font-medium select-none">
          {t('image.notFound')}
        </span>
        <span className="hidden sm:block text-[9px] text-[#5a4f3c] max-w-[160px] text-center leading-tight">
          {t('image.notFoundHint')}
        </span>
      </div>
    )
  }

  return (
    <div className={`relative ${containerClassName}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-panel/40 animate-pulse">
          <div className="w-1/3 h-1/3 max-w-[40px] max-h-[40px] rounded bg-dark-border/40" />
        </div>
      )}
      <img
        src={resolved}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`${className} ${status === 'loading' ? 'opacity-0' : ''} transition-opacity duration-200`}
      />
    </div>
  )
}
