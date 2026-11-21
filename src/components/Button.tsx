import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_4px_16px_rgba(16,185,129,.35)]',
  secondary: 'bg-panel-2 hover:bg-line text-white border border-line',
  danger: 'bg-red-500/90 hover:bg-red-500 text-white',
  ghost: 'bg-transparent hover:bg-white/5 text-slate-200 border border-line',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      className={`tap-target px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
