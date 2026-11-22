import { useEffect, useState } from 'react'
import {
  addExistingPlayerToTeam,
  classifyPlayerForTeam,
  createNewPlayerOnTeam,
  migratePlayer,
  normalizeName,
  searchPlayersByName,
} from '../data/players'
import type { Player } from '../types'
import { Button } from './Button'
import { PlayerAvatar } from './EntityAvatar'
import { IconPicker } from './IconPicker'
import { Modal } from './Modal'
import { PLAYER_AVATARS } from './presetIcons'
import { RoleBadge } from './RoleBadge'

interface Suggestion {
  player: Player
  classification: Awaited<ReturnType<typeof classifyPlayerForTeam>>
}

interface Props {
  teamId: string
  onDone: () => void
  onClose: () => void
}

export function PlayerPicker({ teamId, onDone, onClose }: Props) {
  const [name, setName] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [migrationTarget, setMigrationTarget] = useState<Suggestion | null>(null)
  const [reactivateTarget, setReactivateTarget] = useState<Suggestion | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [details, setDetails] = useState('')
  const [battingStyle, setBattingStyle] = useState('')
  const [bowlingStyle, setBowlingStyle] = useState('')
  const [avatarPreset, setAvatarPreset] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    if (name.trim().length < 1) {
      setSuggestions([])
      return
    }
    searchPlayersByName(name).then(async (players) => {
      const classified = await Promise.all(
        players.map(async (player) => ({ player, classification: await classifyPlayerForTeam(player.id, teamId) })),
      )
      if (active) setSuggestions(classified)
    })
    return () => {
      active = false
    }
  }, [name, teamId])

  const exactActiveHere = suggestions.find(
    (s) => s.classification.kind === 'active-here' && normalizeName(s.player.currentName) === normalizeName(name),
  )

  async function handleCreateNew() {
    setSaving(true)
    try {
      await createNewPlayerOnTeam(teamId, name, {
        details: details || undefined,
        battingStyle: battingStyle || undefined,
        bowlingStyle: bowlingStyle || undefined,
        avatarPreset,
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  async function handleReactivate(s: Suggestion) {
    setSaving(true)
    try {
      await addExistingPlayerToTeam(s.player.id, teamId)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  async function handleMigrate(s: Suggestion) {
    if (s.classification.kind !== 'active-elsewhere') return
    setSaving(true)
    try {
      await migratePlayer(s.player.id, s.classification.membership, teamId)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  if (migrationTarget && migrationTarget.classification.kind === 'active-elsewhere') {
    const teamName = migrationTarget.classification.teamName
    return (
      <Modal title="Player already exists" onClose={() => setMigrationTarget(null)}>
        <p className="text-slate-300 mb-4">
          <span className="font-semibold">{migrationTarget.player.currentName}</span> currently plays for{' '}
          <span className="font-semibold">{teamName}</span>. Move them to this team? Their full stats history will
          carry over.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setMigrationTarget(null)}>
            Cancel
          </Button>
          <Button onClick={() => handleMigrate(migrationTarget)} disabled={saving}>
            Yes, migrate
          </Button>
        </div>
      </Modal>
    )
  }

  if (reactivateTarget) {
    return (
      <Modal title="Previously existing player" onClose={() => setReactivateTarget(null)}>
        <p className="text-slate-300 mb-4">
          Add <span className="font-semibold">{reactivateTarget.player.currentName}</span> back to this team? This
          confirms it's the same person — their past stats will continue from where they left off.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setReactivateTarget(null)}>
            Cancel
          </Button>
          <Button onClick={() => handleReactivate(reactivateTarget)} disabled={saving}>
            Yes, same player
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Add player" onClose={onClose}>
      <div className="space-y-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setShowNewForm(false)
          }}
          placeholder="Player name"
          className="w-full rounded-xl border border-line px-3 py-2.5"
        />

        {suggestions.length > 0 && !showNewForm && (
          <div className="rounded-xl border border-line divide-y divide-line overflow-hidden">
            {suggestions.map((s) => {
              const isActiveHere = s.classification.kind === 'active-here'
              return (
                <button
                  key={s.player.id}
                  disabled={isActiveHere}
                  onClick={() =>
                    s.classification.kind === 'active-elsewhere' ? setMigrationTarget(s) : setReactivateTarget(s)
                  }
                  className={`tap-target w-full flex items-center gap-3 px-3 py-2.5 text-left ${isActiveHere ? 'opacity-50 cursor-not-allowed' : 'hover:bg-panel-2'}`}
                >
                  <PlayerAvatar player={s.player} size={32} />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-1.5">
                      {s.player.currentName}
                      <RoleBadge battingStyle={s.player.battingStyle} bowlingStyle={s.player.bowlingStyle} />
                    </div>
                    <div className="text-xs text-slate-400">
                      {isActiveHere && 'Already on this team'}
                      {s.classification.kind === 'active-elsewhere' &&
                        `Plays for ${s.classification.teamName} — tap to migrate`}
                      {s.classification.kind === 'inactive' && '(previously existing) — tap to re-add'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {name.trim().length >= 1 && !showNewForm && (
          exactActiveHere ? (
            <p className="text-xs text-amber-400">
              {exactActiveHere.player.currentName} is already on this roster — pick a different name, or edit their
              existing entry instead.
            </p>
          ) : (
            <button
              onClick={() => setShowNewForm(true)}
              className="tap-target text-sm text-emerald-400 hover:text-emerald-300 font-medium"
            >
              + Add "{name.trim()}" as a new player
            </button>
          )
        )}

        {showNewForm && (
          <div className="space-y-3 pt-2 border-t border-line">
            <IconPicker
              value={avatarPreset}
              onChange={setAvatarPreset}
              options={PLAYER_AVATARS}
              title="Choose an avatar"
              triggerLabel={avatarPreset ? 'Change avatar' : 'Choose avatar'}
            />
            <input
              value={battingStyle}
              onChange={(e) => setBattingStyle(e.target.value)}
              placeholder="Batting style (optional)"
              className="w-full rounded-xl border border-line px-3 py-2.5"
            />
            <input
              value={bowlingStyle}
              onChange={(e) => setBowlingStyle(e.target.value)}
              placeholder="Bowling style (optional)"
              className="w-full rounded-xl border border-line px-3 py-2.5"
            />
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Details (optional)"
              className="w-full rounded-xl border border-line px-3 py-2.5"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNewForm(false)}>
                Back
              </Button>
              <Button onClick={handleCreateNew} disabled={saving || !name.trim()}>
                Add player
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
