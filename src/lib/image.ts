import { db } from '../db/db'
import { newId } from './id'

/** Resize + compress an image file to a reasonable thumbnail size and store it, returning the blob id. */
export async function storeImage(file: File, maxDim = 512): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/webp', 0.85),
  )
  const id = newId()
  await db.images.put({ id, blob })
  return id
}

export async function deleteImage(id?: string): Promise<void> {
  if (!id) return
  await db.images.delete(id)
}

const urlCache = new Map<string, string>()

export async function getImageUrl(id?: string): Promise<string | undefined> {
  if (!id) return undefined
  if (urlCache.has(id)) return urlCache.get(id)
  const row = await db.images.get(id)
  if (!row) return undefined
  const url = URL.createObjectURL(row.blob)
  urlCache.set(id, url)
  return url
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function base64ToBlob(base64: string): Blob {
  const [meta, data] = base64.split(',')
  const mime = /data:(.*);base64/.exec(meta)?.[1] ?? 'image/webp'
  const bytes = atob(data)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
