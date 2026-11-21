import type { Ball } from '../types'

/** A ball counts toward the over (6-ball limit) unless it's a wide or no-ball. */
export function isLegalDelivery(b: Pick<Ball, 'extraType'>): boolean {
  return b.extraType !== 'wide' && b.extraType !== 'noball'
}

export function ballRuns(b: Pick<Ball, 'runsOffBat' | 'extraType' | 'extraRuns'>): number {
  return b.runsOffBat + b.extraRuns
}

/** Runs that count against the bowler's figures (byes/leg-byes don't). */
export function runsAgainstBowler(b: Pick<Ball, 'runsOffBat' | 'extraType' | 'extraRuns'>): number {
  if (b.extraType === 'bye' || b.extraType === 'legbye') return 0
  return b.runsOffBat + b.extraRuns
}

export interface OverProgress {
  completedOvers: number
  ballsInCurrentOver: number
}

/** Given legal deliveries bowled so far in the innings, compute over.ball display (e.g. 12.4). */
export function overProgress(legalBallCount: number): OverProgress {
  return {
    completedOvers: Math.floor(legalBallCount / 6),
    ballsInCurrentOver: legalBallCount % 6,
  }
}

export function formatOvers(legalBallCount: number): string {
  const { completedOvers, ballsInCurrentOver } = overProgress(legalBallCount)
  return `${completedOvers}.${ballsInCurrentOver}`
}

export function economy(runsConceded: number, legalBalls: number): number {
  if (legalBalls === 0) return 0
  return (runsConceded / legalBalls) * 6
}

export function strikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0
  return (runs / balls) * 100
}

export function average(runs: number, outs: number): number | null {
  if (outs === 0) return null
  return runs / outs
}

export function round(n: number, dp = 2): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

export interface InningsLiveState {
  strikerId?: string
  nonStrikerId?: string
  /** The bowler who delivered the last ball, if the over they're bowling isn't finished yet. undefined means a new bowler must be chosen. */
  currentBowlerId?: string
  previousOverBowlerId?: string
  legalBallsBowled: number
  ballsInCurrentOver: number
  totalRuns: number
  wickets: number
  isOverJustCompleted: boolean
}

/** Pure replay of the ball ledger to derive who's on strike/bowling right now. Source of truth = ledger, so undo is just "delete a ball row". */
export function deriveInningsState(
  balls: Ball[],
  openingStrikerId?: string,
  openingNonStrikerId?: string,
): InningsLiveState {
  const sorted = [...balls].sort((a, b) => a.timestamp - b.timestamp)
  let striker = openingStrikerId
  let nonStriker = openingNonStrikerId
  let bowler: string | undefined
  let previousOverBowler: string | undefined
  let ballsInCurrentOver = 0
  let legalBallsBowled = 0
  let totalRuns = 0
  let wickets = 0
  let overJustCompleted = false

  for (const ball of sorted) {
    bowler = ball.bowlerId
    totalRuns += ballRuns(ball)
    if (ball.isWicket) wickets++

    const runsForRotation = ball.extraType === 'bye' || ball.extraType === 'legbye' || ball.extraType === 'wide'
      ? ball.extraRuns
      : ball.runsOffBat
    if (runsForRotation % 2 === 1) {
      ;[striker, nonStriker] = [nonStriker, striker]
    }

    if (ball.isWicket && ball.dismissedPlayerId && ball.replacementBatterId) {
      if (striker === ball.dismissedPlayerId) striker = ball.replacementBatterId
      else if (nonStriker === ball.dismissedPlayerId) nonStriker = ball.replacementBatterId
    }

    overJustCompleted = false
    if (isLegalDelivery(ball)) {
      legalBallsBowled++
      ballsInCurrentOver++
      if (ballsInCurrentOver === 6) {
        ;[striker, nonStriker] = [nonStriker, striker]
        previousOverBowler = bowler
        bowler = undefined
        ballsInCurrentOver = 0
        overJustCompleted = true
      }
    }
  }

  return {
    strikerId: striker,
    nonStrikerId: nonStriker,
    currentBowlerId: bowler,
    previousOverBowlerId: previousOverBowler,
    legalBallsBowled,
    ballsInCurrentOver,
    totalRuns,
    wickets,
    isOverJustCompleted: overJustCompleted,
  }
}
