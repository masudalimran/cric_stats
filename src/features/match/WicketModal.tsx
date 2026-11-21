import { useState, type ReactNode } from 'react'
import type { WicketType } from '../../types'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import {
  BowledIcon,
  CaughtIcon,
  HitWicketIcon,
  LbwIcon,
  OtherIcon,
  RetiredIcon,
  RunOutIcon,
  StumpedIcon,
} from '../../components/icons'

const WICKET_TYPES: { type: WicketType; label: string; icon: ReactNode }[] = [
  { type: 'bowled', label: 'Bowled', icon: BowledIcon },
  { type: 'caught', label: 'Caught', icon: CaughtIcon },
  { type: 'lbw', label: 'LBW', icon: LbwIcon },
  { type: 'runout', label: 'Run out', icon: RunOutIcon },
  { type: 'stumped', label: 'Stumped', icon: StumpedIcon },
  { type: 'hitwicket', label: 'Hit wicket', icon: HitWicketIcon },
  { type: 'retired', label: 'Retired', icon: RetiredIcon },
  { type: 'obstructing', label: 'Other', icon: OtherIcon },
]

const NEEDS_FIELDER: WicketType[] = ['caught', 'runout', 'stumped']

interface Person {
  id: string
  name: string
}

export interface WicketResult {
  wicketType: WicketType
  dismissedPlayerId: string
  fielderId?: string
  replacementBatterId?: string
}

interface Props {
  strikerId: string
  strikerName: string
  nonStrikerId: string
  nonStrikerName: string
  fieldingXI: Person[]
  newBatterOptions: Person[]
  isLastWicket: boolean
  onConfirm: (result: WicketResult) => void
  onCancel: () => void
}

export function WicketModal({
  strikerId,
  strikerName,
  nonStrikerId,
  nonStrikerName,
  fieldingXI,
  newBatterOptions,
  isLastWicket,
  onConfirm,
  onCancel,
}: Props) {
  const [wicketType, setWicketType] = useState<WicketType | null>(null)
  const [dismissedPlayerId, setDismissedPlayerId] = useState<string>(strikerId)
  const [fielderId, setFielderId] = useState<string>('')
  const [detailConfirmed, setDetailConfirmed] = useState(false)

  const needsFielder = wicketType ? NEEDS_FIELDER.includes(wicketType) : false
  const needsWhoIsOut = wicketType === 'runout'
  const step2Needed = (needsFielder || needsWhoIsOut) && !detailConfirmed

  function finish(replacementBatterId?: string) {
    if (!wicketType) return
    onConfirm({ wicketType, dismissedPlayerId, fielderId: fielderId || undefined, replacementBatterId })
  }

  if (!wicketType) {
    return (
      <Modal title="Wicket — how out?" onClose={onCancel}>
        <div className="grid grid-cols-4 gap-2">
          {WICKET_TYPES.map((w) => (
            <button
              key={w.type}
              onClick={() => {
                setWicketType(w.type)
                setDetailConfirmed(false)
              }}
              className="tap-target flex flex-col items-center gap-1.5 py-3 rounded-xl bg-panel-2 hover:bg-line"
            >
              {w.icon}
              <span className="text-[11px] font-medium leading-none">{w.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    )
  }

  if (step2Needed) {
    return (
      <Modal title="Wicket details" onClose={onCancel}>
        <div className="space-y-4">
          {needsWhoIsOut && (
            <div>
              <div className="text-sm text-slate-400 mb-1">Who's out?</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDismissedPlayerId(strikerId)}
                  className={`tap-target flex-1 py-2 rounded-xl border ${dismissedPlayerId === strikerId ? 'border-emerald-500 bg-emerald-600/20' : 'border-line'}`}
                >
                  {strikerName} (striker)
                </button>
                <button
                  onClick={() => setDismissedPlayerId(nonStrikerId)}
                  className={`tap-target flex-1 py-2 rounded-xl border ${dismissedPlayerId === nonStrikerId ? 'border-emerald-500 bg-emerald-600/20' : 'border-line'}`}
                >
                  {nonStrikerName} (non-striker)
                </button>
              </div>
            </div>
          )}
          {needsFielder && (
            <div>
              <div className="text-sm text-slate-400 mb-1">
                {wicketType === 'stumped' ? 'Keeper' : 'Fielder'}
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {fieldingXI.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setFielderId(p.id)}
                    className={`tap-target w-full text-left py-2 px-3 rounded-xl border ${fielderId === p.id ? 'border-emerald-500 bg-emerald-600/20' : 'border-line'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setWicketType(null)}>
              Back
            </Button>
            <Button
              onClick={() => (isLastWicket ? finish() : setDetailConfirmed(true))}
              disabled={needsFielder && !fielderId}
            >
              {isLastWicket ? 'Confirm — all out' : 'Next: new batter'}
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  if (isLastWicket) {
    return (
      <Modal title="Confirm wicket" onClose={onCancel} footer={<Button onClick={() => finish()}>Confirm — all out</Button>}>
        <p className="text-slate-300">{strikerName} is out. That's the last wicket — innings complete.</p>
      </Modal>
    )
  }

  return (
    <Modal title="New batter" onClose={onCancel}>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {newBatterOptions.map((p) => (
          <button
            key={p.id}
            onClick={() => finish(p.id)}
            className="tap-target w-full text-left py-2 px-3 rounded-xl border border-line hover:border-emerald-500"
          >
            {p.name}
          </button>
        ))}
      </div>
    </Modal>
  )
}
