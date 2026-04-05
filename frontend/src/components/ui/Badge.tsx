interface Props {
  children: React.ReactNode
  variant?: 'default' | 'outline'
  className?: string
}

export default function Badge({ children, variant = 'default', className = '' }: Props) {
  const base = 'inline-flex items-center rounded text-xs font-medium px-2 py-0.5'
  const variants = {
    default: 'bg-dark-border text-[#d4c4a0]',
    outline: 'border border-dark-border text-[#8a7a60]',
  }

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
