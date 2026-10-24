/** Turns a video link into something the card can play: YouTube, Vimeo, or an uploaded file. */
export function videoEmbed(url: string): { kind: 'iframe' | 'file'; src: string } | null {
  let u: URL
  try { u = new URL(url.trim()) } catch { return null }
  if (u.protocol !== 'https:') return null
  const host = u.hostname.replace(/^www\.|^m\./, '')
  let yt = ''
  if (host === 'youtu.be') yt = u.pathname.slice(1)
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') yt = u.searchParams.get('v') || u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/)?.[1] || ''
  if (yt && /^[\w-]{6,20}$/.test(yt)) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0` }
  const vimeo = host === 'vimeo.com' ? u.pathname.match(/^\/(\d{5,12})/)?.[1] : host === 'player.vimeo.com' ? u.pathname.match(/^\/video\/(\d{5,12})/)?.[1] : ''
  if (vimeo) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo}` }
  if (/\.(mp4|webm|mov)$/i.test(u.pathname)) return { kind: 'file', src: u.toString() }
  return null
}
