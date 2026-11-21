import { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { Select } from './Select'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

interface Props {
  value: number
  onChange: (timestamp: number) => void
  label?: string
}

export function DateTimePicker({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false)
  const current = new Date(value)

  const [viewYear, setViewYear] = useState(current.getFullYear())
  const [viewMonth, setViewMonth] = useState(current.getMonth())
  const [selected, setSelected] = useState(current)
  const [hour12, setHour12] = useState((() => {
    const h = current.getHours() % 12
    return h === 0 ? 12 : h
  })())
  const [minute, setMinute] = useState(current.getMinutes() - (current.getMinutes() % 5))
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>(current.getHours() >= 12 ? 'PM' : 'AM')

  function openPicker() {
    const d = new Date(value)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    setSelected(d)
    const h = d.getHours() % 12
    setHour12(h === 0 ? 12 : h)
    setMinute(d.getMinutes() - (d.getMinutes() % 5))
    setMeridiem(d.getHours() >= 12 ? 'PM' : 'AM')
    setOpen(true)
  }

  function changeMonth(delta: number) {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setViewMonth(m)
    setViewYear(y)
  }

  function confirm() {
    let hour24 = hour12 % 12
    if (meridiem === 'PM') hour24 += 12
    const d = new Date(viewYear, viewMonth, selected.getDate(), hour24, minute, 0, 0)
    onChange(d.getTime())
    setOpen(false)
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const today = new Date()

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const displayDate = new Date(value)

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="w-full rounded-xl border border-line px-3 py-2.5 text-left bg-panel-2 hover:border-slate-500 transition-colors"
      >
        {label && <div className="text-xs text-slate-500 mb-0.5">{label}</div>}
        <div className="font-medium">
          {displayDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}
          {displayDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </div>
      </button>

      {open && (
        <Modal title="Pick date & time" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
                className="tap-target w-8 h-8 rounded-full bg-panel-2 hover:bg-line flex items-center justify-center"
              >
                ‹
              </button>
              <div className="font-bold">
                {MONTHS[viewMonth]} {viewYear}
              </div>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Next month"
                className="tap-target w-8 h-8 rounded-full bg-panel-2 hover:bg-line flex items-center justify-center"
              >
                ›
              </button>
            </div>

            <div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((w, i) => (
                  <div key={i} className="text-center text-[11px] text-slate-500 font-medium">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                  if (day === null) return <div key={i} />
                  const cellDate = new Date(viewYear, viewMonth, day)
                  const isSelected = isSameDay(cellDate, selected) && selected.getMonth() === viewMonth && selected.getFullYear() === viewYear
                  const isToday = isSameDay(cellDate, today)
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelected(cellDate)}
                      className={`tap-target aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-black'
                          : isToday
                            ? 'border border-emerald-500 text-emerald-400'
                            : 'hover:bg-panel-2'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <div className="text-xs text-slate-500 mb-2">Time</div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={String(hour12)}
                    onChange={(v) => setHour12(Number(v))}
                    title="Pick hour"
                    options={Array.from({ length: 12 }, (_, i) => i + 1).map((h) => ({ value: String(h), label: String(h) }))}
                  />
                </div>
                <span className="font-bold text-slate-500">:</span>
                <div className="flex-1">
                  <Select
                    value={String(minute)}
                    onChange={(v) => setMinute(Number(v))}
                    title="Pick minute"
                    options={MINUTE_STEPS.map((m) => ({ value: String(m), label: pad(m) }))}
                  />
                </div>
                <div className="flex rounded-xl border border-line overflow-hidden shrink-0">
                  {(['AM', 'PM'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMeridiem(m)}
                      className={`tap-target px-3 py-2.5 text-sm font-bold ${meridiem === m ? 'bg-emerald-500 text-black' : 'bg-panel-2 text-slate-300'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirm}>Set date & time</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
