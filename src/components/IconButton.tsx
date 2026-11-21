import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'default' | 'danger' | 'primary'

const variantClasses: Record<Variant, string> = {
  default: 'bg-panel-2 text-slate-300 hover:text-white hover:bg-line',
  danger: 'bg-panel-2 text-red-400 hover:bg-red-500/15 hover:text-red-300',
  primary: 'bg-emerald-500 text-black hover:bg-emerald-400',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  variant?: Variant
  size?: number
}

/** A round icon-only button with a required aria-label, used for compact row actions (edit/remove/etc). */
export function IconButton({ icon, label, variant = 'default', size = 32, className = '', ...props }: Props) {
  return (
    <button
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`tap-target shrink-0 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  )
}
