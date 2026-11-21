import type { Ball, WicketType } from '../types'
import { average, ballRuns, isLegalDelivery, runsAgainstBowler, strikeRate } from '../lib/cricket'

const BOWLER_CREDITED_WICKETS: WicketType[] = ['bowled', 'caught', 'lbw', 'stumped', 'hitwicket']

export interface BattingStats {
  innings: number
  runs: number
  balls: number
  notOuts: number
  outs: number
  fours: number
  sixes: number
  fifties: number
  hundreds: number
  ducks: number
  highestScore: number
  highestScoreNotOut: boolean
  average: number | null
  strikeRate: number
}

export interface BowlingStats {
  innings: number
  legalBalls: number
  runsConceded: number
  wickets: number
  maidens: number
  average: number | null
  economy: number
  strikeRate: number | null
  bestFigures: { wickets: number; runs: number } | null
}

export interface FieldingStats {
  catches: number
  runOuts: number
  stumpings: number
}

/** Balls faced by a batter: every delivery except wides (no-balls count as faced). */
function facedByBatter(b: Ball): boolean {
  return b.extraType !== 'wide'
}

export function computeBattingStats(balls: Ball[], playerId: string): BattingStats {
  const byInnings = new Map<string, Ball[]>()
  for (const b of balls) {
    if (b.strikerId !== playerId && b.dismissedPlayerId !== playerId) continue
    const arr = byInnings.get(b.inningsId) ?? []
    arr.push(b)
    byInnings.set(b.inningsId, arr)
  }

  let runs = 0
  let ballsFaced = 0
  let fours = 0
  let sixes = 0
  let fifties = 0
  let hundreds = 0
  let ducks = 0
  let outs = 0
  let highestScore = 0
  let highestScoreNotOut = false

  for (const inningsBalls of byInnings.values()) {
    let inningsRuns = 0
    let inningsBallsFaced = 0
    let wasDismissed = false
    for (const b of inningsBalls) {
      if (b.strikerId === playerId) {
        inningsRuns += b.runsOffBat
        if (facedByBatter(b)) inningsBallsFaced++
        if (b.runsOffBat === 4) fours++
        if (b.runsOffBat === 6) sixes++
      }
      if (b.isWicket && b.dismissedPlayerId === playerId) wasDismissed = true
    }
    runs += inningsRuns
    ballsFaced += inningsBallsFaced
    if (wasDismissed) {
      outs++
      if (inningsRuns === 0) ducks++
    }
    if (inningsRuns >= 100) hundreds++
    else if (inningsRuns >= 50) fifties++

    if (inningsRuns > highestScore || (inningsRuns === highestScore && !wasDismissed)) {
      highestScore = inningsRuns
      highestScoreNotOut = !wasDismissed
    }
  }

  const inningsCount = byInnings.size
  const notOuts = inningsCount - outs

  return {
    innings: inningsCount,
    runs,
    balls: ballsFaced,
    notOuts,
    outs,
    fours,
    sixes,
    fifties,
    hundreds,
    ducks,
    highestScore,
    highestScoreNotOut,
    average: average(runs, outs),
    strikeRate: strikeRate(runs, ballsFaced),
  }
}

export function computeBowlingStats(
  balls: Ball[],
  playerId: string,
  matchIdByInnings: Map<string, string>,
): BowlingStats {
  const bowlerBalls = balls.filter((b) => b.bowlerId === playerId)
  const byInnings = new Map<string, Ball[]>()
  for (const b of bowlerBalls) {
    const arr = byInnings.get(b.inningsId) ?? []
    arr.push(b)
    byInnings.set(b.inningsId, arr)
  }

  let legalBalls = 0
  let runsConceded = 0
  let wickets = 0
  let maidens = 0
  const perMatch = new Map<string, { wickets: number; runs: number }>()

  for (const [inningsId, inningsBalls] of byInnings) {
    const byOver = new Map<number, Ball[]>()
    let matchWickets = 0
    let matchRuns = 0
    for (const b of inningsBalls) {
      if (isLegalDelivery(b)) legalBalls++
      const conceded = runsAgainstBowler(b)
      runsConceded += conceded
      matchRuns += conceded
      if (b.isWicket && BOWLER_CREDITED_WICKETS.includes(b.wicketType)) {
        wickets++
        matchWickets++
      }
      const arr = byOver.get(b.overNumber) ?? []
      arr.push(b)
      byOver.set(b.overNumber, arr)
    }
    for (const overBalls of byOver.values()) {
      const legal = overBalls.filter(isLegalDelivery)
      if (legal.length === 6 && legal.every((b) => runsAgainstBowler(b) === 0)) maidens++
    }
    const matchId = matchIdByInnings.get(inningsId) ?? inningsId
    const prev = perMatch.get(matchId) ?? { wickets: 0, runs: 0 }
    perMatch.set(matchId, { wickets: prev.wickets + matchWickets, runs: prev.runs + matchRuns })
  }

  let bestFigures: { wickets: number; runs: number } | null = null
  for (const fig of perMatch.values()) {
    if (
      !bestFigures ||
      fig.wickets > bestFigures.wickets ||
      (fig.wickets === bestFigures.wickets && fig.runs < bestFigures.runs)
    ) {
      bestFigures = fig
    }
  }

  return {
    innings: byInnings.size,
    legalBalls,
    runsConceded,
    wickets,
    maidens,
    average: wickets > 0 ? runsConceded / wickets : null,
    economy: legalBalls > 0 ? (runsConceded / legalBalls) * 6 : 0,
    strikeRate: wickets > 0 ? legalBalls / wickets : null,
    bestFigures,
  }
}

