import { useState } from 'react'
import { Modal } from './Modal'
import type { PresetIcon } from './presetIcons'
import { CheckIcon } from './icons'

interface Props {
  value?: string
  onChange: (id: string) => void
  options: PresetIcon[]
  title: string
  triggerLabel: string
  size?: number
}

/** Lets the user pick one of a fixed set of built-in icons — used instead of photo uploads, since this app
 * stores everything locally and ships as a static site with no server to put user photos on. */
export function IconPicker({ value, onChange, options, title, triggerLabel, size = 56 }: Props) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.id === value)

  return (
    <div className="flex items-center gap-3">
      <div style={{ width: size, height: size }} className="rounded-full overflow-hidden shrink-0 bg-panel-2 flex items-center justify-center text-slate-500 text-xs">
        {selected ? selected.render() : '?'}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap-target text-sm px-3 py-1.5 rounded-lg bg-panel-2 hover:bg-line"
      >
        {triggerLabel}
      </button>

      {open && (
        <Modal title={title} onClose={() => setOpen(false)}>
          <div className="grid grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onChange(o.id)
                  setOpen(false)
                }}
                aria-label={o.label}
                className={`tap-target relative aspect-square rounded-full overflow-hidden border-2 ${value === o.id ? 'border-emerald-500' : 'border-transparent hover:border-slate-500'}`}
              >
                {o.render()}
                {value === o.id && (
                  <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                    {CheckIcon}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
