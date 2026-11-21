import { useState } from 'react'
import type { Ball } from '../types'
import { ballRuns } from '../lib/cricket'

// Dark-mode categorical palette (validated pair, slots 1 & 2): blue vs orange.
export const SERIES = ['#3987e5', '#d95926']
const GRID = '#2c2c2a'
const BASELINE = '#383835'
const MUTED = '#898781'
const INK = '#f0efec'

/** Horizontal bar chart for a single-metric ranking (sequential blue — magnitude, not identity). */
export function TopBarChart({ rows }: { rows: { label: string; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  if (rows.length === 0) return <p className="text-slate-400 text-sm">No data yet.</p>
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div
          key={r.label}
          className="flex items-center gap-3"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <div className="w-28 text-xs text-slate-300 truncate text-right shrink-0">{r.label}</div>
          <div className="flex-1 h-6 rounded-md bg-white/5 relative overflow-hidden">
            <div
              className="h-full rounded-md transition-all"
              style={{
                width: `${Math.max(3, (r.value / max) * 100)}%`,
                background: hover === i ? '#5598e7' : SERIES[0],
              }}
            />
          </div>
          <div className="w-10 text-sm font-bold text-right shrink-0" style={{ color: INK }}>
            {r.value}
          </div>
        </div>
      ))}
    </div>
  )
}

export interface PartnershipRow {
  nameA: string
  nameB: string
  runs: number
  balls: number
}

/** A progress bar running between the two batters' names — who added how many runs together. */
export function PartnershipChart({ rows }: { rows: PartnershipRow[] }) {
  if (rows.length === 0) return <p className="text-slate-400 text-sm">No data yet.</p>
  const max = Math.max(1, ...rows.map((r) => r.runs))
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-16 text-xs font-medium text-slate-300 text-right truncate shrink-0">{r.nameA}</span>
          <div className="flex-1 h-5 rounded-full bg-white/5 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(4, (r.runs / max) * 100)}%`, background: SERIES[0] }}
            />
          </div>
          <span className="w-16 text-xs font-medium text-slate-300 truncate shrink-0">{r.nameB}</span>
          <span className="w-12 text-right text-sm font-bold shrink-0" style={{ color: INK }}>
            {r.runs}
          </span>
        </div>
      ))}
    </div>
  )
}

interface InningsOvers {
  label: string
  oversRuns: number[] // runs scored in each over, index = over number
  oversWickets: number[] // wickets lost in each over
}

export function perOverData(balls: Ball[]): { oversRuns: number[]; oversWickets: number[] } {
  const oversRuns: number[] = []
  const oversWickets: number[] = []
  for (const b of balls) {
    const idx = b.overNumber
    oversRuns[idx] = (oversRuns[idx] ?? 0) + ballRuns(b)
    if (b.isWicket) oversWickets[idx] = (oversWickets[idx] ?? 0) + 1
  }
  return { oversRuns: oversRuns.map((v) => v ?? 0), oversWickets }
}

