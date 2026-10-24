'use client'
/** Uploads for cards. Photos are shrunk in the browser first so cards open fast on phones. */
import { createClient } from './supabase/client'

const MAX_SIDE = 1600

/** Resizes to at most 1600px and re-encodes (WebP where supported, else JPEG). Small files are left alone. */
export async function compressImage(file: File, maxSide = MAX_SIDE, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  let bitmap: ImageBitmap
  try { bitmap = await createImageBitmap(file) } catch { return file }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size < 350 * 1024) { bitmap.close(); return file }
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) { bitmap.close(); return file }
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const encode = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality))
  const out = (await encode('image/webp')) ?? (await encode('image/jpeg'))
  return out && out.size < file.size ? out : file
}

function extFor(blob: Blob, name: string) {
  if (blob.type === 'image/webp') return 'webp'
  if (blob.type === 'image/jpeg') return 'jpg'
  if (blob.type === 'image/png') return 'png'
  return (name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'
}

/** Uploads into the user's own folder of the public "photos" bucket and returns the public URL. */
export async function uploadMedia(file: File, userId: string, prefix: string, kind: 'image' | 'video' = 'image'): Promise<string> {
  if (kind === 'image') {
    if (!file.type.startsWith('image/')) throw new Error('Please choose a photo (JPG, PNG or WebP).')
    if (file.size > 15 * 1024 * 1024) throw new Error('Photos must be under 15 MB.')
  } else {
    if (!/^video\/(mp4|webm|quicktime)$/.test(file.type)) throw new Error('Please choose an MP4 or WebM video.')
    if (file.size > 30 * 1024 * 1024) throw new Error('Videos must be under 30 MB. For longer videos, upload to YouTube and paste the link.')
  }
  const blob = kind === 'image' ? await compressImage(file) : file
  const path = `${userId}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${extFor(blob, file.name)}`
  const supabase = createClient()
  const { error } = await supabase.storage.from('photos').upload(path, blob, { upsert: false, contentType: blob.type || file.type, cacheControl: '31536000' })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
}
