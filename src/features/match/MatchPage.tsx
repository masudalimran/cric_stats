import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { getRoster } from '../../data/players'
import {
  completeMatch,
  forfeitMatch,
  getSortedBalls,
  markInningsComplete,
  recordBall,
  setOpeners,
  startNextInnings,
  undoLastBall,
  wicketsCap,
} from '../../data/match'
import { deriveInningsState, formatOvers, ballRuns } from '../../lib/cricket'
import { celebrateFour, celebrateSix, celebrateWicket } from '../../lib/celebrate'
import type { Ball, ExtraType, Innings } from '../../types'
import type { RosterEntry } from '../../data/players'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ByeIcon, FlagIcon, LegByeIcon, NoBallIcon, UndoIcon, WideIcon, WicketIcon } from '../../components/icons'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Select } from '../../components/Select'
import { ForfeitModal } from './ForfeitModal'
import { WicketModal, type WicketResult } from './WicketModal'
import { LiveScorecard } from './LiveScorecard'

const ScoringIcon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a5 5 0 0 1 5 5c0 2-1 3.5-2 5l-3 10-3-10c-1-1.5-2-3-2-5a5 5 0 0 1 5-5z" />
  </svg>
)

export function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const [sheetOpen, setSheetOpen] = useState(false)
  const match = useLiveQuery(() => db.matches.get(matchId!), [matchId])
  const fixture = useLiveQuery(() => (match ? db.fixtures.get(match.fixtureId) : undefined), [match])
  const innings = useLiveQuery(
    () => (match ? db.innings.where('matchId').equals(match.id).toArray() : Promise.resolve<Innings[]>([])),
    [match],
  )
  const currentInnings = innings?.find((i) => i.order === match?.currentInningsIndex)
  const balls = useLiveQuery(
    () => (currentInnings ? getSortedBalls(currentInnings.id) : Promise.resolve<Ball[]>([])),
    [currentInnings?.id, currentInnings],
  )
  const battingRoster = useLiveQuery(
    () => (currentInnings ? getRoster(currentInnings.battingTeamId) : Promise.resolve<RosterEntry[]>([])),
    [currentInnings?.battingTeamId],
  )
  const bowlingRoster = useLiveQuery(
    () => (currentInnings ? getRoster(currentInnings.bowlingTeamId) : Promise.resolve<RosterEntry[]>([])),
    [currentInnings?.bowlingTeamId],
  )
  const teams = useLiveQuery(() => db.teams.toArray(), [])
  const firstInnings = innings?.find((i) => i.order === 0)
  const firstInningsBalls = useLiveQuery(
    () =>
      firstInnings && currentInnings?.order && currentInnings.order > 0
        ? getSortedBalls(firstInnings.id)
        : Promise.resolve<Ball[]>([]),
    [firstInnings?.id, currentInnings?.order],
  )

  const [armedExtra, setArmedExtra] = useState<ExtraType>(null)
  const [showWicket, setShowWicket] = useState(false)
  const [showForfeit, setShowForfeit] = useState(false)
  const [newBowlerPick, setNewBowlerPick] = useState('')

  const state = useMemo(() => {
    if (!currentInnings || !balls) return null
    return deriveInningsState(balls, currentInnings.openingStrikerId, currentInnings.openingNonStrikerId)
  }, [balls, currentInnings])

  if (!match || !fixture || !innings || !teams) {
    return <div className="p-4 text-slate-400">Loading…</div>
  }

  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? '?'
  const title = `${teamName(fixture.teamAId)} vs ${teamName(fixture.teamBId)}`
  const titleNode = (
    <>
      <span className="sm:hidden flex flex-col leading-tight">
        <span className="truncate">{teamName(fixture.teamAId)}</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-500 font-normal my-0.5">vs</span>
        <span className="truncate">{teamName(fixture.teamBId)}</span>
      </span>
      <span className="hidden sm:inline truncate">{title}</span>
    </>
  )

  if (match.status === 'completed') {
    return (
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <PageHeader title={titleNode} back="/fixtures" />
        <LiveScorecard matchId={match.id} />
      </div>
    )
  }

  if (!currentInnings || !balls || !battingRoster || !bowlingRoster || !state) {
    return <div className="p-4 text-slate-400">Loading…</div>
  }

  async function handleForfeit(forfeitingTeamId: string) {
    await forfeitMatch(match!, fixture!, forfeitingTeamId)
    setShowForfeit(false)
  }

  const forfeitButton = (
    <button
      onClick={() => setShowForfeit(true)}
      aria-label="Forfeit match"
      title="Forfeit match"
      className="tap-target shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/30"
    >
      {FlagIcon}
    </button>
  )

  const forfeitModal = showForfeit && (
    <ForfeitModal
      teamAId={fixture.teamAId}
      teamAName={teamName(fixture.teamAId)}
      teamBId={fixture.teamBId}
      teamBName={teamName(fixture.teamBId)}
      onConfirm={handleForfeit}
      onCancel={() => setShowForfeit(false)}
    />
  )

  const playerName = (id?: string) =>
    [...battingRoster, ...bowlingRoster].find((r) => r.player.id === id)?.player.currentName ?? '—'

  const xiIds = match.playingXI[currentInnings.battingTeamId] ?? battingRoster.map((r) => r.player.id)
  const bowlingXiIds = match.playingXI[currentInnings.bowlingTeamId] ?? bowlingRoster.map((r) => r.player.id)
  const xiSize = xiIds.length
  const allOutCap = wicketsCap(xiSize)

  const legalCount = state.legalBallsBowled
  const firstInningsRuns = firstInningsBalls?.reduce((s, b) => s + ballRuns(b), 0)
  const target = currentInnings.order > 0 && firstInningsRuns !== undefined ? firstInningsRuns + 1 : undefined

  const oversRemaining = currentInnings.oversLimit - Math.floor(legalCount / 6)
  const ballsRemaining = currentInnings.oversLimit * 6 - legalCount
  const oversExhausted = ballsRemaining <= 0
  const allOut = state.wickets >= allOutCap
  const targetReached = target !== undefined && state.totalRuns >= target
  const inningsShouldEnd = oversExhausted || allOut || targetReached

  const needsBowler = !state.currentBowlerId && !newBowlerPick && !inningsShouldEnd
  const availableBowlers = bowlingRoster.filter(
    (r) => bowlingXiIds.includes(r.player.id) && r.player.id !== state.previousOverBowlerId,
  )
  const allBowlersInXI = bowlingRoster.filter((r) => bowlingXiIds.includes(r.player.id))

  async function withBowler(fn: (bowlerId: string) => Promise<void>) {
    const bowlerId = state!.currentBowlerId ?? newBowlerPick
    if (!bowlerId) return
    await fn(bowlerId)
    setNewBowlerPick('')
  }

  async function recordRun(runs: number) {
    if (runs === 4) celebrateFour()
    if (runs === 6) celebrateSix()
    await withBowler((bowlerId) =>
      recordBall(currentInnings!, {
        bowlerId,
        runsOffBat: runs,
        extraType: null,
        extraRuns: 0,
        isWicket: false,
        wicketType: null,
      }),
    )
  }

  async function recordExtra(extraType: ExtraType, runs: number) {
    await withBowler((bowlerId) =>
      recordBall(currentInnings!, {
        bowlerId,
        runsOffBat: extraType === 'noball' ? runs : 0,
        extraType,
        extraRuns: extraType === 'noball' ? 1 : runs,
        isWicket: false,
        wicketType: null,
      }),
    )
    setArmedExtra(null)
  }

  async function handleWicketConfirm(result: WicketResult) {
    celebrateWicket()
    await withBowler((bowlerId) =>
      recordBall(currentInnings!, {
        bowlerId,
        runsOffBat: 0,
        extraType: null,
        extraRuns: 0,
        isWicket: true,
        wicketType: result.wicketType,
        dismissedPlayerId: result.dismissedPlayerId,
        fielderId: result.fielderId,
        replacementBatterId: result.replacementBatterId,
      }),
    )
    setShowWicket(false)
  }

  const newBatterOptions = xiIds
    .filter((id) => !currentInnings.battingOrder.includes(id) && id !== state.strikerId && id !== state.nonStrikerId)
    .map((id) => ({ id, name: playerName(id) }))

  const fieldingXIPeople = bowlingRoster
    .filter((r) => bowlingXiIds.includes(r.player.id))
    .map((r) => ({ id: r.player.id, name: r.player.currentName }))

  async function handleEndInnings() {
    const inn = currentInnings!
    await markInningsComplete(inn.id)
    if (inn.order === 0) {
      await startNextInnings(match!, inn)
    } else {
      const openingInnings = innings!.find((i) => i.order === 0)
      const firstRuns = openingInnings
        ? await getSortedBalls(openingInnings.id).then((bs) => bs.reduce((s, b) => s + ballRuns(b), 0))
        : 0
      const secondRuns = state!.totalRuns
      const ballsLeft = inn.oversLimit * 6 - state!.legalBallsBowled
      const result =
        secondRuns > firstRuns
          ? {
              winnerTeamId: inn.battingTeamId,
              margin: `by ${allOutCap + 1 - state!.wickets} wickets${ballsLeft > 0 ? ` (${ballsLeft} ball${ballsLeft === 1 ? '' : 's'} left)` : ''}`,
            }
          : secondRuns === firstRuns
            ? { isTie: true }
            : { winnerTeamId: inn.bowlingTeamId, margin: `by ${firstRuns - secondRuns} runs` }
      await completeMatch(match!.id, fixture!.id, result)
    }
  }

  const needsOpeners = !currentInnings.openingStrikerId || !currentInnings.openingNonStrikerId

  if (needsOpeners) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-4">
        <PageHeader title={titleNode} back="/fixtures" action={forfeitButton} />
        <OpenersPrompt inningsId={currentInnings.id} xiIds={xiIds} roster={battingRoster} />
        {forfeitModal}
      </div>
    )
  }

  if (inningsShouldEnd && !currentInnings.isComplete) {
    return (
      <div className="p-4 max-w-md mx-auto text-center space-y-4">
        <PageHeader title={titleNode} back="/fixtures" action={forfeitButton} />
        <h2 className="font-display text-3xl tracking-wide">Innings complete</h2>
        <p className="text-slate-300 text-lg">
          {teamName(currentInnings.battingTeamId)}: {state.totalRuns}/{state.wickets} ({formatOvers(legalCount)} ov)
        </p>
        <Button onClick={handleEndInnings}>
          {currentInnings.order === 0 ? 'Start 2nd innings' : 'Finish match'}
        </Button>
        {forfeitModal}
      </div>
    )
  }

  function ScoringPanel() {
    const inn = currentInnings!
    const st = state!
    const bls = balls!
    return (
      <div className="space-y-4">
        <ScoreHeader
          teamName={teamName(inn.battingTeamId)}
          runs={st.totalRuns}
          wickets={st.wickets}
          overs={formatOvers(legalCount)}
          oversLimit={inn.oversLimit}
          strikerName={playerName(st.strikerId)}
          nonStrikerName={playerName(st.nonStrikerId)}
          bowlerName={playerName(st.currentBowlerId)}
          balls={bls}
          oversRemaining={oversRemaining}
          target={target}
        />

        {needsBowler ? (
          <div>
            <h2 className="text-sm text-slate-400 mb-2">
              Select bowler{st.previousOverBowlerId ? ' (new over)' : ''}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {availableBowlers.map((r) => (
                <button
                  key={r.player.id}
                  onClick={() => setNewBowlerPick(r.player.id)}
                  className={`tap-target py-2 rounded-xl border ${newBowlerPick === r.player.id ? 'border-emerald-500 bg-emerald-600/20' : 'border-line'}`}
                >
                  {r.player.currentName}
                </button>
              ))}
            </div>
            {st.previousOverBowlerId && availableBowlers.length < allBowlersInXI.length && (
              <p className="text-xs text-amber-400 mt-2">Same bowler can't bowl consecutive overs — list filtered.</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 6].map((n) => {
                const zeroDisabledForExtra = n === 0 && armedExtra && armedExtra !== 'noball'
                return (
                  <button
                    key={n}
                    disabled={!!zeroDisabledForExtra}
                    onClick={() => (armedExtra ? recordExtra(armedExtra, n) : recordRun(n))}
                    className="tap-target py-5 text-2xl font-bold rounded-xl bg-panel-2 hover:bg-slate-700 active:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:bg-panel-2"
                  >
                    {n}
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {(
                [
                  { type: 'wide', label: 'Wide', icon: WideIcon },
                  { type: 'noball', label: 'No-ball', icon: NoBallIcon },
                  { type: 'bye', label: 'Bye', icon: ByeIcon },
                  { type: 'legbye', label: 'Leg bye', icon: LegByeIcon },
                ] as const
              ).map((e) => (
                <button
                  key={e.type}
                  onClick={() => setArmedExtra(armedExtra === e.type ? null : e.type)}
                  className={`tap-target flex flex-col items-center gap-1 py-2.5 rounded-xl border ${armedExtra === e.type ? 'border-emerald-500 bg-emerald-600/20' : 'border-line bg-panel'}`}
                >
                  {e.icon}
                  <span className="text-[10px] font-medium leading-none">{e.label}</span>
                </button>
              ))}
              <button
                onClick={() => setShowWicket(true)}
                className="tap-target flex flex-col items-center gap-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500"
              >
                {WicketIcon}
                <span className="text-[10px] font-bold leading-none">OUT</span>
              </button>
            </div>
            {armedExtra && (
              <p className="text-xs text-slate-400 -mt-1">
                Tap a run value above for total {armedExtra === 'noball' ? 'runs off the bat' : 'runs taken'} on this{' '}
                {armedExtra}.
              </p>
            )}
          </>
        )}

        <Button variant="ghost" className="w-full" onClick={() => void undoLastBall(inn.id)}>
          <span className="inline-flex items-center gap-1.5">{UndoIcon} Undo last ball</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-6xl mx-auto pb-24 lg:pb-8 relative">
      <PageHeader
        title={titleNode}
        subtitle={
          <span className="hidden sm:inline-flex items-center gap-1 text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> Live
          </span>
        }
        back="/fixtures"
        action={
          <>
            <div className="sm:hidden flex flex-col items-end gap-1.5">
              <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> Live
              </span>
              {forfeitButton}
            </div>
            <div className="hidden sm:block">{forfeitButton}</div>
          </>
        }
      />

      <div className="lg:flex lg:gap-6 lg:items-start">
        <div className="lg:flex-1 min-w-0">
          <LiveScorecard matchId={match.id} />
        </div>

        {/* Desktop: controls stay open as a sidebar next to the scorecard. */}
        <div className="hidden lg:block lg:w-[380px] shrink-0 sticky top-6">
          <Card className="p-4">
            <h2 className="font-bold mb-3">Score this ball</h2>
            <ScoringPanel />
          </Card>
        </div>
      </div>

      {/* Mobile/tablet: controls open as a bottom-sheet via the floating button. */}
      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Open scoring controls"
        className="lg:hidden tap-target cta-pulse fixed bottom-20 sm:bottom-8 right-5 z-40 h-16 w-16 rounded-full bg-emerald-500 text-black grid place-items-center shadow-[0_6px_20px_rgba(16,185,129,.45)] ring-4 ring-ink"
      >
        {ScoringIcon}
      </button>

      {sheetOpen && (
        <div className="lg:hidden">
          <Modal title="Score this ball" onClose={() => setSheetOpen(false)} wide>
            <ScoringPanel />
          </Modal>
        </div>
      )}

      {showWicket && (
        <WicketModal
          strikerId={state.strikerId!}
          strikerName={playerName(state.strikerId)}
          nonStrikerId={state.nonStrikerId!}
          nonStrikerName={playerName(state.nonStrikerId)}
          fieldingXI={fieldingXIPeople}
          newBatterOptions={newBatterOptions}
          isLastWicket={state.wickets + 1 >= allOutCap}
          onConfirm={handleWicketConfirm}
          onCancel={() => setShowWicket(false)}
        />
      )}

      {forfeitModal}
    </div>
  )
}

function OpenersPrompt({
  inningsId,
  xiIds,
  roster,
}: {
  inningsId: string
  xiIds: string[]
  roster: { player: { id: string; currentName: string } }[]
}) {
  const [striker, setStriker] = useState('')
  const [nonStriker, setNonStriker] = useState('')
  const options = roster.filter((r) => xiIds.includes(r.player.id))

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl tracking-wide">Opening batters</h2>
      <Select
        value={striker}
        onChange={setStriker}
        placeholder="Striker"
        title="Pick striker"
        options={options.map((r) => ({ value: r.player.id, label: r.player.currentName, disabled: r.player.id === nonStriker }))}
      />
      <Select
        value={nonStriker}
        onChange={setNonStriker}
        placeholder="Non-striker"
        title="Pick non-striker"
        options={options.map((r) => ({ value: r.player.id, label: r.player.currentName, disabled: r.player.id === striker }))}
      />
      <Button disabled={!striker || !nonStriker} onClick={() => setOpeners(inningsId, striker, nonStriker)}>
        Confirm openers
      </Button>
    </div>
  )
}

function ScoreHeader({
  teamName,
  runs,
  wickets,
  overs,
  oversLimit,
  strikerName,
  nonStrikerName,
  bowlerName,
  balls,
  oversRemaining,
  target,
}: {
  teamName: string
  runs: number
  wickets: number
  overs: string
  oversLimit: number
  strikerName: string
  nonStrikerName: string
  bowlerName: string
  balls: { timestamp: number }[]
  oversRemaining: number
  target?: number
}) {
  const last6 = useLast6Balls(balls)
  return (
    <div className="rounded-xl bg-panel-2 border border-line p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-lg font-semibold">{teamName}</div>
        <div className="text-2xl font-bold font-display tracking-wide">
          {runs}/{wickets}
        </div>
      </div>
      <div className="text-sm text-slate-400 flex justify-between">
        <span>
          {overs} / {oversLimit} ov
        </span>
        <span>{Math.max(oversRemaining, 0)} ov left</span>
      </div>
      {target !== undefined && (
        <div className="text-xs text-amber-400 mt-1">Need {Math.max(target - runs, 0)} to win</div>
      )}
      <div className="flex justify-between text-sm mt-2">
        <span>
          🏏 {strikerName} <span className="text-slate-500">· {nonStrikerName}</span>
        </span>
        <span className="text-slate-400">⚾ {bowlerName}</span>
      </div>
      {last6.length > 0 && (
        <div className="flex gap-1 mt-3">
          {last6.map((b, i) => (
            <span key={i} className={`text-xs px-2 py-1 rounded-md font-mono ${b === 'W' ? 'bg-red-700' : 'bg-panel'}`}>
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function useLast6Balls(balls: { timestamp: number }[]): string[] {
  const full = balls as unknown as { runsOffBat: number; extraType: ExtraType; extraRuns: number; isWicket: boolean }[]
  return full.slice(-6).map((b) => {
    if (b.isWicket) return 'W'
    if (b.extraType === 'wide') return `${b.extraRuns}wd`
    if (b.extraType === 'noball') return `${b.runsOffBat}nb`
    if (b.extraType === 'bye') return `${b.extraRuns}b`
    if (b.extraType === 'legbye') return `${b.extraRuns}lb`
    return String(b.runsOffBat)
  })
}
