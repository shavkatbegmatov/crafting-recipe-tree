import { Search, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  const { t } = useTranslation()
  const [local, setLocal] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => onChange(local), 300)
    return () => clearTimeout(timer)
  }, [local, onChange])

  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a60]" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-8 py-2 text-sm text-[#d4c4a0] placeholder-[#5a4e3a] focus:outline-none focus:border-dark-gold/50 transition-colors"
      />
      {local && (
        <button
          onClick={() => { setLocal(''); onChange('') }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a7a60] hover:text-[#d4c4a0]"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
