export interface NameChange {
  name: string
  changedAt: number
}

export interface Player {
  id: string
  currentName: string
  nameHistory: NameChange[]
  details?: string
  battingStyle?: string
  bowlingStyle?: string
  avatarPreset?: string
  /** @deprecated legacy uploaded photo, from before uploads were replaced with preset avatars */
  imageBlobId?: string
  createdAt: number
}

export type TeamPlayerStatus = 'active' | 'removed' | 'migrated'

export interface TeamPlayer {
  id: string
  teamId: string
  playerId: string
  joinedAt: number
  leftAt?: number
  status: TeamPlayerStatus
}

export interface Team {
  id: string
  name: string
  details?: string
  logoPreset?: string
  /** @deprecated legacy uploaded logo, from before uploads were replaced with preset logos */
  logoBlobId?: string
  createdAt: number
}

export type FixtureStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'

export interface Fixture {
  id: string
  teamAId: string
  teamBId: string
  scheduledAt: number
  venue?: string
  oversLimit: number
  status: FixtureStatus
  matchId?: string
  createdAt: number
}

export type MatchStatus = 'setup' | 'live' | 'completed'

export interface MatchResult {
  winnerTeamId?: string
  isTie?: boolean
  margin?: string
}

export interface Match {
  id: string
  fixtureId: string
  oversLimit: number
  tossWinnerTeamId?: string
  decision?: 'bat' | 'bowl'
  playingXI: Record<string, string[]> // teamId -> playerIds
  status: MatchStatus
  currentInningsIndex: number
  result?: MatchResult
  createdAt: number
}

export interface Innings {
  id: string
  matchId: string
  order: number
  battingTeamId: string
  bowlingTeamId: string
  oversLimit: number
  openingStrikerId?: string
  openingNonStrikerId?: string
  battingOrder: string[] // playerIds in order they came to bat
  isComplete: boolean
}

export type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty' | null

export type WicketType =
  | 'bowled'
  | 'caught'
  | 'runout'
  | 'stumped'
  | 'lbw'
  | 'hitwicket'
  | 'retired'
  | 'obstructing'
  | null

export interface Ball {
  id: string
  inningsId: string
  overNumber: number // 0-indexed
  ballInOver: number // 1-indexed legal-ball slot at time of recording (wides/noballs don't advance it)
  strikerId: string
  nonStrikerId: string
  bowlerId: string
  runsOffBat: number
  extraType: ExtraType
  extraRuns: number
  isWicket: boolean
  wicketType: WicketType
  dismissedPlayerId?: string
  fielderId?: string
  replacementBatterId?: string
  timestamp: number
}

export interface AppSettings {
  id: string
  value: unknown
}
