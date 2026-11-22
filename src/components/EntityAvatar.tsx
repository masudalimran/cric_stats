import { Avatar } from './Avatar'
import { findPreset, PLAYER_AVATARS, TEAM_LOGOS } from './presetIcons'
import type { Player, Team } from '../types'

export function PlayerAvatar({
  player,
  size,
}: {
  player: Pick<Player, 'avatarPreset' | 'imageBlobId' | 'currentName'>
  size?: number
}) {
  const preset = findPreset(PLAYER_AVATARS, player.avatarPreset)
  return <Avatar icon={preset?.render()} blobId={player.imageBlobId} name={player.currentName} size={size} />
}

export function TeamLogoAvatar({ team, size }: { team: Pick<Team, 'logoPreset' | 'logoBlobId' | 'name'>; size?: number }) {
  const preset = findPreset(TEAM_LOGOS, team.logoPreset)
  return <Avatar icon={preset?.render()} blobId={team.logoBlobId} name={team.name} size={size} />
}
