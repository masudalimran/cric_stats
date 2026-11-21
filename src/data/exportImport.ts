import JSZip from 'jszip'
import { db } from '../db/db'
import { base64ToBlob } from '../lib/image'

const EXPORT_VERSION = 2

const EXT_BY_MIME: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
}

interface ImageIndexEntry {
  id: string
  file: string
}

interface DataPayloadV2 {
  version: number
  exportedAt: number
  players: unknown[]
  teams: unknown[]
  teamPlayers: unknown[]
  fixtures: unknown[]
  matches: unknown[]
  innings: unknown[]
  balls: unknown[]
  imageIndex: ImageIndexEntry[]
}

interface DataPayloadV1 {
  version: 1
  players: unknown[]
  teams: unknown[]
  teamPlayers: unknown[]
  fixtures: unknown[]
  matches: unknown[]
  innings: unknown[]
  balls: unknown[]
  images: { id: string; base64: string }[]
}

export async function exportAllData(): Promise<Blob> {
  const [players, teams, teamPlayers, fixtures, matches, innings, balls, images] = await Promise.all([
    db.players.toArray(),
    db.teams.toArray(),
    db.teamPlayers.toArray(),
    db.fixtures.toArray(),
    db.matches.toArray(),
    db.innings.toArray(),
    db.balls.toArray(),
    db.images.toArray(),
  ])

  const zip = new JSZip()
  const imgFolder = zip.folder('images')!
  const imageIndex: ImageIndexEntry[] = images.map((img) => {
    const ext = EXT_BY_MIME[img.blob.type] ?? 'bin'
    const file = `${img.id}.${ext}`
    imgFolder.file(file, img.blob)
    return { id: img.id, file }
  })

  const payload: DataPayloadV2 = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    players,
    teams,
    teamPlayers,
    fixtures,
    matches,
    innings,
    balls,
    imageIndex,
  }
  zip.file('data.json', JSON.stringify(payload))

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

export function downloadExport(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `cric-stats-backup-${date}.zip`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function replaceAllData(
  payload: { players: unknown[]; teams: unknown[]; teamPlayers: unknown[]; fixtures: unknown[]; matches: unknown[]; innings: unknown[]; balls: unknown[] },
  images: { id: string; blob: Blob }[],
): Promise<void> {
  await db.transaction(
    'rw',
    [db.players, db.teams, db.teamPlayers, db.fixtures, db.matches, db.innings, db.balls, db.images],
    async () => {
      await Promise.all([
        db.players.clear(),
        db.teams.clear(),
        db.teamPlayers.clear(),
        db.fixtures.clear(),
        db.matches.clear(),
        db.innings.clear(),
        db.balls.clear(),
        db.images.clear(),
      ])

      await db.players.bulkAdd(payload.players as never[])
      await db.teams.bulkAdd(payload.teams as never[])
      await db.teamPlayers.bulkAdd(payload.teamPlayers as never[])
      await db.fixtures.bulkAdd(payload.fixtures as never[])
      await db.matches.bulkAdd(payload.matches as never[])
      await db.innings.bulkAdd(payload.innings as never[])
      await db.balls.bulkAdd(payload.balls as never[])
      await db.images.bulkAdd(images as never[])
    },
  )
}

function isValidV2Shape(payload: unknown): payload is DataPayloadV2 {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  return (
    typeof p.version === 'number' &&
    Array.isArray(p.players) &&
    Array.isArray(p.teams) &&
    Array.isArray(p.teamPlayers) &&
    Array.isArray(p.fixtures) &&
    Array.isArray(p.matches) &&
    Array.isArray(p.innings) &&
    Array.isArray(p.balls)
  )
}

/** Imports either the current .zip backup format, or (for backward compatibility) the older flat .json format. */
export async function importAllData(file: File): Promise<void> {
  let zip: JSZip | null = null
  try {
    zip = await JSZip.loadAsync(file)
  } catch {
    zip = null
  }

  if (zip) {
    const dataFile = zip.file('data.json')
    if (!dataFile) {
      throw new Error('This zip file doesn’t contain a Cric Stats backup (no data.json found inside).')
    }
    let payload: DataPayloadV2
    try {
      payload = JSON.parse(await dataFile.async('text'))
    } catch {
      throw new Error('This backup is corrupted — data.json inside it is not valid.')
    }
    if (!isValidV2Shape(payload)) {
      throw new Error('This file doesn’t look like a Cric Stats backup.')
    }

    const images: { id: string; blob: Blob }[] = []
    for (const entry of payload.imageIndex ?? []) {
      const imgFile = zip.file(`images/${entry.file}`)
      if (!imgFile) continue
      images.push({ id: entry.id, blob: await imgFile.async('blob') })
    }

    await replaceAllData(payload, images)
    return
  }

  // Not a zip — try the legacy plain-JSON format (v1) before giving up.
  let text: string
  try {
    text = await file.text()
  } catch {
    throw new Error('Could not read this file.')
  }

  let legacy: DataPayloadV1
  try {
    legacy = JSON.parse(text)
  } catch {
    throw new Error('This doesn’t look like a Cric Stats backup file.')
  }

  if (
    !legacy ||
    typeof legacy !== 'object' ||
    legacy.version !== 1 ||
    !Array.isArray(legacy.players) ||
    !Array.isArray(legacy.teams)
  ) {
    throw new Error('This doesn’t look like a Cric Stats backup file.')
  }

  const images = (legacy.images ?? []).map((img) => ({ id: img.id, blob: base64ToBlob(img.base64) }))
  await replaceAllData(legacy, images)
}
