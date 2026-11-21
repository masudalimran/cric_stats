import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

const BackIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  /** Explicit path to go back to. Defaults to browser history back. */
  back?: string
  action?: ReactNode
}

/** Sticky header with a back button — used on every non-root screen so navigation never dead-ends. */
export function PageHeader({ title, subtitle, back, action }: Props) {
  const navigate = useNavigate()
  return (
    <div
      className="sticky top-0 z-20 -mx-4 flex items-center gap-2 border-b border-line bg-ink/90 backdrop-blur px-4 mb-4"
      style={{ paddingTop: 'calc(var(--sat) + 10px)', paddingBottom: '10px' }}
    >
      <button
        onClick={() => (back ? navigate(back) : navigate(-1))}
        aria-label="Back"
        className="tap-target shrink-0 w-9 h-9 rounded-full bg-panel-2 border border-line flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500"
      >
        {BackIcon}
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold leading-tight truncate">{title}</h1>
        {subtitle && <div className="text-xs text-slate-400 truncate">{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
