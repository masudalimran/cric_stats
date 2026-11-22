import { db } from '../db/db'

/** Legacy support: deletes a previously-uploaded image blob (from before uploads were replaced with preset icons). */
export async function deleteImage(id?: string): Promise<void> {
  if (!id) return
  await db.images.delete(id)
}

const urlCache = new Map<string, string>()

/** Legacy support: resolves a previously-uploaded image blob to a displayable URL, if one still exists. */
export async function getImageUrl(id?: string): Promise<string | undefined> {
  if (!id) return undefined
  if (urlCache.has(id)) return urlCache.get(id)
  const row = await db.images.get(id)
  if (!row) return undefined
  const url = URL.createObjectURL(row.blob)
  urlCache.set(id, url)
  return url
}

/** Legacy support: decodes a base64 image embedded in an old (pre-zip) backup file. */
export function base64ToBlob(base64: string): Blob {
  const [meta, data] = base64.split(',')
  const mime = /data:(.*);base64/.exec(meta)?.[1] ?? 'image/webp'
  const bytes = atob(data)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
