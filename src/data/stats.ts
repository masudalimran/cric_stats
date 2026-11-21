import { db } from '../db/db'
import {
  computeBallsToMilestone,
  computeBattingMatchups,
  computeBattingStats,
  computeBowlingMatchups,
  computeBowlingStats,
  computeDismissalBreakdown,
  computeFieldingStats,
  type BattingStats,
  type BowlingStats,
  type DismissalCount,
  type FieldingStats,
  type MatchupRow,
} from '../stats/aggregate'
import { ballRuns, deriveInningsState, formatOvers, isLegalDelivery } from '../lib/cricket'
import { shortDisplayName } from '../lib/name'
import type { Ball, Fixture, MatchStatus } from '../types'

export async function matchIdByInningsMap(): Promise<Map<string, string>> {
  const innings = await db.innings.toArray()
  return new Map(innings.map((i) => [i.id, i.matchId]))
}

async function allBalls(): Promise<Ball[]> {
  return db.balls.toArray()
}

/** All balls relevant to a player's career: they faced, bowled, fielded, or were dismissed in. */
function relevantToPlayer(balls: Ball[], playerId: string): Ball[] {
  return balls.filter(
    (b) =>
      b.strikerId === playerId ||
      b.nonStrikerId === playerId ||
      b.bowlerId === playerId ||
      b.dismissedPlayerId === playerId ||
      b.fielderId === playerId,
  )
}

export interface PlayerCareerStats {
  batting: BattingStats
  bowling: BowlingStats
  fielding: FieldingStats
  matches: number
}

export async function getPlayerCareerStats(playerId: string): Promise<PlayerCareerStats> {
  const balls = relevantToPlayer(await allBalls(), playerId)
  const matchMap = await matchIdByInningsMap()
  const matchIds = new Set(balls.map((b) => matchMap.get(b.inningsId)).filter(Boolean))
  return {
    batting: computeBattingStats(balls, playerId),
    bowling: computeBowlingStats(balls, playerId, matchMap),
    fielding: computeFieldingStats(balls, playerId),
    matches: matchIds.size,
  }
}

/** Stats for a player restricted to innings where they were batting/bowling for a specific team. */
export async function getPlayerStatsForTeam(playerId: string, teamId: string): Promise<PlayerCareerStats> {
  const innings = await db.innings.toArray()
  const relevantInningsIds = new Set(
    innings.filter((i) => i.battingTeamId === teamId || i.bowlingTeamId === teamId).map((i) => i.id),
  )
  const balls = relevantToPlayer(await allBalls(), playerId).filter((b) => relevantInningsIds.has(b.inningsId))
  const matchMap = await matchIdByInningsMap()
  const matchIds = new Set(balls.map((b) => matchMap.get(b.inningsId)).filter(Boolean))
  return {
    batting: computeBattingStats(balls, playerId),
    bowling: computeBowlingStats(balls, playerId, matchMap),
    fielding: computeFieldingStats(balls, playerId),
    matches: matchIds.size,
  }
}

export interface LeaderboardRow {
  playerId: string
  playerName: string
  teamNames: string[]
  batting: BattingStats
  bowling: BowlingStats
  fielding: FieldingStats
}

/** Builds per-player stat rows for every player who has ever appeared in a ball of the given scope. */
export async function getLeaderboard(teamId?: string): Promise<LeaderboardRow[]> {
  const innings = await db.innings.toArray()
  const relevantInningsIds = teamId
    ? new Set(innings.filter((i) => i.battingTeamId === teamId || i.bowlingTeamId === teamId).map((i) => i.id))
    : null
  const balls = (await allBalls()).filter((b) => !relevantInningsIds || relevantInningsIds.has(b.inningsId))
  const matchMap = await matchIdByInningsMap()

  const playerIds = new Set<string>()
  for (const b of balls) {
    playerIds.add(b.strikerId)
    playerIds.add(b.bowlerId)
    if (b.fielderId) playerIds.add(b.fielderId)
  }

  const idList = [...playerIds]
  const players = await db.players.bulkGet(idList)
  const allTeamPlayers = await db.teamPlayers.where('status').equals('active').toArray()
  const allTeams = await db.teams.toArray()
  const teamNameById = new Map(allTeams.map((t) => [t.id, t.name]))

  const rows: LeaderboardRow[] = []
  players.forEach((player, i) => {
    if (!player) return
    const playerId = idList[i]
    const playerBalls = relevantToPlayer(balls, playerId)
    const teamNames = allTeamPlayers
      .filter((tp) => tp.playerId === playerId)
      .map((tp) => teamNameById.get(tp.teamId))
      .filter((n): n is string => !!n)
    rows.push({
      playerId,
      playerName: player.currentName,
      teamNames,
      batting: computeBattingStats(playerBalls, playerId),
      bowling: computeBowlingStats(playerBalls, playerId, matchMap),
      fielding: computeFieldingStats(playerBalls, playerId),
    })
  })
  return rows
}

