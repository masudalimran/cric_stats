import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import { getLeaderboard, getRecords, type LeaderboardRow, type RecordEntry } from '../../data/stats'
import { round } from '../../lib/cricket'
import { Card } from '../../components/Card'
import { TopBarChart } from '../../components/charts'
import { Select } from '../../components/Select'

type Tab = 'runs' | 'wickets' | 'economy' | 'records'

const TAB_LABEL: Record<Tab, string> = {
  runs: 'Most runs',
  wickets: 'Most wickets',
  economy: 'Best economy',
  records: 'Records',
}

export function LeaderboardsPage() {
  const teams = useLiveQuery(() => db.teams.orderBy('name').toArray(), [])
  const [teamFilter, setTeamFilter] = useState<string>('')
  const [tab, setTab] = useState<Tab>('runs')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [records, setRecords] = useState<RecordEntry[]>([])

  useEffect(() => {
    getLeaderboard(teamFilter || undefined).then(setRows)
  }, [teamFilter])

  useEffect(() => {
    getRecords().then(setRecords)
  }, [])

  const sorted = [...rows]
    .sort((a, b) => {
      switch (tab) {
        case 'runs':
          return b.batting.runs - a.batting.runs
        case 'wickets':
          return b.bowling.wickets - a.bowling.wickets
        case 'economy':
          return (a.bowling.economy || Infinity) - (b.bowling.economy || Infinity)
        case 'records':
          return 0
      }
    })
    .filter((r) => (tab === 'wickets' || tab === 'economy' ? r.bowling.innings > 0 : r.batting.innings > 0))

  const valueOf = (r: LeaderboardRow) => {
    switch (tab) {
      case 'runs':
        return r.batting.runs
      case 'wickets':
        return r.bowling.wickets
      case 'economy':
        return round(r.bowling.economy)
      case 'records':
        return 0
    }
  }

  const chartRows = sorted.slice(0, 5).map((r) => ({ label: r.playerName, value: valueOf(r) }))

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <h1 className="font-display text-3xl tracking-wide mb-5">Stats</h1>

      {tab !== 'records' && (
        <div className="mb-3">
          <Select
            value={teamFilter}
            onChange={setTeamFilter}
            placeholder="All teams"
            title="Filter by team"
            options={[{ value: '', label: 'All teams' }, ...(teams?.map((t) => ({ value: t.id, label: t.name })) ?? [])]}
          />
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['runs', 'wickets', 'economy', 'records'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tap-target px-3.5 py-1.5 rounded-full text-sm font-semibold capitalize whitespace-nowrap ${tab === t ? 'bg-emerald-500 text-black' : 'bg-panel-2 text-slate-300'}`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === 'records' ? (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={r.title} className="flex items-center justify-between p-3.5 gap-3">
              <div className="min-w-0">
                <div className="text-sm text-slate-400">{r.title}</div>
                <div className="text-xs text-slate-500 truncate">{r.subtitle}</div>
              </div>
              <span className="font-display text-xl tracking-wide shrink-0">{r.value}</span>
            </Card>
          ))}
          {records.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-slate-400 text-sm">No completed innings yet — records will show up once a match finishes.</p>
            </Card>
          )}
        </div>
      ) : (
        <>
          {chartRows.length > 0 && (
            <Card className="p-4 mb-4">
              <h2 className="text-sm font-bold text-slate-300 mb-3">Top 5 — {TAB_LABEL[tab]}</h2>
              <TopBarChart rows={chartRows} />
            </Card>
          )}

          <div className="space-y-1.5">
            {sorted.map((r, i) => (
              <Link key={r.playerId} to={`/players/${r.playerId}`}>
                <Card className="flex items-center justify-between p-3 hover:border-slate-500 transition-colors">
                  <span className="text-sm flex items-center gap-2 min-w-0">
                    <span className="text-slate-500 w-5 shrink-0">{i + 1}.</span>
                    <span className="min-w-0">
                      <span className="font-medium">{r.playerName}</span>
                      <span className="block text-[11px] text-slate-500 truncate">
                        {r.teamNames.join(', ') || 'No current team'}
                      </span>
                    </span>
                  </span>
                  <span className="font-display text-xl tracking-wide shrink-0">{valueOf(r)}</span>
                </Card>
              </Link>
            ))}
            {sorted.length === 0 && (
              <Card className="p-6 text-center">
                <p className="text-slate-400 text-sm">No matches recorded yet.</p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
