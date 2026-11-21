import { db } from '../db/db'
import { newId } from '../lib/id'
import { deriveInningsState, isLegalDelivery } from '../lib/cricket'
import type { Ball, ExtraType, Fixture, Innings, Match, WicketType } from '../types'

export interface StartMatchInput {
  fixture: Fixture
  tossWinnerTeamId: string
  decision: 'bat' | 'bowl'
  playingXI: Record<string, string[]>
}

export async function startMatch({ fixture, tossWinnerTeamId, decision, playingXI }: StartMatchInput): Promise<Match> {
  const otherTeamId = tossWinnerTeamId === fixture.teamAId ? fixture.teamBId : fixture.teamAId
  const battingTeamId = decision === 'bat' ? tossWinnerTeamId : otherTeamId
  const bowlingTeamId = battingTeamId === fixture.teamAId ? fixture.teamBId : fixture.teamAId

  const match: Match = {
    id: newId(),
    fixtureId: fixture.id,
    oversLimit: fixture.oversLimit,
    tossWinnerTeamId,
    decision,
    playingXI,
    status: 'live',
    currentInningsIndex: 0,
    createdAt: Date.now(),
  }
  const firstInnings: Innings = {
    id: newId(),
    matchId: match.id,
    order: 0,
    battingTeamId,
    bowlingTeamId,
    oversLimit: fixture.oversLimit,
    battingOrder: [],
    isComplete: false,
  }
  await db.transaction('rw', db.matches, db.innings, db.fixtures, async () => {
    await db.matches.add(match)
    await db.innings.add(firstInnings)
    await db.fixtures.update(fixture.id, { status: 'live', matchId: match.id })
  })
  return match
}

export async function setOpeners(inningsId: string, strikerId: string, nonStrikerId: string): Promise<void> {
  await db.innings.update(inningsId, {
    openingStrikerId: strikerId,
    openingNonStrikerId: nonStrikerId,
    battingOrder: [strikerId, nonStrikerId],
  })
}

export interface RecordBallInput {
  bowlerId: string
  runsOffBat: number
  extraType: ExtraType
  extraRuns: number
  isWicket: boolean
  wicketType: WicketType
  dismissedPlayerId?: string
  fielderId?: string
  replacementBatterId?: string
}

export async function getSortedBalls(inningsId: string): Promise<Ball[]> {
  const balls = await db.balls.where('inningsId').equals(inningsId).toArray()
  return balls.sort((a, b) => a.timestamp - b.timestamp)
}

export async function recordBall(innings: Innings, input: RecordBallInput): Promise<void> {
  const existing = await getSortedBalls(innings.id)
  const legalCount = existing.filter(isLegalDelivery).length
  const state = deriveInningsState(existing, innings.openingStrikerId, innings.openingNonStrikerId)

  const ball: Ball = {
    id: newId(),
    inningsId: innings.id,
    overNumber: Math.floor(legalCount / 6),
    ballInOver: (legalCount % 6) + 1,
    strikerId: state.strikerId!,
    nonStrikerId: state.nonStrikerId!,
    bowlerId: input.bowlerId,
    runsOffBat: input.runsOffBat,
    extraType: input.extraType,
    extraRuns: input.extraRuns,
    isWicket: input.isWicket,
    wicketType: input.wicketType,
    dismissedPlayerId: input.dismissedPlayerId,
    fielderId: input.fielderId,
    replacementBatterId: input.replacementBatterId,
    timestamp: Date.now(),
  }
  await db.balls.add(ball)

  if (ball.replacementBatterId && !innings.battingOrder.includes(ball.replacementBatterId)) {
    await db.innings.update(innings.id, { battingOrder: [...innings.battingOrder, ball.replacementBatterId] })
  }
}

export async function undoLastBall(inningsId: string): Promise<void> {
  const balls = await getSortedBalls(inningsId)
  const last = balls[balls.length - 1]
  if (!last) return
  await db.balls.delete(last.id)
}

export async function markInningsComplete(inningsId: string): Promise<void> {
  await db.innings.update(inningsId, { isComplete: true })
}

export async function startNextInnings(match: Match, prevInnings: Innings): Promise<Innings> {
  const nextInnings: Innings = {
    id: newId(),
    matchId: match.id,
    order: prevInnings.order + 1,
    battingTeamId: prevInnings.bowlingTeamId,
    bowlingTeamId: prevInnings.battingTeamId,
    oversLimit: match.oversLimit,
    battingOrder: [],
    isComplete: false,
  }
  await db.transaction('rw', db.innings, db.matches, async () => {
    await db.innings.add(nextInnings)
    await db.matches.update(match.id, { currentInningsIndex: prevInnings.order + 1 })
  })
  return nextInnings
}

export async function completeMatch(
  matchId: string,
  fixtureId: string,
  result: Match['result'],
): Promise<void> {
  await db.transaction('rw', db.matches, db.fixtures, async () => {
    await db.matches.update(matchId, { status: 'completed', result })
    await db.fixtures.update(fixtureId, { status: 'completed' })
  })
}

export function wicketsCap(xiSize: number): number {
  return Math.max(1, xiSize - 1)
}

export async function forfeitMatch(match: Match, fixture: Fixture, forfeitingTeamId: string): Promise<void> {
  const winnerTeamId = forfeitingTeamId === fixture.teamAId ? fixture.teamBId : fixture.teamAId
  await completeMatch(match.id, fixture.id, { winnerTeamId, margin: 'by forfeit' })
}

/** Deletes a match and all its ball-by-ball stats, resetting the fixture back to scheduled so it can be replayed. */
export async function removeMatch(fixture: Fixture): Promise<void> {
  if (!fixture.matchId) return
  const matchId = fixture.matchId
  await db.transaction('rw', db.matches, db.innings, db.balls, db.fixtures, async () => {
    const inningsList = await db.innings.where('matchId').equals(matchId).toArray()
    for (const inn of inningsList) {
      await db.balls.where('inningsId').equals(inn.id).delete()
    }
    await db.innings.where('matchId').equals(matchId).delete()
    await db.matches.delete(matchId)
    await db.fixtures.update(fixture.id, { status: 'scheduled', matchId: undefined })
  })
}