export async function getDismissalBreakdown(playerId: string): Promise<DismissalCount[]> {
  const balls = relevantToPlayer(await allBalls(), playerId)
  return computeDismissalBreakdown(balls, playerId)
}

export interface NamedMatchupRow extends MatchupRow {
  opponentName: string
}

export async function getBattingMatchups(playerId: string): Promise<NamedMatchupRow[]> {
  const balls = relevantToPlayer(await allBalls(), playerId)
  const rows = computeBattingMatchups(balls, playerId)
  const players = await db.players.bulkGet(rows.map((r) => r.opponentId))
  return rows.map((r, i) => ({ ...r, opponentName: players[i]?.currentName ?? '?' }))
}

export async function getBowlingMatchups(playerId: string): Promise<NamedMatchupRow[]> {
  const balls = relevantToPlayer(await allBalls(), playerId)
  const rows = computeBowlingMatchups(balls, playerId)
  const players = await db.players.bulkGet(rows.map((r) => r.opponentId))
  return rows.map((r, i) => ({ ...r, opponentName: players[i]?.currentName ?? '?' }))
}

export interface TeamRecord {
  played: number
  won: number
  lost: number
  tied: number
}

export interface TopPerformer {
  playerId: string
  name: string
  line: string
}

export interface InningsSummary {
  teamName: string
  runs: number
  wickets: number
  overs: string
  isComplete: boolean
  topBatsmen: TopPerformer[]
  topBowlers: TopPerformer[]
}

export interface LiveState {
  strikerName: string
  nonStrikerName: string
  bowlerName: string
  last6: string[]
}

export interface MatchSummary {
  matchId: string
  fixtureId: string
  status: MatchStatus
  scheduledAt: number
  venue?: string
  teamAName: string
  teamBName: string
  resultText?: string
  innings: InningsSummary[]
  live?: LiveState
}

function last6BallStrings(balls: Ball[]): string[] {
  return [...balls]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-6)
    .map((b) => {
      if (b.isWicket) return 'W'
      if (b.extraType === 'wide') return `${b.extraRuns}wd`
      if (b.extraType === 'noball') return `${b.runsOffBat}nb`
      if (b.extraType === 'bye') return `${b.extraRuns}b`
      if (b.extraType === 'legbye') return `${b.extraRuns}lb`
      return String(b.runsOffBat)
    })
}

