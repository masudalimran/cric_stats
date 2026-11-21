import { useEffect, useState } from 'react'
import { getImageUrl } from '../lib/image'

export function useImageUrl(blobId?: string): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    let active = true
    setUrl(undefined)
    if (!blobId) return
    getImageUrl(blobId).then((u) => {
      if (active) setUrl(u)
    })
    return () => {
      active = false
    }
  }, [blobId])

  return url
}