export function computeFieldingStats(balls: Ball[], playerId: string): FieldingStats {
  let catches = 0
  let runOuts = 0
  let stumpings = 0
  for (const b of balls) {
    if (!b.isWicket || b.fielderId !== playerId) continue
    if (b.wicketType === 'caught') catches++
    else if (b.wicketType === 'runout') runOuts++
    else if (b.wicketType === 'stumped') stumpings++
  }
  return { catches, runOuts, stumpings }
}

export interface FallOfWicket {
  wicketNumber: number
  teamRunsAtFall: number
  overs: string
  dismissedPlayerId: string
  wicketType: WicketType
  bowlerId: string
  fielderId?: string
}

/** The classic "1-23 (Player, 3.2 ov)" list, in the order wickets actually fell in an innings. */
export function computeFallOfWickets(inningsBalls: Ball[]): FallOfWicket[] {
  const sorted = [...inningsBalls].sort((a, b) => a.timestamp - b.timestamp)
  const result: FallOfWicket[] = []
  let teamRuns = 0
  let legalCount = 0
  for (const b of sorted) {
    teamRuns += ballRuns(b)
    if (isLegalDelivery(b)) legalCount++
    if (b.isWicket && b.dismissedPlayerId) {
      result.push({
        wicketNumber: result.length + 1,
        teamRunsAtFall: teamRuns,
        overs: `${Math.floor((legalCount - 1) / 6)}.${((legalCount - 1) % 6) + 1}`,
        dismissedPlayerId: b.dismissedPlayerId,
        wicketType: b.wicketType,
        bowlerId: b.bowlerId,
        fielderId: b.fielderId,
      })
    }
  }
  return result
}

export interface Partnership {
  wicket: number
  batterAId: string
  batterBId: string
  runs: number
  balls: number
}

/** Runs/balls added for each distinct pair of batters at the crease, in order. The last entry may be unbeaten. */
export function computePartnerships(inningsBalls: Ball[]): Partnership[] {
  const sorted = [...inningsBalls].sort((a, b) => a.timestamp - b.timestamp)
  const result: Partnership[] = []
  let pair: [string, string] | null = null
  let runs = 0
  let legalBalls = 0

  const flush = () => {
    if (pair && (runs > 0 || legalBalls > 0)) {
      result.push({ wicket: result.length + 1, batterAId: pair[0], batterBId: pair[1], runs, balls: legalBalls })
    }
    runs = 0
    legalBalls = 0
  }

  for (const b of sorted) {
    const key = [b.strikerId, b.nonStrikerId].sort() as [string, string]
    if (!pair || pair[0] !== key[0] || pair[1] !== key[1]) {
      flush()
      pair = key
    }
    runs += ballRuns(b)
    if (isLegalDelivery(b)) legalBalls++
    if (b.isWicket) {
      flush()
      pair = null
    }
  }
  flush()
  return result
}

export interface MatchupRow {
  opponentId: string
  runs: number
  balls: number
  dismissals: number
}

/** For a given batter: runs/balls/dismissals against each bowler they've faced, career-wide. */
export function computeBattingMatchups(balls: Ball[], batterId: string): MatchupRow[] {
  const byBowler = new Map<string, MatchupRow>()
  for (const b of balls) {
    if (b.strikerId !== batterId) continue
    const row = byBowler.get(b.bowlerId) ?? { opponentId: b.bowlerId, runs: 0, balls: 0, dismissals: 0 }
    row.runs += b.runsOffBat
    if (facedByBatter(b)) row.balls++
    if (b.isWicket && b.dismissedPlayerId === batterId) row.dismissals++
    byBowler.set(b.bowlerId, row)
  }
  return [...byBowler.values()].sort((a, b) => b.balls - a.balls)
}

/** For a given bowler: runs/balls/dismissals against each batter they've bowled to, career-wide. */
export function computeBowlingMatchups(balls: Ball[], bowlerId: string): MatchupRow[] {
  const byBatter = new Map<string, MatchupRow>()
  for (const b of balls) {
    if (b.bowlerId !== bowlerId) continue
    const row = byBatter.get(b.strikerId) ?? { opponentId: b.strikerId, runs: 0, balls: 0, dismissals: 0 }
    row.runs += b.runsOffBat
    if (facedByBatter(b)) row.balls++
    if (b.isWicket && b.dismissedPlayerId === b.strikerId && BOWLER_CREDITED_WICKETS.includes(b.wicketType)) {
      row.dismissals++
    }
    byBatter.set(b.strikerId, row)
  }
  return [...byBatter.values()].sort((a, b) => b.balls - a.balls)
}

const WICKET_LABELS: Record<string, string> = {
  bowled: 'Bowled',
  caught: 'Caught',
  lbw: 'LBW',
  runout: 'Run out',
  stumped: 'Stumped',
  hitwicket: 'Hit wicket',
  retired: 'Retired',
  obstructing: 'Other',
}

export interface DismissalCount {
  type: string
  count: number
}

export function computeDismissalBreakdown(balls: Ball[], playerId: string): DismissalCount[] {
  const counts = new Map<string, number>()
  for (const b of balls) {
    if (!b.isWicket || b.dismissedPlayerId !== playerId || !b.wicketType) continue
    const label = WICKET_LABELS[b.wicketType] ?? 'Other'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
}

/** Balls faced by `playerId` (within this one innings' balls) at the point their cumulative runs first reach `milestone`. */
export function computeBallsToMilestone(inningsBalls: Ball[], playerId: string, milestone: number): number | null {
  const sorted = [...inningsBalls].sort((a, b) => a.timestamp - b.timestamp)
  let runs = 0
  let ballsFaced = 0
  for (const b of sorted) {
    if (b.strikerId !== playerId) continue
    if (facedByBatter(b)) ballsFaced++
    runs += b.runsOffBat
    if (runs >= milestone) return ballsFaced
  }
  return null
}
