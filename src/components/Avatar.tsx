import { useImageUrl } from '../hooks/useImageUrl'

interface Props {
  blobId?: string
  name: string
  size?: number
}

export function Avatar({ blobId, name, size = 40 }: Props) {
  const url = useImageUrl(blobId)
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 bg-panel-2"
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-panel-2 text-slate-200 flex items-center justify-center shrink-0 font-semibold"
    >
      {initials || '?'}
    </div>
  )
}
