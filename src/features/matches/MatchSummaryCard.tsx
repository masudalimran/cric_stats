import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { SERIES } from '../../components/charts'
import { ChartIcon, PlayIcon, TrashIcon } from '../../components/icons'
import { IconButton } from '../../components/IconButton'
import type { MatchSummary } from '../../data/stats'

interface Props {
  summary: MatchSummary
  onOpen: () => void
  onRemove?: () => void
  highlight?: boolean
}

export function MatchSummaryCard({ summary, onOpen, onRemove, highlight }: Props) {
  return (
    <Card className={highlight ? 'p-4 border-red-500/50 bg-red-500/[0.04] overflow-hidden' : 'p-4 overflow-hidden'}>
      <button onClick={onOpen} className="tap-target w-full text-left">
        {/* Header: team names + status — neutral, sets the scene */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="font-bold truncate">
            {summary.teamAName} <span className="text-slate-500 font-normal">vs</span> {summary.teamBName}
          </div>
          {summary.status === 'live' ? (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 bg-red-500/15 text-red-300">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> Live
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 bg-slate-500/15 text-slate-400">
              Final
            </span>
          )}
        </div>

        <div className="text-xs text-slate-500 mb-3">
          {new Date(summary.scheduledAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          {summary.venue && ` · ${summary.venue}`}
        </div>

        {/* Each innings gets its own subtly tinted section, color-matched to the same team colors used in the charts. */}
        <div className="space-y-2.5 mb-3">
          {summary.innings.map((inn, i) => {
            const color = SERIES[i % SERIES.length]
            return (
              <div
                key={i}
                className="rounded-lg pl-3 pr-3 py-2.5 border-l-[3px]"
                style={{ borderColor: color, backgroundColor: `${color}14` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate" style={{ color }}>
                    Innings {i + 1}: {inn.teamName}
                  </span>
                  <span className="font-display text-lg tracking-wide shrink-0">
                    {inn.runs}/{inn.wickets}
                    <span className="text-xs text-slate-400 font-sans ml-1">({inn.overs})</span>
                  </span>
                </div>
                {(inn.topBatsmen.length > 0 || inn.topBowlers.length > 0) && (
                  <div className="grid grid-cols-2 gap-3 mt-1.5 pt-1.5 border-t border-white/5">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-0.5">🏏 Top scorers</div>
                      {inn.topBatsmen.map((p) => (
                        <div key={p.playerId} className="flex items-center justify-between text-sm">
                          <span className="truncate pr-1">{p.name}</span>
                          <span className="font-semibold tabular-nums shrink-0">{p.line}</span>
                        </div>
                      ))}
                      {inn.topBatsmen.length === 0 && <span className="text-xs text-slate-600">—</span>}
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-0.5">⚾ Top bowlers</div>
                      {inn.topBowlers.map((p) => (
                        <div key={p.playerId} className="flex items-center justify-between text-sm">
                          <span className="truncate pr-1">{p.name}</span>
                          <span className="font-semibold tabular-nums shrink-0">{p.line}</span>
                        </div>
                      ))}
                      {inn.topBowlers.length === 0 && <span className="text-xs text-slate-600">—</span>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {summary.innings.length === 0 && <p className="text-xs text-slate-500">Yet to begin.</p>}
        </div>

        {/* Live scoreboard strip — tinted red/amber so it reads as "happening right now", distinct from the innings blocks. */}
        {summary.live && (
          <div className="bg-red-500/[0.06] border border-red-500/20 rounded-lg px-3 py-2 mb-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>
                🏏 {summary.live.strikerName} <span className="text-slate-500">· {summary.live.nonStrikerName}</span>
              </span>
              <span className="text-slate-400">⚾ {summary.live.bowlerName}</span>
            </div>
            {summary.live.last6.length > 0 && (
              <div className="flex gap-1">
                {summary.live.last6.map((b, i) => (
                  <span key={i} className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${b === 'W' ? 'bg-red-700' : 'bg-panel'}`}>
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Result banner — tinted emerald to stand apart as the final word. */}
        {summary.resultText && (
          <div className="text-emerald-300 text-sm font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            {summary.resultText}
          </div>
        )}
      </button>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
        <Button onClick={onOpen} className="flex-1">
          <span className="inline-flex items-center justify-center gap-1.5">
            {summary.status === 'live' ? PlayIcon : ChartIcon}
            {summary.status === 'live' ? 'Resume match' : 'Scorecard'}
          </span>
        </Button>
        {onRemove && <IconButton icon={TrashIcon} label="Remove match" variant="danger" onClick={onRemove} />}
      </div>
    </Card>
  )
}
