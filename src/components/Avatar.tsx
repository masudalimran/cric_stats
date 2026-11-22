import type { ReactNode } from 'react'
import { useImageUrl } from '../hooks/useImageUrl'

interface Props {
  icon?: ReactNode
  blobId?: string
  name: string
  size?: number
}

export function Avatar({ icon, blobId, name, size = 40 }: Props) {
  const url = useImageUrl(icon ? undefined : blobId)
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full overflow-hidden shrink-0 bg-panel-2 text-slate-200 flex items-center justify-center font-semibold"
    >
      {icon ? icon : url ? <img src={url} alt={name} className="w-full h-full object-cover" /> : initials || '?'}
    </div>
  )
}
