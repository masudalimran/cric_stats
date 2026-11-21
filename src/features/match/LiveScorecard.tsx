import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import {
  computeBattingStats,
  computeBowlingStats,
  computeFallOfWickets,
  computePartnerships,
} from '../../stats/aggregate'
import { ballRuns, formatOvers, round } from '../../lib/cricket'
import { shortDisplayName } from '../../lib/name'
import type { Ball, Match } from '../../types'
import { Card } from '../../components/Card'
import { ManhattanChart, PartnershipChart, WormChart, perOverData } from '../../components/charts'

export function LiveScorecard({ matchId }: { matchId: string }) {
  const [tab, setTab] = useState<'scorecard' | 'charts'>('scorecard')
  const match = useLiveQuery(() => db.matches.get(matchId), [matchId])
  const innings = useLiveQuery(() => db.innings.where('matchId').equals(matchId).sortBy('order'), [matchId])
  const inningsIds = innings?.map((i) => i.id) ?? []
  const allBalls = useLiveQuery(
    () => (inningsIds.length ? db.balls.where('inningsId').anyOf(inningsIds).toArray() : Promise.resolve<Ball[]>([])),
    [JSON.stringify(inningsIds)],
  )
  const teamIds = innings ? [...new Set(innings.flatMap((i) => [i.battingTeamId, i.bowlingTeamId]))] : []
  const teams = useLiveQuery(() => db.teams.bulkGet(teamIds), [JSON.stringify(teamIds)])
  const playerIds =
    allBalls && innings && match
      ? [
          ...new Set([
            ...allBalls.flatMap((b) => [b.strikerId, b.nonStrikerId, b.bowlerId, b.fielderId].filter(Boolean) as string[]),
            ...innings.flatMap((i) => i.battingOrder),
            ...Object.values(match.playingXI).flat(),
          ]),
        ]
      : []
  const players = useLiveQuery(() => db.players.bulkGet(playerIds), [JSON.stringify(playerIds)])

  if (!match || !innings || !allBalls || !teams || !players) {
    return <div className="p-4 text-slate-400">Loading…</div>
  }

  const teamMap = new Map(teams.filter(Boolean).map((t) => [t!.id, t!]))
  const playerMap = new Map(players.filter(Boolean).map((p) => [p!.id, p!]))
  const name = (id?: string) => (id ? playerMap.get(id)?.currentName ?? '?' : '?')
  const ballsByInnings = new Map(innings.map((i) => [i.id, allBalls.filter((b) => b.inningsId === i.id)] as const))

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['scorecard', 'charts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tap-target px-3.5 py-1.5 rounded-full text-sm font-semibold capitalize ${tab === t ? 'bg-emerald-500 text-black' : 'bg-panel-2 text-slate-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {match.result && (
        <Card className="p-3 text-emerald-300 font-semibold">
          {match.result.isTie ? 'Match tied' : `${teamMap.get(match.result.winnerTeamId ?? '')?.name ?? ''} won ${match.result.margin ?? ''}`}
        </Card>
      )}

      {tab === 'scorecard' ? (
        innings.map((inn) => {
          const balls = ballsByInnings.get(inn.id) ?? []
          const battedIds = inn.battingOrder
          const xi = match.playingXI[inn.battingTeamId] ?? []
          const yetToBat = xi.filter((id) => !battedIds.includes(id))
          // While the innings is still being played, show the whole lineup (in batting order so far,
          // then the rest of the XI in their default order) so you can see who's coming in next.
          // Once it's over, fall back to the compact "Did not bat" convention real scorecards use.
          const displayIds = inn.isComplete ? battedIds : [...battedIds, ...yetToBat]
          const totalRuns = balls.reduce((s, b) => s + ballRuns(b), 0)
          const bowlerIds = [...new Set(balls.map((b) => b.bowlerId))]
          const legalCount = balls.filter((b) => b.extraType !== 'wide' && b.extraType !== 'noball').length

          return (
            <Card key={inn.id} className="p-3.5 space-y-3">
              <h2 className="flex items-baseline justify-between gap-2">
                <span className="font-bold truncate">{teamMap.get(inn.battingTeamId)?.name}</span>
                <span className="font-display text-2xl tracking-wide text-emerald-400 shrink-0">
                  {totalRuns}/{balls.filter((b) => b.isWicket).length}
                  <span className="text-sm text-slate-400 font-sans ml-1.5">({formatOvers(legalCount)} ov)</span>
                </span>
              </h2>

              <div>
                <div className="grid grid-cols-[1fr_26px_26px_24px_24px_40px] gap-x-2 text-[11px] text-slate-500 px-0.5 pb-1">
                  <span>Batter</span>
                  <span className="text-right">R</span>
                  <span className="text-right">B</span>
                  <span className="text-right">4s</span>
                  <span className="text-right">6s</span>
                  <span className="text-right">SR</span>
                </div>
                {displayIds.map((pid) => {
                  const hasBatted = battedIds.includes(pid)
                  if (!hasBatted) {
                    return (
                      <div key={pid} className="py-2 border-t border-line opacity-50">
                        <div className="grid grid-cols-[1fr_26px_26px_24px_24px_40px] gap-x-2 items-baseline">
                          <Link to={`/players/${pid}`} className="hover:underline font-medium truncate">
                            {name(pid)}
                          </Link>
                          <span className="text-right tabular-nums">–</span>
                          <span className="text-right tabular-nums">–</span>
                          <span className="text-right tabular-nums">–</span>
                          <span className="text-right tabular-nums">–</span>
                          <span className="text-right tabular-nums">–</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">yet to bat</div>
                      </div>
                    )
                  }
                  const bs = computeBattingStats(balls, pid)
                  const wicketBall = balls.find((b) => b.isWicket && b.dismissedPlayerId === pid)
                  const isNotOut = !wicketBall
                  return (
                    <div key={pid} className="py-2 border-t border-line">
                      <div className="grid grid-cols-[1fr_26px_26px_24px_24px_40px] gap-x-2 items-baseline">
                        <Link to={`/players/${pid}`} className="hover:underline font-medium truncate">
                          {name(pid)}
                          {isNotOut && <span className="text-emerald-400">*</span>}
                        </Link>
                        <span className="text-right font-bold tabular-nums">{bs.runs}</span>
                        <span className="text-right text-slate-400 tabular-nums">{bs.balls}</span>
                        <span className="text-right text-slate-400 tabular-nums">{bs.fours}</span>
                        <span className="text-right text-slate-400 tabular-nums">{bs.sixes}</span>
                        <span className="text-right text-slate-400 tabular-nums">{Math.round(bs.strikeRate)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{dismissalText(wicketBall, name)}</div>
                    </div>
                  )
                })}
                {inn.isComplete && yetToBat.length > 0 && (
                  <div className="text-xs text-slate-500 pt-2 border-t border-line">
                    Did not bat: {yetToBat.map((id) => name(id)).join(', ')}
                  </div>
                )}
              </div>

              <div>
                <div className="grid grid-cols-[1fr_32px_28px_22px_36px] gap-x-2 text-[11px] text-slate-500 px-0.5 pb-1">
                  <span>Bowler ({teamMap.get(inn.bowlingTeamId)?.name})</span>
                  <span className="text-right">O</span>
                  <span className="text-right">R</span>
                  <span className="text-right">W</span>
                  <span className="text-right">Econ</span>
                </div>
                {bowlerIds.map((pid) => {
                  const bw = computeBowlingStats(balls, pid, new Map([[inn.id, match.id]]))
                  return (
                    <div key={pid} className="grid grid-cols-[1fr_32px_28px_22px_36px] gap-x-2 items-baseline py-1.5 border-t border-line">
                      <Link to={`/players/${pid}`} className="hover:underline truncate">
                        {name(pid)}
                      </Link>
                      <span className="text-right text-slate-400 tabular-nums">{formatOvers(bw.legalBalls)}</span>
                      <span className="text-right text-slate-400 tabular-nums">{bw.runsConceded}</span>
                      <span className="text-right font-bold tabular-nums">{bw.wickets}</span>
                      <span className="text-right text-slate-400 tabular-nums">{round(bw.economy)}</span>
                    </div>
                  )
                })}
              </div>

              {balls.some((b) => b.isWicket) && (
                <div>
                  <div className="text-[11px] text-slate-500 pb-1">Fall of wickets</div>
                  <div className="flex flex-wrap gap-1.5">
                    {computeFallOfWickets(balls).map((fow) => (
                      <span key={fow.wicketNumber} className="text-xs bg-panel-2 rounded-md px-2 py-1">
                        <span className="font-bold">{fow.wicketNumber}-{fow.teamRunsAtFall}</span>{' '}
                        <span className="text-slate-400">
                          ({name(fow.dismissedPlayerId)}, {fow.overs} ov)
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })
      ) : (
        <ChartsTab match={match} ballsByInnings={ballsByInnings} teamMap={teamMap} innings={innings} name={name} />
      )}
    </div>
  )
}

function ChartsTab({
  innings,
  ballsByInnings,
  teamMap,
  name,
}: {
  match: Match
  innings: { id: string; battingTeamId: string }[]
  ballsByInnings: Map<string, Ball[]>
  teamMap: Map<string, { name: string }>
  name: (id?: string) => string
}) {
  const inningsOvers = innings.map((inn) => {
    const { oversRuns, oversWickets } = perOverData(ballsByInnings.get(inn.id) ?? [])
    return { label: teamMap.get(inn.battingTeamId)?.name ?? '?', oversRuns, oversWickets }
  })

  if (inningsOvers.every((i) => i.oversRuns.length === 0)) {
    return <p className="text-slate-400 text-sm">Not enough balls bowled yet to chart.</p>
  }

  return (
    <div className="space-y-5">
      <Card className="p-3.5">
        <h3 className="font-bold text-sm mb-2">Runs per over (Manhattan)</h3>
        <ManhattanChart innings={inningsOvers} />
      </Card>
      {inningsOvers.length > 1 && (
        <Card className="p-3.5">
          <h3 className="font-bold text-sm mb-2">Run comparison (Worm)</h3>
          <WormChart innings={inningsOvers} />
        </Card>
      )}

      {innings.map((inn) => {
        const partnerships = computePartnerships(ballsByInnings.get(inn.id) ?? [])
        if (partnerships.length === 0) return null
        return (
          <Card key={inn.id} className="p-3.5">
            <h3 className="font-bold text-sm mb-2">
              Partnerships — {teamMap.get(inn.battingTeamId)?.name ?? '?'}
            </h3>
            <PartnershipChart
              rows={partnerships.map((p) => ({
                nameA: shortDisplayName(name(p.batterAId)),
                nameB: shortDisplayName(name(p.batterBId)),
                runs: p.runs,
                balls: p.balls,
              }))}
            />
          </Card>
        )
      })}
    </div>
  )
}

function dismissalText(ball: Ball | undefined, name: (id: string) => string): string {
  if (!ball) return 'not out'
  switch (ball.wicketType) {
    case 'bowled':
      return `b ${name(ball.bowlerId)}`
    case 'lbw':
      return `lbw b ${name(ball.bowlerId)}`
    case 'hitwicket':
      return `hit wicket b ${name(ball.bowlerId)}`
    case 'caught':
      return `c ${ball.fielderId ? name(ball.fielderId) : '?'} b ${name(ball.bowlerId)}`
    case 'stumped':
      return `st ${ball.fielderId ? name(ball.fielderId) : '?'} b ${name(ball.bowlerId)}`
    case 'runout':
      return `run out${ball.fielderId ? ` (${name(ball.fielderId)})` : ''}`
    case 'retired':
      return 'retired'
    case 'obstructing':
      return 'other'
    default:
      return 'out'
  }
}
