import { useLiveQuery } from 'dexie-react-hooks'
import { NavLink, useLocation } from 'react-router-dom'
import { db } from '../db/db'

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const Icon = {
  teams: (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
      <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  fixtures: (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M8 2v4M16 2v4M3 10h18M8 15h3" />
    </svg>
  ),
  stats: (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  ),
  settings: (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.65 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.65a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.65a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.35 9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03z" />
    </svg>
  ),
}

const links = [
  { to: '/teams', label: 'Teams', icon: Icon.teams },
  { to: '/fixtures', label: 'Fixtures', icon: Icon.fixtures },
  { to: '/stats', label: 'Stats', icon: Icon.stats },
  { to: '/settings', label: 'Settings', icon: Icon.settings },
]

export function NavBar() {
  const { pathname } = useLocation()
  const liveCount = useLiveQuery(() => db.fixtures.where('status').equals('live').count(), [])

  return (
    <>
      <header
        className="hidden sm:flex items-center gap-1 px-5 h-16 border-b border-line sticky top-0 bg-ink/95 backdrop-blur z-30"
      >
        <span className="font-display text-2xl tracking-wider mr-6">
          🏏 CRIC <span className="text-emerald-400">STATS</span>
        </span>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'bg-panel-2 text-white' : 'text-slate-400 hover:text-white hover:bg-panel-2/60'}`
            }
          >
            <span className={pathname.startsWith(l.to) ? 'text-emerald-400' : ''}>{l.icon}</span>
            {l.label}
            {l.to === '/fixtures' && !!liveCount && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-ink animate-pulse" />
            )}
          </NavLink>
        ))}
      </header>

      <nav
        aria-label="Main"
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line bg-ink/97 backdrop-blur"
        style={{ paddingBottom: 'var(--sab)' }}
      >
        <div className="flex h-[60px]">
          {links.map((l) => {
            const active = pathname.startsWith(l.to)
            return (
              <NavLink
                key={l.to}
                to={l.to}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 tap-target"
              >
                <span className={active ? 'text-emerald-400' : 'text-slate-500'}>{l.icon}</span>
                <span className={`text-[11px] font-bold tracking-wide ${active ? 'text-white' : 'text-slate-500'}`}>
                  {l.label}
                </span>
                {l.to === '/fixtures' && !!liveCount && (
                  <span className="absolute top-1 right-[28%] h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-ink animate-pulse" />
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}