/** TV-style summary cards for every match that has started (live or completed), newest first. */
export async function getMatchSummaries(): Promise<MatchSummary[]> {
  const matches = (await db.matches.toArray()).filter((m) => m.status === 'live' || m.status === 'completed')
  if (matches.length === 0) return []

  const fixtures = await db.fixtures.bulkGet(matches.map((m) => m.fixtureId))
  const fixtureByMatchId = new Map<string, Fixture>()
  matches.forEach((m, i) => {
    const f = fixtures[i]
    if (f) fixtureByMatchId.set(m.id, f)
  })

  const allInnings = await db.innings.toArray()
  const teamIds = [...new Set(allInnings.flatMap((i) => [i.battingTeamId, i.bowlingTeamId]))]
  const teams = await db.teams.bulkGet(teamIds)
  const teamNameById = new Map(teams.filter(Boolean).map((t) => [t!.id, t!.name]))

  const summaries: MatchSummary[] = []
  for (const match of matches) {
    const fixture = fixtureByMatchId.get(match.id)
    if (!fixture) continue
    const matchInnings = allInnings.filter((i) => i.matchId === match.id).sort((a, b) => a.order - b.order)
    const matchBalls = await db.balls
      .where('inningsId')
      .anyOf(matchInnings.map((i) => i.id))
      .toArray()

    const matchIdMap = new Map(matchInnings.map((i) => [i.id, match.id]))
    const openerIds = matchInnings.flatMap((i) => [i.openingStrikerId, i.openingNonStrikerId].filter(Boolean) as string[])
    const allPlayerIds = [
      ...new Set([...matchBalls.flatMap((b) => [b.strikerId, b.bowlerId]), ...openerIds]),
    ]
    const players = await db.players.bulkGet(allPlayerIds)
    const nameById = new Map(players.filter(Boolean).map((p) => [p!.id, p!.currentName]))

    const innings: InningsSummary[] = matchInnings.map((inn) => {
      const balls = matchBalls.filter((b) => b.inningsId === inn.id)
      const runs = balls.reduce((s, b) => s + ballRuns(b), 0)
      const wickets = balls.filter((b) => b.isWicket).length
      const legalCount = balls.filter(isLegalDelivery).length

      const batterIds = [...new Set(balls.map((b) => b.strikerId))]
      const bowlerIds = [...new Set(balls.map((b) => b.bowlerId))]

      const topBatsmen = batterIds
        .map((pid) => ({ pid, bs: computeBattingStats(balls, pid) }))
        .filter((r) => r.bs.runs > 0 || r.bs.balls > 0)
        .sort((a, b) => b.bs.runs - a.bs.runs)
        .slice(0, 2)
        .map((r) => ({
          playerId: r.pid,
          name: shortDisplayName(nameById.get(r.pid) ?? '?'),
          line: `${r.bs.runs}${r.bs.notOuts > 0 && r.bs.outs === 0 ? '*' : ''} (${r.bs.balls})`,
        }))

      const topBowlers = bowlerIds
        .map((pid) => ({ pid, bw: computeBowlingStats(balls, pid, matchIdMap) }))
        .filter((r) => r.bw.legalBalls > 0)
        .sort((a, b) => b.bw.wickets - a.bw.wickets || a.bw.runsConceded - b.bw.runsConceded)
        .slice(0, 2)
        .map((r) => ({
          playerId: r.pid,
          name: shortDisplayName(nameById.get(r.pid) ?? '?'),
          line: `${r.bw.wickets}/${r.bw.runsConceded} (${formatOvers(r.bw.legalBalls)})`,
        }))

      return {
        teamName: teamNameById.get(inn.battingTeamId) ?? '?',
        runs,
        wickets,
        overs: formatOvers(legalCount),
        isComplete: inn.isComplete,
        topBatsmen,
        topBowlers,
      }
    })

    const resultText = match.result
      ? match.result.isTie
        ? 'Match tied'
        : `${teamNameById.get(match.result.winnerTeamId ?? '') ?? ''} won ${match.result.margin ?? ''}`
      : undefined

    let live: LiveState | undefined
    if (match.status === 'live') {
      const currentInnings = matchInnings.find((i) => i.order === match.currentInningsIndex)
      if (currentInnings) {
        const currentBalls = matchBalls.filter((b) => b.inningsId === currentInnings.id)
        const derived = deriveInningsState(currentBalls, currentInnings.openingStrikerId, currentInnings.openingNonStrikerId)
        live = {
          strikerName: shortDisplayName(nameById.get(derived.strikerId ?? '') ?? '—'),
          nonStrikerName: shortDisplayName(nameById.get(derived.nonStrikerId ?? '') ?? '—'),
          bowlerName: shortDisplayName(nameById.get(derived.currentBowlerId ?? '') ?? '—'),
          last6: last6BallStrings(currentBalls),
        }
      }
    }

    summaries.push({
      matchId: match.id,
      fixtureId: fixture.id,
      status: match.status,
      scheduledAt: fixture.scheduledAt,
      venue: fixture.venue,
      teamAName: teamNameById.get(fixture.teamAId) ?? '?',
      teamBName: teamNameById.get(fixture.teamBId) ?? '?',
      resultText,
      innings,
      live,
    })
  }

  return summaries.sort((a, b) => b.scheduledAt - a.scheduledAt)
}

export interface RecordEntry {
  title: string
  value: string
  subtitle: string
}

