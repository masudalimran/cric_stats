export type PlayerRole = 'Batsman' | 'Bowler' | 'All-rounder' | null

export function computeRole(battingStyle?: string, bowlingStyle?: string): PlayerRole {
  const bats = !!battingStyle?.trim()
  const bowls = !!bowlingStyle?.trim()
  if (bats && bowls) return 'All-rounder'
  if (bowls) return 'Bowler'
  if (bats) return 'Batsman'
  return null
}
