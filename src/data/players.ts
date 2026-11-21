import { db } from '../db/db'
import { newId } from '../lib/id'
import type { Player, TeamPlayer, TeamPlayerStatus } from '../types'

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Search all players whose current name or any past name matches (case-insensitive). */
export async function searchPlayersByName(query: string): Promise<Player[]> {
  const q = normalizeName(query)
  if (!q) return []
  const all = await db.players.toArray()
  return all.filter((p) => {
    if (normalizeName(p.currentName).includes(q)) return true
    return p.nameHistory.some((h) => normalizeName(h.name).includes(q))
  })
}

export async function exactNameMatches(name: string): Promise<Player[]> {
  const q = normalizeName(name)
  const all = await db.players.toArray()
  return all.filter(
    (p) => normalizeName(p.currentName) === q || p.nameHistory.some((h) => normalizeName(h.name) === q),
  )
}

export interface PlayerMembership extends TeamPlayer {
  teamName: string
}

export async function getMembershipsForPlayer(playerId: string): Promise<PlayerMembership[]> {
  const rows = await db.teamPlayers.where('playerId').equals(playerId).toArray()
  const teams = await db.teams.bulkGet(rows.map((r) => r.teamId))
  return rows.map((r, i) => ({ ...r, teamName: teams[i]?.name ?? 'Unknown team' }))
}

export async function getActiveMembership(playerId: string, teamId: string): Promise<TeamPlayer | undefined> {
  const rows = await db.teamPlayers
    .where('[teamId+status]')
    .equals([teamId, 'active'])
    .toArray()
  return rows.find((r) => r.playerId === playerId)
}

export interface RosterEntry {
  teamPlayer: TeamPlayer
  player: Player
}

export async function getRoster(teamId: string, status: TeamPlayerStatus = 'active'): Promise<RosterEntry[]> {
  const rows = await db.teamPlayers.where('[teamId+status]').equals([teamId, status]).toArray()
  const players = await db.players.bulkGet(rows.map((r) => r.playerId))
  return rows
    .map((teamPlayer, i) => ({ teamPlayer, player: players[i]! }))
    .filter((e) => !!e.player)
    .sort((a, b) => a.player.currentName.localeCompare(b.player.currentName))
}

export interface NewPlayerInput {
  details?: string
  battingStyle?: string
  bowlingStyle?: string
  imageBlobId?: string
}

export async function createNewPlayerOnTeam(
  teamId: string,
  name: string,
  input: NewPlayerInput = {},
): Promise<Player> {
  const now = Date.now()
  const player: Player = {
    id: newId(),
    currentName: name.trim(),
    nameHistory: [{ name: name.trim(), changedAt: now }],
    createdAt: now,
    ...input,
  }
  const teamPlayer: TeamPlayer = {
    id: newId(),
    teamId,
    playerId: player.id,
    joinedAt: now,
    status: 'active',
  }
  await db.transaction('rw', db.players, db.teamPlayers, async () => {
    await db.players.add(player)
    await db.teamPlayers.add(teamPlayer)
  })
  return player
}

/** Re-activate an existing player (previously removed, or migrating from another team) onto teamId. */
export async function addExistingPlayerToTeam(playerId: string, teamId: string): Promise<TeamPlayer> {
  const now = Date.now()
  const teamPlayer: TeamPlayer = {
    id: newId(),
    teamId,
    playerId,
    joinedAt: now,
    status: 'active',
  }
  await db.teamPlayers.add(teamPlayer)
  return teamPlayer
}

export async function migratePlayer(playerId: string, fromMembership: TeamPlayer, toTeamId: string): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.teamPlayers, async () => {
    await db.teamPlayers.update(fromMembership.id, { status: 'migrated', leftAt: now })
    await db.teamPlayers.add({
      id: newId(),
      teamId: toTeamId,
      playerId,
      joinedAt: now,
      status: 'active',
    })
  })
}

export async function removePlayerFromTeam(teamPlayerId: string): Promise<void> {
  await db.teamPlayers.update(teamPlayerId, { status: 'removed', leftAt: Date.now() })
}

export async function renamePlayer(playerId: string, newName: string): Promise<void> {
  const player = await db.players.get(playerId)
  if (!player) return
  const trimmed = newName.trim()
  if (trimmed === player.currentName) return
  await db.players.update(playerId, {
    currentName: trimmed,
    nameHistory: [...player.nameHistory, { name: trimmed, changedAt: Date.now() }],
  })
}

export type PlayerTeamClassification =
  | { kind: 'active-here' }
  | { kind: 'active-elsewhere'; membership: TeamPlayer; teamName: string }
  | { kind: 'inactive' }

export async function classifyPlayerForTeam(playerId: string, currentTeamId: string): Promise<PlayerTeamClassification> {
  const memberships = await getMembershipsForPlayer(playerId)
  const activeHere = memberships.find((m) => m.teamId === currentTeamId && m.status === 'active')
  if (activeHere) return { kind: 'active-here' }
  const activeElsewhere = memberships.find((m) => m.teamId !== currentTeamId && m.status === 'active')
  if (activeElsewhere) return { kind: 'active-elsewhere', membership: activeElsewhere, teamName: activeElsewhere.teamName }
  return { kind: 'inactive' }
}

export async function updatePlayerDetails(
  playerId: string,
  updates: Partial<Pick<Player, 'details' | 'battingStyle' | 'bowlingStyle' | 'imageBlobId'>>,
): Promise<void> {
  await db.players.update(playerId, updates)
}
