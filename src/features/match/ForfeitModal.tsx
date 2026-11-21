import { useState } from 'react'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'

interface Props {
  teamAId: string
  teamAName: string
  teamBId: string
  teamBName: string
  onConfirm: (forfeitingTeamId: string) => void
  onCancel: () => void
}

export function ForfeitModal({ teamAId, teamAName, teamBId, teamBName, onConfirm, onCancel }: Props) {
  const [picked, setPicked] = useState<string | null>(null)

  if (picked) {
    const winnerName = picked === teamAId ? teamBName : teamAName
    const forfeitingName = picked === teamAId ? teamAName : teamBName
    return (
      <Modal title="Confirm forfeit" onClose={onCancel}>
        <p className="text-slate-300 mb-4">
          <span className="font-semibold">{forfeitingName}</span> forfeits the match — {winnerName} will be recorded
          as the winner. This ends the match immediately; any overs not yet bowled won't be scored.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPicked(null)}>
            Back
          </Button>
          <Button variant="danger" onClick={() => onConfirm(picked)}>
            Confirm forfeit
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Forfeit match" onClose={onCancel}>
      <p className="text-slate-300 mb-4">Which team is forfeiting?</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setPicked(teamAId)}
          className="tap-target py-4 rounded-xl border border-line bg-panel-2 hover:border-red-500 font-semibold"
        >
          {teamAName}
        </button>
        <button
          onClick={() => setPicked(teamBId)}
          className="tap-target py-4 rounded-xl border border-line bg-panel-2 hover:border-red-500 font-semibold"
        >
          {teamBName}
        </button>
      </div>
    </Modal>
  )
}
