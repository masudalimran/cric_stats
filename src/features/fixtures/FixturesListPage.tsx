import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { deleteFixture } from '../../data/fixtures'
import { removeMatch } from '../../data/match'
import { getMatchSummaries, type MatchSummary } from '../../data/stats'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ChartIcon, EditIcon, PlayIcon, PlusIcon, TrashIcon } from '../../components/icons'
import { IconButton } from '../../components/IconButton'
import { MatchSummaryCard } from '../matches/MatchSummaryCard'

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-sky-400/15 text-sky-300',
  cancelled: 'bg-slate-500/15 text-slate-500',
}

export function FixturesListPage() {
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<MatchSummary | null>(null)
  const [liveMatches, setLiveMatches] = useState<MatchSummary[] | null>(null)
  const fixtures = useLiveQuery(
    () => db.fixtures.where('status').anyOf('scheduled', 'cancelled').sortBy('scheduledAt'),
    [],
  )
  const teams = useLiveQuery(() => db.teams.toArray(), [])
  const teamName = (id: string) => teams?.find((t) => t.id === id)?.name ?? '?'
  const liveFixtureCount = useLiveQuery(() => db.fixtures.where('status').equals('live').count(), [])

  function reloadLive() {
    getMatchSummaries().then((all) => setLiveMatches(all.filter((s) => s.status === 'live')))
  }

  useEffect(() => {
    reloadLive()
  }, [liveFixtureCount])

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-5 gap-2">
        <h1 className="font-display text-3xl tracking-wide">Fixtures</h1>
        <div className="flex items-center gap-2">
          <Link to="/matches">
            <Button variant="ghost">
              <span className="inline-flex items-center gap-1.5">{ChartIcon} Matches</span>
            </Button>
          </Link>
          <Link to="/fixtures/new">
            <Button>
              <span className="inline-flex items-center gap-1.5">{PlusIcon} New fixture</span>
            </Button>
          </Link>
        </div>
      </div>

      {!!liveMatches?.length && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-red-400 mb-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" /> Live now
          </h2>
          <div className="space-y-3">
            {liveMatches.map((s) => (
              <MatchSummaryCard
                key={s.matchId}
                summary={s}
                highlight
                onOpen={() => navigate(`/match/${s.matchId}`)}
                onRemove={() => setRemoveTarget(s)}
              />
            ))}
          </div>
        </div>
      )}

      {fixtures?.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-slate-400 text-sm">
            No upcoming fixtures. Finished matches live on the{' '}
            <Link to="/matches" className="text-emerald-400 hover:underline">
              Matches
            </Link>{' '}
            page.
          </p>
        </Card>
      )}

      <div className="space-y-2">
        {fixtures?.map((f) => (
          <Card key={f.id} className="p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold">
                {teamName(f.teamAId)} <span className="text-slate-500 font-normal">vs</span> {teamName(f.teamBId)}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[f.status]}`}>
                {f.status}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {new Date(f.scheduledAt).toLocaleString()} {f.venue && `· ${f.venue}`} · {f.oversLimit} overs
            </div>
            {f.status === 'scheduled' && (
              <div className="flex items-center gap-2 mt-3">
                <Button onClick={() => navigate(`/fixtures/${f.id}/setup`)}>
                  <span className="inline-flex items-center gap-1.5">{PlayIcon} Start match</span>
                </Button>
                <Link to={`/fixtures/${f.id}/edit`}>
                  <IconButton icon={EditIcon} label="Edit fixture" />
                </Link>
                <IconButton icon={TrashIcon} label="Delete fixture" variant="danger" onClick={() => setDeleteTarget(f.id)} />
              </div>
            )}
          </Card>
        ))}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete fixture"
          message="Delete this fixture and any associated match data? This cannot be undone."
          confirmLabel="Delete"
          danger
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteFixture(deleteTarget)
            setDeleteTarget(null)
          }}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Remove match"
          message={`Remove the match between ${removeTarget.teamAName} and ${removeTarget.teamBName}? Every ball, scorecard entry and player stat from it will be permanently deleted, and the fixture goes back to "scheduled" so it can be replayed. This cannot be undone.`}
          confirmLabel="Remove match"
          danger
          onCancel={() => setRemoveTarget(null)}
          onConfirm={async () => {
            const fixture = await db.fixtures.get(removeTarget.fixtureId)
            if (fixture) await removeMatch(fixture)
            setRemoveTarget(null)
            reloadLive()
          }}
        />
      )}
    </div>
  )
}