/** Manhattan chart: runs scored per over, grouped by innings, with a dot marking overs that had a wicket. */
export function ManhattanChart({ innings }: { innings: InningsOvers[] }) {
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null)
  const maxOvers = Math.max(1, ...innings.map((i) => i.oversRuns.length))
  const maxRun = Math.max(6, ...innings.flatMap((i) => i.oversRuns))

  const W = 680
  const H = 220
  const padL = 32
  const padB = 24
  const padT = 10
  const plotW = W - padL - 12
  const plotH = H - padB - padT
  const groupW = plotW / maxOvers
  const barW = Math.max(3, (groupW - 4) / innings.length)

  const yScale = (v: number) => padT + plotH - (v / maxRun) * plotH

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Runs scored per over">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padL}
            x2={W - 8}
            y1={padT + plotH * (1 - f)}
            y2={padT + plotH * (1 - f)}
            stroke={GRID}
            strokeWidth={1}
          />
        ))}
        <line x1={padL} x2={padL} y1={padT} y2={padT + plotH} stroke={BASELINE} strokeWidth={1} />
        <line x1={padL} x2={W - 8} y1={padT + plotH} y2={padT + plotH} stroke={BASELINE} strokeWidth={1} />

        {innings.map((inn, si) =>
          inn.oversRuns.map((runs, oi) => {
            const x = padL + oi * groupW + si * barW + 2
            const y = yScale(runs)
            const h = padT + plotH - y
            return (
              <g key={`${si}-${oi}`}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(h, 1)}
                  rx={2}
                  fill={SERIES[si % SERIES.length]}
                  onMouseEnter={(e) =>
                    setHover({
                      x: e.clientX,
                      y: e.clientY,
                      text: `${inn.label} · Over ${oi + 1}: ${runs} run${runs === 1 ? '' : 's'}${inn.oversWickets[oi] ? ` · ${inn.oversWickets[oi]}W` : ''}`,
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                />
                {!!inn.oversWickets[oi] && (
                  <circle cx={x + barW / 2} cy={y - 5} r={3} fill="#e66767" />
                )}
              </g>
            )
          }),
        )}

        {Array.from({ length: maxOvers }).map((_, oi) =>
          oi % Math.ceil(maxOvers / 12 || 1) === 0 ? (
            <text key={oi} x={padL + oi * groupW + groupW / 2} y={H - 6} fontSize={9} fill={MUTED} textAnchor="middle">
              {oi + 1}
            </text>
          ) : null,
        )}
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={padL - 6} y={padT + plotH * (1 - f) + 3} fontSize={9} fill={MUTED} textAnchor="end">
            {Math.round(maxRun * f)}
          </text>
        ))}
      </svg>
      <div className="flex gap-4 justify-center mt-1">
        {innings.map((inn, i) => (
          <span key={inn.label} className="flex items-center gap-1.5 text-xs" style={{ color: INK }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: SERIES[i % SERIES.length] }} />
            {inn.label}
          </span>
        ))}
      </div>
      {hover && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 rounded-lg bg-black/90 text-white text-xs whitespace-nowrap"
          style={{ left: hover.x + 12, top: hover.y - 28 }}
        >
          {hover.text}
        </div>
      )}
    </div>
  )
}

/** Worm chart: cumulative runs over by over, one line per innings, for comparing chases. */
export function WormChart({ innings }: { innings: InningsOvers[] }) {
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null)
  const cumulative = innings.map((inn) => {
    let total = 0
    return inn.oversRuns.map((r) => (total += r))
  })
  const maxOvers = Math.max(1, ...cumulative.map((c) => c.length))
  const maxRun = Math.max(10, ...cumulative.flat())

  const W = 680
  const H = 220
  const padL = 36
  const padB = 24
  const padT = 10
  const plotW = W - padL - 12
  const plotH = H - padB - padT

  const xScale = (over: number) => padL + (over / Math.max(1, maxOvers - 1)) * plotW
  const yScale = (v: number) => padT + plotH - (v / maxRun) * plotH

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Cumulative runs by over">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={padL} x2={W - 8} y1={padT + plotH * (1 - f)} y2={padT + plotH * (1 - f)} stroke={GRID} strokeWidth={1} />
        ))}
        <line x1={padL} x2={padL} y1={padT} y2={padT + plotH} stroke={BASELINE} strokeWidth={1} />
        <line x1={padL} x2={W - 8} y1={padT + plotH} y2={padT + plotH} stroke={BASELINE} strokeWidth={1} />

        {cumulative.map((series, si) => {
          const points = series.map((v, oi) => [xScale(oi), yScale(v)] as const)
          const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
          return (
            <g key={si}>
              <path d={path} fill="none" stroke={SERIES[si % SERIES.length]} strokeWidth={2} />
              {points.map(([x, y], oi) => (
                <circle
                  key={oi}
                  cx={x}
                  cy={y}
                  r={3.5}
                  fill={SERIES[si % SERIES.length]}
                  onMouseEnter={(e) =>
                    setHover({ x: e.clientX, y: e.clientY, text: `${innings[si].label} · Over ${oi + 1}: ${series[oi]}` })
                  }
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </g>
          )
        })}

        {[0, 0.5, 1].map((f) => (
          <text key={f} x={padL - 6} y={padT + plotH * (1 - f) + 3} fontSize={9} fill={MUTED} textAnchor="end">
            {Math.round(maxRun * f)}
          </text>
        ))}
      </svg>
      <div className="flex gap-4 justify-center mt-1">
        {innings.map((inn, i) => (
          <span key={inn.label} className="flex items-center gap-1.5 text-xs" style={{ color: INK }}>
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: SERIES[i % SERIES.length] }} />
            {inn.label}
          </span>
        ))}
      </div>
      {hover && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 rounded-lg bg-black/90 text-white text-xs whitespace-nowrap"
          style={{ left: hover.x + 12, top: hover.y - 28 }}
        >
          {hover.text}
        </div>
      )}
    </div>
  )
}
