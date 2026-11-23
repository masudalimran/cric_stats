import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { getRoster } from '../../data/players'
import { setOpeners, startMatch } from '../../data/match'
import { Button } from '../../components/Button'
import { PlayerAvatar } from '../../components/EntityAvatar'
import { PageHeader } from '../../components/PageHeader'
import { Select } from '../../components/Select'

export function MatchSetupPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>()
  const navigate = useNavigate()
  const fixture = useLiveQuery(() => db.fixtures.get(fixtureId!), [fixtureId])
  const teamA = useLiveQuery(() => (fixture ? db.teams.get(fixture.teamAId) : undefined), [fixture])
  const teamB = useLiveQuery(() => (fixture ? db.teams.get(fixture.teamBId) : undefined), [fixture])
  const rosterA = useLiveQuery(() => (fixture ? getRoster(fixture.teamAId) : undefined), [fixture])
  const rosterB = useLiveQuery(() => (fixture ? getRoster(fixture.teamBId) : undefined), [fixture])

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [xiA, setXiA] = useState<string[]>([])
  const [xiB, setXiB] = useState<string[]>([])
  const [tossWinner, setTossWinner] = useState<string>('')
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat')
  const [striker, setStriker] = useState('')
  const [nonStriker, setNonStriker] = useState('')

  useEffect(() => {
    if (rosterA && xiA.length === 0) setXiA(rosterA.map((r) => r.player.id))
  }, [rosterA, xiA.length])
  useEffect(() => {
    if (rosterB && xiB.length === 0) setXiB(rosterB.map((r) => r.player.id))
  }, [rosterB, xiB.length])

  if (!fixture || !teamA || !teamB || !rosterA || !rosterB) return null

  const battingTeamId =
    tossWinner && (tossWinner === fixture.teamAId ? (decision === 'bat' ? fixture.teamAId : fixture.teamBId) : decision === 'bat' ? fixture.teamBId : fixture.teamAId)
  const battingXI = battingTeamId === fixture.teamAId ? xiA.map((id) => rosterA.find((r) => r.player.id === id)!.player) : xiB.map((id) => rosterB.find((r) => r.player.id === id)!.player)

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  async function handleFinish() {
    const match = await startMatch({
      fixture: fixture!,
      tossWinnerTeamId: tossWinner,
      decision,
      playingXI: { [fixture!.teamAId]: xiA, [fixture!.teamBId]: xiB },
    })
    const innings = await db.innings.where('matchId').equals(match.id).first()
    if (innings) await setOpeners(innings.id, striker, nonStriker)
    navigate(`/match/${match.id}`)
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      <PageHeader title={`${teamA.name} vs ${teamB.name}`} subtitle={`Step ${step} of 3`} back="/fixtures" />

      {step === 1 && (
        <>
          <h2 className="font-semibold text-slate-300">Squad</h2>
          <p className="text-xs text-slate-500 -mt-1">
            Everyone's selected by default — uncheck anyone who isn't available for this match.
          </p>
          {[{ team: teamA, roster: rosterA, xi: xiA, setXi: setXiA }, { team: teamB, roster: rosterB, xi: xiB, setXi: setXiB }].map(
            ({ team, roster, xi, setXi }) => (
              <div key={team.id} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400">
                    {team.name} ({xi.length} selected)
                  </span>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => setXi(roster.map((r) => r.player.id))}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      Select all
                    </button>
                    <button onClick={() => setXi([])} className="text-slate-400 hover:text-slate-300">
                      Select none
                    </button>
                  </div>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto border border-line rounded-lg p-2">
                  {roster.map(({ player }) => (
                    <label key={player.id} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={xi.includes(player.id)}
                        onChange={() => toggle(xi, setXi, player.id)}
                      />
                      <PlayerAvatar player={player} size={24} />
                      {player.currentName}
                    </label>
                  ))}
                  {roster.length === 0 && <p className="text-xs text-slate-500">No players on this team.</p>}
                </div>
              </div>
            ),
          )}
          <Button onClick={() => setStep(2)} disabled={xiA.length < 2 || xiB.length < 2}>
            Next: Toss
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="font-semibold text-slate-300">Toss</h2>
          <div className="space-y-2">
            <div className="text-sm text-slate-400">Who won the toss?</div>
            <div className="flex gap-2">
              {[teamA, teamB].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTossWinner(t.id)}
                  className={`tap-target flex-1 py-2 rounded-xl border ${tossWinner === t.id ? 'border-emerald-500 bg-emerald-600/20' : 'border-line'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          {tossWinner && (
            <div className="space-y-2">
              <div className="text-sm text-slate-400">Elected to</div>
              <div className="flex gap-2">
                {(['bat', 'bowl'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDecision(d)}
                    className={`tap-target flex-1 py-2 rounded-xl border capitalize ${decision === d ? 'border-emerald-500 bg-emerald-600/20' : 'border-line'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!tossWinner}>
              Next: Openers
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="font-semibold text-slate-300">Opening batters</h2>
          <p className="text-sm text-slate-400">
            {battingTeamId === fixture.teamAId ? teamA.name : teamB.name} bats first.
          </p>
          <div className="space-y-2">
            <Select
              value={striker}
              onChange={setStriker}
              placeholder="Striker"
              title="Pick striker"
              options={battingXI.map((p) => ({ value: p.id, label: p.currentName, disabled: p.id === nonStriker }))}
            />
            <Select
              value={nonStriker}
              onChange={setNonStriker}
              placeholder="Non-striker"
              title="Pick non-striker"
              options={battingXI.map((p) => ({ value: p.id, label: p.currentName, disabled: p.id === striker }))}
            />
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleFinish} disabled={!striker || !nonStriker}>
              Start match
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
