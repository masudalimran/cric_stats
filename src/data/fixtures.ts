import { db } from '../db/db'
import { newId } from '../lib/id'
import type { Fixture } from '../types'

export interface NewFixtureInput {
  teamAId: string
  teamBId: string
  scheduledAt: number
  venue?: string
  oversLimit: number
}

export async function createFixture(input: NewFixtureInput): Promise<Fixture> {
  const fixture: Fixture = { id: newId(), status: 'scheduled', createdAt: Date.now(), ...input }
  await db.fixtures.add(fixture)
  return fixture
}

export async function updateFixture(id: string, updates: Partial<NewFixtureInput>): Promise<void> {
  await db.fixtures.update(id, updates)
}

export async function deleteFixture(id: string): Promise<void> {
  const fixture = await db.fixtures.get(id)
  await db.transaction('rw', db.fixtures, db.matches, db.innings, db.balls, async () => {
    if (fixture?.matchId) {
      const innings = await db.innings.where('matchId').equals(fixture.matchId).toArray()
      for (const inn of innings) {
        await db.balls.where('inningsId').equals(inn.id).delete()
      }
      await db.innings.where('matchId').equals(fixture.matchId).delete()
      await db.matches.delete(fixture.matchId)
    }
    await db.fixtures.delete(id)
  })
}

export async function cancelFixture(id: string): Promise<void> {
  await db.fixtures.update(id, { status: 'cancelled' })
}
