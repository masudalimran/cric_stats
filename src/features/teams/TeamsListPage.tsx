import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TeamLogoAvatar } from '../../components/EntityAvatar'
import { PlusIcon } from '../../components/icons'

export function TeamsListPage() {
  const teams = useLiveQuery(() => db.teams.orderBy('name').toArray(), [])
  const rosterCounts = useLiveQuery(async () => {
    const rows = await db.teamPlayers.where('status').equals('active').toArray()
    const counts: Record<string, number> = {}
    for (const r of rows) counts[r.teamId] = (counts[r.teamId] ?? 0) + 1
    return counts
  }, [])

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-3xl tracking-wide">Teams</h1>
        <Link to="/teams/new">
          <Button>
            <span className="inline-flex items-center gap-1.5">{PlusIcon} New team</span>
          </Button>
        </Link>
      </div>

      {teams?.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-slate-400 text-sm">No teams yet. Create one to start adding players and fixtures.</p>
        </Card>
      )}

      <div className="space-y-2">
        {teams?.map((team) => (
          <Link key={team.id} to={`/teams/${team.id}`}>
            <Card className="flex items-center gap-3 p-3.5 hover:border-slate-500 transition-colors">
              <TeamLogoAvatar team={team} size={48} />
              <div className="flex-1">
                <div className="font-bold">{team.name}</div>
                <div className="text-xs text-slate-400">{rosterCounts?.[team.id] ?? 0} players</div>
              </div>
              <span className="text-slate-500">›</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
