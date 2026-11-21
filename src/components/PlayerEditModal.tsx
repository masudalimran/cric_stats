import { useState } from 'react'
import { renamePlayer, updatePlayerDetails } from '../data/players'
import type { Player } from '../types'
import { Button } from './Button'
import { ImageUpload } from './ImageUpload'
import { Modal } from './Modal'

interface Props {
  player: Player
  onClose: () => void
  onSaved: () => void
}

export function PlayerEditModal({ player, onClose, onSaved }: Props) {
  const [name, setName] = useState(player.currentName)
  const [details, setDetails] = useState(player.details ?? '')
  const [battingStyle, setBattingStyle] = useState(player.battingStyle ?? '')
  const [bowlingStyle, setBowlingStyle] = useState(player.bowlingStyle ?? '')
  const [imageBlobId, setImageBlobId] = useState(player.imageBlobId)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (name.trim() !== player.currentName) await renamePlayer(player.id, name)
      await updatePlayerDetails(player.id, {
        details: details || undefined,
        battingStyle: battingStyle || undefined,
        bowlingStyle: bowlingStyle || undefined,
        imageBlobId,
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Edit player" onClose={onClose}>
      <div className="space-y-3">
        <ImageUpload blobId={imageBlobId} name={name} onChange={setImageBlobId} />
        <div>
          <label className="text-xs text-slate-400 block mb-1">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2.5"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Renaming keeps all past and future stats under this player — nothing resets.
          </p>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Batting style</label>
          <input
            value={battingStyle}
            onChange={(e) => setBattingStyle(e.target.value)}
            placeholder="e.g. Right-hand bat"
            className="w-full rounded-xl border border-line px-3 py-2.5"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Bowling style</label>
          <input
            value={bowlingStyle}
            onChange={(e) => setBowlingStyle(e.target.value)}
            placeholder="e.g. Right-arm medium"
            className="w-full rounded-xl border border-line px-3 py-2.5"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-line px-3 py-2.5"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
