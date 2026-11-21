import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { removeMatch } from '../../data/match'
import { getMatchSummaries, type MatchSummary } from '../../data/stats'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { MatchSummaryCard } from './MatchSummaryCard'

export function MatchesListPage() {
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState<MatchSummary[] | null>(null)
  const [removeTarget, setRemoveTarget] = useState<MatchSummary | null>(null)

  function reload() {
    getMatchSummaries().then(setSummaries)
  }

  useEffect(() => {
    reload()
  }, [])

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <PageHeader title="Matches" back="/fixtures" />

      {summaries === null && <p className="text-slate-400 text-sm">Loading…</p>}

      {summaries?.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-slate-400 text-sm">No matches have started yet.</p>
        </Card>
      )}

      <div className="space-y-3">
        {summaries?.map((s) => (
          <MatchSummaryCard
            key={s.matchId}
            summary={s}
            onOpen={() => navigate(`/match/${s.matchId}`)}
            onRemove={() => setRemoveTarget(s)}
          />
        ))}
      </div>

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
            reload()
          }}
        />
      )}
    </div>
  )
}
