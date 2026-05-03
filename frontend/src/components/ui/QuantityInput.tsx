import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'

interface Props {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export default function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 999999,
  step = 1,
}: Props) {
  const { t } = useTranslation()

  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  const set = (n: number) => {
    if (Number.isNaN(n)) return
    onChange(clamp(n))
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-[#8a7a60]">{t('common.qty')}:</span>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => set(value - step)}
          disabled={value <= min}
          aria-label="−"
          className="w-7 h-7 flex items-center justify-center rounded-l border border-r-0 border-dark-border text-[#8a7a60] hover:bg-dark-hover hover:text-[#d4c4a0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Minus size={12} />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') return
            set(Number(raw))
          }}
          onBlur={(e) => {
            if (e.target.value === '') set(min)
          }}
          className="w-14 h-7 text-center bg-dark-bg border border-dark-border text-[#d4c4a0] focus:outline-none focus:border-dark-gold/50 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => set(value + step)}
          disabled={value >= max}
          aria-label="+"
          className="w-7 h-7 flex items-center justify-center rounded-r border border-l-0 border-dark-border text-[#8a7a60] hover:bg-dark-hover hover:text-[#d4c4a0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}
