import { useState } from 'react'
import { CheckIcon, ChevronDownIcon } from './icons'
import { Modal } from './Modal'

export interface SelectOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface Props<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  title?: string
  disabled?: boolean
}

/** A button that opens a bottom-sheet list of options — used everywhere instead of a native <select> so
 * the picker looks and behaves the same on every device, rather than whatever the OS/browser renders. */
export function Select<T extends string>({ value, onChange, options, placeholder = 'Select…', title, disabled }: Props<T>) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="tap-target w-full flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2.5 bg-panel-2 text-left disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-500 transition-colors"
      >
        <span className={`truncate ${selected ? '' : 'text-slate-500'}`}>{selected?.label ?? placeholder}</span>
        <span className="text-slate-500 shrink-0">{ChevronDownIcon}</span>
      </button>

      {open && (
        <Modal title={title ?? placeholder} onClose={() => setOpen(false)}>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto -mx-1 px-1">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                disabled={o.disabled}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={`tap-target w-full flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  o.value === value ? 'bg-emerald-500 text-black font-semibold' : 'hover:bg-panel-2'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && CheckIcon}
              </button>
            ))}
            {options.length === 0 && <p className="text-sm text-slate-500 px-3 py-2">No options.</p>}
          </div>
        </Modal>
      )}
    </>
  )
}
