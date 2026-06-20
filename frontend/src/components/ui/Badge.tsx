interface Props {
  children: React.ReactNode
  variant?: 'default' | 'outline'
  className?: string
}

export default function Badge({ children, variant = 'default', className = '' }: Props) {
  const base = 'inline-flex items-center rounded text-xs font-medium px-2 py-0.5'
  const variants = {
    default: 'bg-dark-border text-skin-base',
    outline: 'border border-dark-border text-skin-muted',
  }

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
