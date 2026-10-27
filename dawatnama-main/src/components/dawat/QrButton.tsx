'use client'
import { useState } from 'react'
import Modal from '@/components/Modal'
import Button from '@/components/Button'
import Icon from '@/components/Icon'

/** Shows a QR code for a link (to print on a card or show at the door) and lets you download it. */
export default function QrButton({ link, label = 'QR', fileName = 'invitation-qr', large }: { link: string; label?: string; fileName?: string; large?: boolean }) {
  const [src, setSrc] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)

  async function show() {
    setBusy(true)
    const QR = (await import('qrcode')).default
    setSrc(await QR.toDataURL(link, { width: 640, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#141414', light: '#ffffff' } }))
    setBusy(false)
    setOpen(true)
  }

  return (
    <>
      {large ? (
        <Button isStroke icon="grid" className="gap-2" onClick={show} disabled={busy} aria-busy={busy || undefined}>{label}</Button>
      ) : (
        <button type="button" className="action" onClick={show} disabled={busy} aria-busy={busy || undefined}><Icon name="grid" />{label}</button>
      )}
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="mb-6 text-h4 text-center max-md:text-h5">QR code</div>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="block mx-auto w-70 max-w-full h-auto rounded-3xl border border-s-subtle" src={src} alt={`QR code for ${link}`} width={280} height={280} />
        )}
        <div className="mt-4 text-center text-caption text-t-secondary break-all" dir="ltr">{link}</div>
        <div className="flex gap-3 mt-8">
          <Button className="flex-1" isStroke onClick={() => setOpen(false)}>Close</Button>
          <Button className="flex-1" isBlack as="a" href={src} download={`${fileName}.png`}>Download QR</Button>
        </div>
      </Modal>
    </>
  )
}
