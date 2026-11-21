import { computeRole } from '../lib/role'

const COLORS: Record<string, string> = {
  Batsman: 'bg-sky-400/15 text-sky-300',
  Bowler: 'bg-amber-400/15 text-amber-300',
  'All-rounder': 'bg-violet-400/15 text-violet-300',
}

export function RoleBadge({ battingStyle, bowlingStyle }: { battingStyle?: string; bowlingStyle?: string }) {
  const role = computeRole(battingStyle, bowlingStyle)
  if (!role) return null
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${COLORS[role]}`}>
      {role}
    </span>
  )
}
