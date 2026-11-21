import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { createTeam, updateTeam } from '../../data/teams'
import { Button } from '../../components/Button'
import { ImageUpload } from '../../components/ImageUpload'
import { PageHeader } from '../../components/PageHeader'

export function TeamFormPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const isEdit = !!teamId
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [logoBlobId, setLogoBlobId] = useState<string | undefined>()
  const [loaded, setLoaded] = useState(!isEdit)

  useEffect(() => {
    if (!teamId) return
    db.teams.get(teamId).then((team) => {
      if (team) {
        setName(team.name)
        setDetails(team.details ?? '')
        setLogoBlobId(team.logoBlobId)
      }
      setLoaded(true)
    })
  }, [teamId])

  async function handleSubmit() {
    if (!name.trim()) return
    if (isEdit && teamId) {
      await updateTeam(teamId, { name: name.trim(), details: details || undefined, logoBlobId })
      navigate(`/teams/${teamId}`)
    } else {
      const team = await createTeam(name, details || undefined, logoBlobId)
      navigate(`/teams/${team.id}`)
    }
  }

  if (!loaded) return null

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <PageHeader title={isEdit ? 'Edit team' : 'New team'} />
      <ImageUpload blobId={logoBlobId} name={name || 'Team'} onChange={setLogoBlobId} />
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
