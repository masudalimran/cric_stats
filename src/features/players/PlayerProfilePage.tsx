import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { getMembershipsForPlayer } from '../../data/players'
import {
  getBattingMatchups,
  getBowlingMatchups,
  getDismissalBreakdown,
  getPlayerCareerStats,
  type NamedMatchupRow,
  type PlayerCareerStats,
} from '../../data/stats'
import type { DismissalCount } from '../../stats/aggregate'
import { Avatar } from '../../components/Avatar'
import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { RoleBadge } from '../../components/RoleBadge'
import { TopBarChart } from '../../components/charts'
import { round } from '../../lib/cricket'

export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>()
  const player = useLiveQuery(() => db.players.get(playerId!), [playerId])
  const memberships = useLiveQuery(() => getMembershipsForPlayer(playerId!), [playerId])
  const [stats, setStats] = useState<PlayerCareerStats | null>(null)
  const [dismissals, setDismissals] = useState<DismissalCount[]>([])
  const [battingVs, setBattingVs] = useState<NamedMatchupRow[]>([])
  const [bowlingVs, setBowlingVs] = useState<NamedMatchupRow[]>([])

  useEffect(() => {
    if (!playerId) return
    getPlayerCareerStats(playerId).then(setStats)
    getDismissalBreakdown(playerId).then(setDismissals)
    getBattingMatchups(playerId).then(setBattingVs)
    getBowlingMatchups(playerId).then(setBowlingVs)
  }, [playerId])

  if (!player) return null

  const currentTeams = memberships?.filter((m) => m.status === 'active') ?? []
  const pastTeams = memberships?.filter((m) => m.status !== 'active') ?? []

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24 space-y-6">
      <PageHeader title={player.currentName} subtitle={currentTeams.map((t) => t.teamName).join(', ') || 'No current team'} />

      <div className="flex items-center gap-4">
        <Avatar blobId={player.imageBlobId} name={player.currentName} size={72} />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold">{player.currentName}</h2>
            <RoleBadge battingStyle={player.battingStyle} bowlingStyle={player.bowlingStyle} />
          </div>
          {player.nameHistory.length > 1 && (
            <p className="text-xs text-slate-500 mt-0.5">
              formerly: {player.nameHistory.slice(0, -1).map((h) => h.name).join(', ')}
            </p>
          )}
          <div className="flex gap-1.5 flex-wrap mt-1.5">
            {currentTeams.map((t) => (
              <span key={t.id} className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300">
                {t.teamName}
              </span>
            ))}
            {currentTeams.length === 0 && <span className="text-xs text-slate-500">No current team</span>}
          </div>
        </div>
      </div>

      {(player.battingStyle || player.bowlingStyle || player.details) && (
        <Card className="p-3 text-sm text-slate-400 space-y-1">
          {player.battingStyle && <div>🏏 Batting: {player.battingStyle}</div>}
          {player.bowlingStyle && <div>⚾ Bowling: {player.bowlingStyle}</div>}
          {player.details && <div className="text-slate-300 pt-1">{player.details}</div>}
        </Card>
      )}

      {stats && (
        <>
          <section>
            <h2 className="font-bold text-slate-300 mb-2">Batting — {stats.matches} matches</h2>
            <StatList
              items={[
                ['Innings', stats.batting.innings],
                ['Runs', stats.batting.runs],
                ['Balls', stats.batting.balls],
                ['Average', stats.batting.average !== null ? round(stats.batting.average) : '—'],
                ['Strike rate', round(stats.batting.strikeRate)],
                ['Highest', `${stats.batting.highestScore}${stats.batting.highestScoreNotOut ? '*' : ''}`],
                ['4s', stats.batting.fours],
                ['6s', stats.batting.sixes],
                ['50s', stats.batting.fifties],
                ['100s', stats.batting.hundreds],
                ['Not outs', stats.batting.notOuts],
                ['Ducks', stats.batting.ducks],
              ]}
            />
          </section>

          <section>
            <h2 className="font-bold text-slate-300 mb-2">Bowling</h2>
            <StatList
              items={[
                ['Innings', stats.bowling.innings],
                ['Overs', Math.floor(stats.bowling.legalBalls / 6) + '.' + (stats.bowling.legalBalls % 6)],
                ['Runs', stats.bowling.runsConceded],
                ['Wickets', stats.bowling.wickets],
                ['Average', stats.bowling.average !== null ? round(stats.bowling.average) : '—'],
                ['Economy', round(stats.bowling.economy)],
                ['Strike rate', stats.bowling.strikeRate !== null ? round(stats.bowling.strikeRate) : '—'],
                ['Maidens', stats.bowling.maidens],
                [
                  'Best',
                  stats.bowling.bestFigures
                    ? `${stats.bowling.bestFigures.wickets}/${stats.bowling.bestFigures.runs}`
                    : '—',
                ],
              ]}
            />
          </section>

          <section>
            <h2 className="font-bold text-slate-300 mb-2">Fielding</h2>
            <StatList
              items={[
                ['Catches', stats.fielding.catches],
                ['Run outs', stats.fielding.runOuts],
                ['Stumpings', stats.fielding.stumpings],
              ]}
            />
          </section>

          {dismissals.length > 0 && (
            <section>
              <h2 className="font-bold text-slate-300 mb-2">How they get out</h2>
              <Card className="p-3.5">
                <TopBarChart rows={dismissals.map((d) => ({ label: d.type, value: d.count }))} />
              </Card>
            </section>
          )}

          {battingVs.length > 0 && (
            <section>
              <h2 className="font-bold text-slate-300 mb-2">Batting vs. bowlers faced</h2>
              <MatchupTable rows={battingVs} />
            </section>
          )}

          {bowlingVs.length > 0 && (
            <section>
              <h2 className="font-bold text-slate-300 mb-2">Bowling vs. batters faced</h2>
              <MatchupTable rows={bowlingVs} />
            </section>
          )}
        </>
      )}

      {pastTeams.length > 0 && (
        <section>
          <h2 className="font-bold text-slate-300 mb-2">Team history</h2>
          <ul className="text-sm text-slate-400 space-y-1">
            {pastTeams.map((m) => (
              <li key={m.id}>
                {m.teamName} — {m.status}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function MatchupTable({ rows }: { rows: NamedMatchupRow[] }) {
  return (
    <Card className="p-3.5">
      <div className="grid grid-cols-[1fr_28px_28px_28px] gap-x-2 text-[11px] text-slate-500 pb-1">
        <span>Opponent</span>
        <span className="text-right">B</span>
        <span className="text-right">R</span>
        <span className="text-right">Out</span>
      </div>
      {rows.slice(0, 8).map((r) => (
        <Link
          key={r.opponentId}
          to={`/players/${r.opponentId}`}
          className="grid grid-cols-[1fr_28px_28px_28px] gap-x-2 items-baseline py-1.5 border-t border-line hover:text-emerald-300"
        >
          <span className="truncate">{r.opponentName}</span>
          <span className="text-right text-slate-400 tabular-nums">{r.balls}</span>
          <span className="text-right font-semibold tabular-nums">{r.runs}</span>
          <span className="text-right text-slate-400 tabular-nums">{r.dismissals || '-'}</span>
        </Link>
      ))}
    </Card>
  )
}

function StatList({ items }: { items: [string, string | number][] }) {
  return (
    <Card className="divide-y divide-line overflow-hidden">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between px-3.5 py-2.5">
          <span className="text-sm text-slate-400">{label}</span>
          <span className="font-display text-lg tracking-wide tabular-nums">{value}</span>
        </div>
      ))}
    </Card>
  )
}
