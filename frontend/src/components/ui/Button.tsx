import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'success'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

/**
 * Yagona tugma komponenti — barcha sahifalarda izchil ko'rinish.
 * Asosiy uslublar `index.css` dagi `.btn-*` klasslarida (gold glow, gradient).
 */
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger:
    'btn-base px-3 py-1.5 text-red-400/80 border border-red-500/30 ' +
    'hover:bg-red-500/10 hover:text-red-400 active:scale-[0.97]',
  success:
    'btn-base px-3 py-1.5 text-green-300 border border-green-500/30 ' +
    'hover:bg-green-500/15 hover:border-green-500/50 active:scale-[0.97]',
}

export default function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button className={`${VARIANT_CLASS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
