import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { createTeam, updateTeam } from '../../data/teams'
import { Button } from '../../components/Button'
import { IconPicker } from '../../components/IconPicker'
import { PageHeader } from '../../components/PageHeader'
import { TEAM_LOGOS } from '../../components/presetIcons'

export function TeamFormPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const isEdit = !!teamId
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [logoPreset, setLogoPreset] = useState<string | undefined>()
  const [loaded, setLoaded] = useState(!isEdit)

  useEffect(() => {
    if (!teamId) return
    db.teams.get(teamId).then((team) => {
      if (team) {
        setName(team.name)
        setDetails(team.details ?? '')
        setLogoPreset(team.logoPreset)
      }
      setLoaded(true)
    })
  }, [teamId])

  async function handleSubmit() {
    if (!name.trim()) return
    if (isEdit && teamId) {
      await updateTeam(teamId, { name: name.trim(), details: details || undefined, logoPreset })
      navigate(`/teams/${teamId}`)
    } else {
      const team = await createTeam(name, details || undefined, logoPreset)
      navigate(`/teams/${team.id}`)
    }
  }

  if (!loaded) return null

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <PageHeader title={isEdit ? 'Edit team' : 'New team'} />
      <IconPicker
        value={logoPreset}
        onChange={setLogoPreset}
        options={TEAM_LOGOS}
        title="Choose a team logo"
        triggerLabel={logoPreset ? 'Change logo' : 'Choose logo'}
      />
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Team name"
        className="w-full rounded-xl border border-line px-3 py-2.5"
      />
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Details (optional)"
        className="w-full rounded-xl border border-line px-3 py-2.5"
        rows={3}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </div>
  )
}
