import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { getRoster, removePlayerFromTeam } from '../../data/players'
import { deleteTeam } from '../../data/teams'
import { getTeamRecord, type TeamRecord } from '../../data/stats'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PlayerAvatar, TeamLogoAvatar } from '../../components/EntityAvatar'
import { EditIcon, PlusIcon, TrashIcon } from '../../components/icons'
import { IconButton } from '../../components/IconButton'
import { PageHeader } from '../../components/PageHeader'
import { PlayerEditModal } from '../../components/PlayerEditModal'
import { PlayerPicker } from '../../components/PlayerPicker'
import { RoleBadge } from '../../components/RoleBadge'
import type { Player } from '../../types'

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const [showPicker, setShowPicker] = useState(false)
  const [editTarget, setEditTarget] = useState<Player | null>(null)
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null)
  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState(false)
  const [record, setRecord] = useState<TeamRecord | null>(null)

  const team = useLiveQuery(() => db.teams.get(teamId!), [teamId])
  const roster = useLiveQuery(() => getRoster(teamId!), [teamId])

  useEffect(() => {
    if (!teamId) return
    getTeamRecord(teamId).then(setRecord)
  }, [teamId])

  if (!team) return null

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <PageHeader title={team.name} back="/teams" />

      <Card className="p-4 flex items-center gap-3 mb-3">
        <TeamLogoAvatar team={team} size={56} />
        <div className="flex-1">
          <h2 className="text-lg font-bold">{team.name}</h2>
          {team.details && <p className="text-sm text-slate-400">{team.details}</p>}
        </div>
        <Link to={`/teams/${team.id}/edit`}>
          <IconButton icon={EditIcon} label="Edit team" />
        </Link>
      </Card>

      {record && record.played > 0 && (
        <Card className="p-3.5 mb-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">
              {record.played} played · {record.won}W {record.lost}L{record.tied ? ` ${record.tied}T` : ''}
            </span>
            <span className="font-bold font-display tracking-wide">
              {record.played ? round1((record.won / record.played) * 100) : 0}% win
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex bg-white/5">
            {record.won > 0 && <div style={{ width: `${(record.won / record.played) * 100}%` }} className="bg-emerald-500" />}
            {record.tied > 0 && <div style={{ width: `${(record.tied / record.played) * 100}%` }} className="bg-amber-400" />}
            {record.lost > 0 && <div style={{ width: `${(record.lost / record.played) * 100}%` }} className="bg-red-500" />}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-slate-300">Roster ({roster?.length ?? 0})</h2>
        <Button onClick={() => setShowPicker(true)}>
          <span className="inline-flex items-center gap-1.5">{PlusIcon} Add player</span>
        </Button>
      </div>

      <div className="space-y-2">
        {roster?.map(({ teamPlayer, player }) => (
          <Card key={teamPlayer.id} className="flex items-center gap-3 p-3">
            <Link to={`/players/${player.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <PlayerAvatar player={player} size={40} />
              <div className="min-w-0">
                <div className="font-medium flex items-center gap-1.5 flex-wrap">
                  {player.currentName}
                  <RoleBadge battingStyle={player.battingStyle} bowlingStyle={player.bowlingStyle} />
                </div>
              </div>
            </Link>
            <IconButton icon={EditIcon} label={`Edit ${player.currentName}`} onClick={() => setEditTarget(player)} />
            <IconButton
              icon={TrashIcon}
              label={`Remove ${player.currentName}`}
              variant="danger"
              onClick={() => setRemoveTarget({ id: teamPlayer.id, name: player.currentName })}
            />
          </Card>
        ))}
        {roster?.length === 0 && <p className="text-slate-400 text-sm">No players yet.</p>}
      </div>

      <div className="mt-8 pt-4 border-t border-line">
        <Button variant="danger" onClick={() => setConfirmDeleteTeam(true)}>
          <span className="inline-flex items-center gap-1.5">{TrashIcon} Delete team</span>
        </Button>
      </div>

      {showPicker && (
        <PlayerPicker teamId={team.id} onClose={() => setShowPicker(false)} onDone={() => setShowPicker(false)} />
      )}

      {editTarget && (
        <PlayerEditModal
          player={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => setEditTarget(null)}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Remove player"
          message={`Remove ${removeTarget.name} from this team's roster? Their stats history is kept, and they can be re-added later.`}
          confirmLabel="Remove"
          danger
          onCancel={() => setRemoveTarget(null)}
          onConfirm={async () => {
            await removePlayerFromTeam(removeTarget.id)
            setRemoveTarget(null)
          }}
        />
      )}

      {confirmDeleteTeam && (
        <ConfirmDialog
          title="Delete team"
          message={`Delete "${team.name}" permanently? This cannot be undone. Players' personal stats history is preserved.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmDeleteTeam(false)}
          onConfirm={async () => {
            await deleteTeam(team.id)
            navigate('/teams')
          }}
        />
      )}
    </div>
  )
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
