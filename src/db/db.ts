import Dexie, { type EntityTable } from 'dexie'
import type { Ball, Fixture, Innings, Match, Player, Team, TeamPlayer } from '../types'

export interface ImageBlob {
  id: string
  blob: Blob
}

export class CricStatsDB extends Dexie {
  players!: EntityTable<Player, 'id'>
  teams!: EntityTable<Team, 'id'>
  teamPlayers!: EntityTable<TeamPlayer, 'id'>
  fixtures!: EntityTable<Fixture, 'id'>
  matches!: EntityTable<Match, 'id'>
  innings!: EntityTable<Innings, 'id'>
  balls!: EntityTable<Ball, 'id'>
  images!: EntityTable<ImageBlob, 'id'>

  constructor() {
    super('cric-stats-db')
    this.version(1).stores({
      players: 'id, currentName, createdAt',
      teams: 'id, name, createdAt',
      teamPlayers: 'id, teamId, playerId, status, [teamId+status]',
      fixtures: 'id, teamAId, teamBId, status, scheduledAt',
      matches: 'id, fixtureId, status',
      innings: 'id, matchId, order',
      balls: 'id, inningsId, [inningsId+overNumber], strikerId, bowlerId, timestamp',
      images: 'id',
    })
  }
}

export const db = new CricStatsDB()
