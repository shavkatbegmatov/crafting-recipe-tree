import { useEffect, useState } from 'react'
import { resolveImageUrl } from '../../utils/resolveImageUrl'

interface Props {
  imageUrl: string | null | undefined
  alt: string
  size?: number
  fallbackColor?: string
  className?: string
}

export default function ItemImageIcon({
  imageUrl,
  alt,
  size = 24,
  fallbackColor,
  className = '',
}: Props) {
  const resolved = resolveImageUrl(imageUrl)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setErrored(false)
  }, [resolved])

  const showImage = !!resolved && !errored
  const dotSize = Math.max(6, Math.round(size / 3))

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={resolved}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className="h-full w-full object-contain"
        />
      ) : fallbackColor ? (
        <span
          className="rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: fallbackColor,
          }}
        />
      ) : null}
    </span>
  )
}
