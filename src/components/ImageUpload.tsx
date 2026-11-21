import { useRef } from 'react'
import { storeImage, deleteImage } from '../lib/image'
import { Avatar } from './Avatar'
import { CameraIcon, TrashIcon } from './icons'
import { IconButton } from './IconButton'

interface Props {
  blobId?: string
  name: string
  onChange: (blobId: string | undefined) => void
}

export function ImageUpload({ blobId, name, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | null) {
    if (!file) return
    const newId = await storeImage(file)
    if (blobId) await deleteImage(blobId)
    onChange(newId)
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar blobId={blobId} name={name || '?'} size={56} />
      <div className="flex gap-2">
        <IconButton
          icon={CameraIcon}
          label={blobId ? 'Change photo' : 'Add photo'}
          onClick={() => inputRef.current?.click()}
          type="button"
        />
        {blobId && (
          <IconButton
            icon={TrashIcon}
            label="Remove photo"
            variant="danger"
            type="button"
            onClick={async () => {
              await deleteImage(blobId)
              onChange(undefined)
            }}
          />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}
