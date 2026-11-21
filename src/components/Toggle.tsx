interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}

export function Toggle({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`tap-target relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-panel-2 border border-line'}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  )
}
