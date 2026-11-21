import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { createFixture, updateFixture } from '../../data/fixtures'
import { Button } from '../../components/Button'
import { DateTimePicker } from '../../components/DateTimePicker'
import { PageHeader } from '../../components/PageHeader'
import { Select } from '../../components/Select'

export function FixtureFormPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>()
  const navigate = useNavigate()
  const isEdit = !!fixtureId
  const teams = useLiveQuery(() => db.teams.orderBy('name').toArray(), [])

  const [teamAId, setTeamAId] = useState('')
  const [teamBId, setTeamBId] = useState('')
  const [scheduledAt, setScheduledAt] = useState(Date.now())
  const [venue, setVenue] = useState('')
  const [oversLimit, setOversLimit] = useState(20)
  const [loaded, setLoaded] = useState(!isEdit)

  useEffect(() => {
    if (!fixtureId) return
    db.fixtures.get(fixtureId).then((f) => {
      if (f) {
        setTeamAId(f.teamAId)
        setTeamBId(f.teamBId)
        setScheduledAt(f.scheduledAt)
        setVenue(f.venue ?? '')
        setOversLimit(f.oversLimit)
      }
      setLoaded(true)
    })
  }, [fixtureId])

  async function handleSubmit() {
    if (!teamAId || !teamBId || teamAId === teamBId) return
    const input = {
      teamAId,
      teamBId,
      scheduledAt,
      venue: venue || undefined,
      oversLimit,
    }
    if (isEdit && fixtureId) {
      await updateFixture(fixtureId, input)
    } else {
      await createFixture(input)
    }
    navigate('/fixtures')
  }

  if (!loaded || !teams) return null

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <PageHeader title={isEdit ? 'Edit fixture' : 'New fixture'} back="/fixtures" />

      <div className="grid grid-cols-2 gap-2">
        <Select
          value={teamAId}
          onChange={setTeamAId}
          placeholder="Team A"
          title="Pick Team A"
          options={teams.map((t) => ({ value: t.id, label: t.name }))}
        />
        <Select
          value={teamBId}
          onChange={setTeamBId}
          placeholder="Team B"
          title="Pick Team B"
          options={teams.map((t) => ({ value: t.id, label: t.name }))}
        />
      </div>
      {teamAId && teamBId && teamAId === teamBId && (
        <p className="text-red-400 text-sm">Pick two different teams.</p>
      )}

      <DateTimePicker value={scheduledAt} onChange={setScheduledAt} label="Date & time" />

      <input
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        placeholder="Venue (optional)"
        className="w-full rounded-xl border border-line px-3 py-2.5"
      />
      <div>
        <label className="text-sm text-slate-400 block mb-1">Overs per innings</label>
        <input
          type="number"
          min={1}
          max={50}
          value={oversLimit}
          onChange={(e) => setOversLimit(Number(e.target.value))}
          className="w-full rounded-xl border border-line px-3 py-2.5"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!teamAId || !teamBId || teamAId === teamBId}>
          Save
        </Button>
      </div>
    </div>
  )
}
