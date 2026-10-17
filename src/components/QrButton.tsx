'use client'
import { useRef, useState } from 'react'

/** Shows a QR code for a link (to print on a card or show at the door) and lets you download it. */
export default function QrButton({ link, label = 'QR', fileName = 'invitation-qr' }: { link: string; label?: string; fileName?: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [src, setSrc] = useState('')
  const [busy, setBusy] = useState(false)

  async function open() {
    setBusy(true)
    const QR = (await import('qrcode')).default
    setSrc(await QR.toDataURL(link, { width: 640, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#12382d', light: '#ffffff' } }))
    setBusy(false)
    dialog.current?.showModal()
  }

  return (
    <>
      <button type="button" className="chip-btn" onClick={open} disabled={busy} aria-busy={busy}>{label}</button>
      <dialog ref={dialog} className="qr-dialog" onClick={(e) => { if (e.target === dialog.current) dialog.current?.close() }}>
        {src && <img src={src} alt={`QR code for ${link}`} width={280} height={280} />}
        <p dir="ltr" className="muted small-note">{link}</p>
        <div className="row-actions">
          <a className="btn small" href={src} download={`${fileName}.png`}>Download QR</a>
          <button type="button" className="btn ghost small" onClick={() => dialog.current?.close()}>Close</button>
        </div>
      </dialog>
    </>
  )
}