/** "Best of" records across every completed innings ever recorded — the stuff a TV broadcast would call out. */
export async function getRecords(): Promise<RecordEntry[]> {
  const innings = (await db.innings.toArray()).filter((i) => i.isComplete)
  if (innings.length === 0) return []

  const matches = await db.matches.bulkGet([...new Set(innings.map((i) => i.matchId))])
  const matchById = new Map(matches.filter(Boolean).map((m) => [m!.id, m!]))
  const teams = await db.teams.toArray()
  const teamNameById = new Map(teams.map((t) => [t.id, t.name]))

  const inningsWithBalls = await Promise.all(
    innings.map(async (inn) => ({ inn, balls: await db.balls.where('inningsId').equals(inn.id).toArray() })),
  )

  let highestTotal: { runs: number; wickets: number; team: string; vs: string } | null = null
  let lowestTotal: { runs: number; wickets: number; team: string; vs: string } | null = null
  let highestChase: { runs: number; team: string; vs: string } | null = null
  let highestScore: { runs: number; balls: number; notOut: boolean; playerId: string } | null = null
  let mostSixes: { sixes: number; runs: number; playerId: string } | null = null
  let fastestFifty: { balls: number; runs: number; playerId: string } | null = null
  let bestBowling: { wickets: number; runs: number; playerId: string } | null = null

  for (const { inn, balls } of inningsWithBalls) {
    if (balls.length === 0) continue
    const totalRuns = balls.reduce((s, b) => s + ballRuns(b), 0)
    const wickets = balls.filter((b) => b.isWicket).length
    const team = teamNameById.get(inn.battingTeamId) ?? '?'
    const vs = teamNameById.get(inn.bowlingTeamId) ?? '?'
    const match = matchById.get(inn.matchId)

    if (!highestTotal || totalRuns > highestTotal.runs) highestTotal = { runs: totalRuns, wickets, team, vs }
    if (!lowestTotal || totalRuns < lowestTotal.runs) lowestTotal = { runs: totalRuns, wickets, team, vs }
    if (inn.order > 0 && match?.result?.winnerTeamId === inn.battingTeamId) {
      if (!highestChase || totalRuns > highestChase.runs) highestChase = { runs: totalRuns, team, vs }
    }

    const batterIds = [...new Set(balls.map((b) => b.strikerId))]
    for (const pid of batterIds) {
      const bs = computeBattingStats(balls, pid)
      if (bs.balls === 0) continue
      const notOut = bs.outs === 0
      if (!highestScore || bs.runs > highestScore.runs) {
        highestScore = { runs: bs.runs, balls: bs.balls, notOut, playerId: pid }
      }
      if (bs.sixes > 0 && (!mostSixes || bs.sixes > mostSixes.sixes)) {
        mostSixes = { sixes: bs.sixes, runs: bs.runs, playerId: pid }
      }
      if (bs.runs >= 50) {
        const ballsToFifty = computeBallsToMilestone(balls, pid, 50)
        if (ballsToFifty !== null && ballsToFifty > 0 && (!fastestFifty || ballsToFifty < fastestFifty.balls)) {
          fastestFifty = { balls: ballsToFifty, runs: bs.runs, playerId: pid }
        }
      }
    }

    const bowlerIds = [...new Set(balls.map((b) => b.bowlerId))]
    const matchIdMap = new Map([[inn.id, inn.matchId]])
    for (const pid of bowlerIds) {
      const bw = computeBowlingStats(balls, pid, matchIdMap)
      if (bw.wickets === 0) continue
      if (!bestBowling || bw.wickets > bestBowling.wickets || (bw.wickets === bestBowling.wickets && bw.runsConceded < bestBowling.runs)) {
        bestBowling = { wickets: bw.wickets, runs: bw.runsConceded, playerId: pid }
      }
    }
  }

  let biggestRunWin: { margin: number; winner: string; loser: string } | null = null
  let biggestWicketWin: { margin: number; winner: string; loser: string } | null = null
  for (const match of matches) {
    if (!match?.result || match.result.isTie || !match.result.winnerTeamId) continue
    const fixture = await db.fixtures.get(match.fixtureId)
    if (!fixture) continue
    const loserTeamId = match.result.winnerTeamId === fixture.teamAId ? fixture.teamBId : fixture.teamAId
    const winner = teamNameById.get(match.result.winnerTeamId) ?? '?'
    const loser = teamNameById.get(loserTeamId) ?? '?'
    const runsMatch = /by (\d+) runs?/.exec(match.result.margin ?? '')
    const wicketsMatch = /by (\d+) wickets?/.exec(match.result.margin ?? '')
    if (runsMatch) {
      const margin = Number(runsMatch[1])
      if (!biggestRunWin || margin > biggestRunWin.margin) biggestRunWin = { margin, winner, loser }
    }
    if (wicketsMatch) {
      const margin = Number(wicketsMatch[1])
      if (!biggestWicketWin || margin > biggestWicketWin.margin) biggestWicketWin = { margin, winner, loser }
    }
  }

  const playerIds = [
    highestScore?.playerId,
    mostSixes?.playerId,
    fastestFifty?.playerId,
    bestBowling?.playerId,
  ].filter((id): id is string => !!id)
  const players = await db.players.bulkGet([...new Set(playerIds)])
  const nameById = new Map(players.filter(Boolean).map((p) => [p!.id, p!.currentName]))

  const records: RecordEntry[] = []
  if (highestTotal) {
    records.push({
      title: 'Highest team total',
      value: `${highestTotal.runs}/${highestTotal.wickets}`,
      subtitle: `${highestTotal.team} vs ${highestTotal.vs}`,
    })
  }
  if (lowestTotal) {
    records.push({
      title: 'Lowest team total',
      value: `${lowestTotal.runs}/${lowestTotal.wickets}`,
      subtitle: `${lowestTotal.team} vs ${lowestTotal.vs}`,
    })
  }
  if (highestChase) {
    records.push({
      title: 'Highest successful chase',
      value: `${highestChase.runs}`,
      subtitle: `${highestChase.team} vs ${highestChase.vs}`,
    })
  }
  if (highestScore) {
    records.push({
      title: 'Highest individual score',
      value: `${highestScore.runs}${highestScore.notOut ? '*' : ''} (${highestScore.balls})`,
      subtitle: nameById.get(highestScore.playerId) ?? '?',
    })
  }
  if (fastestFifty) {
    records.push({
      title: 'Fastest fifty',
      value: `${fastestFifty.balls} balls`,
      subtitle: `${nameById.get(fastestFifty.playerId) ?? '?'} · ${fastestFifty.runs} runs`,
    })
  }
  if (mostSixes) {
    records.push({
      title: 'Most sixes in an innings',
      value: `${mostSixes.sixes}`,
      subtitle: `${nameById.get(mostSixes.playerId) ?? '?'} · ${mostSixes.runs} runs`,
    })
  }
  if (bestBowling) {
    records.push({
      title: 'Best bowling figures',
      value: `${bestBowling.wickets}/${bestBowling.runs}`,
      subtitle: nameById.get(bestBowling.playerId) ?? '?',
    })
  }
  if (biggestRunWin) {
    records.push({
      title: 'Biggest win (runs)',
      value: `${biggestRunWin.margin} runs`,
      subtitle: `${biggestRunWin.winner} beat ${biggestRunWin.loser}`,
    })
  }
  if (biggestWicketWin) {
    records.push({
      title: 'Biggest win (wickets)',
      value: `${biggestWicketWin.margin} wickets`,
      subtitle: `${biggestWicketWin.winner} beat ${biggestWicketWin.loser}`,
    })
  }

  return records
}

export async function getTeamRecord(teamId: string): Promise<TeamRecord> {
  const [innings, matches] = await Promise.all([db.innings.toArray(), db.matches.where('status').equals('completed').toArray()])
  const matchIdsForTeam = new Set(
    innings.filter((i) => i.battingTeamId === teamId || i.bowlingTeamId === teamId).map((i) => i.matchId),
  )
  const record: TeamRecord = { played: 0, won: 0, lost: 0, tied: 0 }
  for (const m of matches) {
    if (!matchIdsForTeam.has(m.id)) continue
    record.played++
    if (m.result?.isTie) record.tied++
    else if (m.result?.winnerTeamId === teamId) record.won++
    else if (m.result?.winnerTeamId) record.lost++
  }
  return record
}
