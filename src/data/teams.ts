import { db } from '../db/db'
import { deleteImage } from '../lib/image'
import { newId } from '../lib/id'
import type { Team } from '../types'

export async function createTeam(name: string, details?: string, logoPreset?: string): Promise<Team> {
  const team: Team = { id: newId(), name: name.trim(), details, logoPreset, createdAt: Date.now() }
  await db.teams.add(team)
  return team
}

export async function updateTeam(
  id: string,
  updates: Partial<Pick<Team, 'name' | 'details' | 'logoPreset'>>,
): Promise<void> {
  await db.teams.update(id, updates)
}

export async function deleteTeam(id: string): Promise<void> {
  const team = await db.teams.get(id)
  await db.transaction('rw', db.teams, db.teamPlayers, db.fixtures, async () => {
    await db.teamPlayers.where('teamId').equals(id).delete()
    await db.fixtures.where('teamAId').equals(id).delete()
    await db.fixtures.where('teamBId').equals(id).delete()
    await db.teams.delete(id)
  })
  if (team?.logoBlobId) await deleteImage(team.logoBlobId)
}
