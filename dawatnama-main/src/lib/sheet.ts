/**
 * Reads a guest list from an Excel (.xlsx) or CSV file in the browser, without extra libraries.
 * Recognised columns (any order, any case): Name, Phone / Mobile / WhatsApp, Guests / People /
 * Count, Events / Functions. Without a header row: A = name, B = phone, C = number of people.
 */
export type SheetGuest = { name: string; phone?: string; party_size?: number; events?: string[] }

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  const s = text.replace(/^﻿/, '')
  const sep = (s.split('\n')[0].match(/;/g)?.length ?? 0) > (s.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ','
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === sep) { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim()))
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Minimal .zip reader: returns the files we ask for. */
async function unzip(buf: ArrayBuffer, wanted: (name: string) => boolean): Promise<Record<string, string>> {
  const v = new DataView(buf)
  const bytes = new Uint8Array(buf)
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  if (eocd < 0) throw new Error('This is not an Excel file.')
  const count = v.getUint16(eocd + 10, true)
  let p = v.getUint32(eocd + 16, true)
  const out: Record<string, string> = {}
  const dec = new TextDecoder()
  for (let n = 0; n < count; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) break
    const method = v.getUint16(p + 10, true)
    const size = v.getUint32(p + 20, true)
    const nameLen = v.getUint16(p + 28, true), extraLen = v.getUint16(p + 30, true), commentLen = v.getUint16(p + 32, true)
    const local = v.getUint32(p + 42, true)
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen))
    p += 46 + nameLen + extraLen + commentLen
    if (!wanted(name)) continue
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true)
    const raw = bytes.subarray(start, start + size)
    out[name] = dec.decode(method === 0 ? raw : await inflate(raw))
  }
  return out
}

function colIndex(ref: string) {
  let n = 0
  for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

export async function parseXlsx(buf: ArrayBuffer): Promise<string[][]> {
  const files = await unzip(buf, (n) => n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
  const sheetName = Object.keys(files).filter((n) => n.startsWith('xl/worksheets/')).sort()[0]
  if (!sheetName) throw new Error('No sheet found in this file.')
  const xml = (s: string) => new DOMParser().parseFromString(s, 'application/xml')
  const shared = files['xl/sharedStrings.xml']
    ? Array.from(xml(files['xl/sharedStrings.xml']).getElementsByTagName('si')).map((si) => Array.from(si.getElementsByTagName('t')).map((t) => t.textContent ?? '').join(''))
    : []
  const rows: string[][] = []
  for (const r of Array.from(xml(files[sheetName]).getElementsByTagName('row'))) {
    const row: string[] = []
    for (const c of Array.from(r.getElementsByTagName('c'))) {
      const type = c.getAttribute('t')
      const val = c.getElementsByTagName('v')[0]?.textContent ?? ''
      const text = type === 's' ? shared[Number(val)] ?? ''
        : type === 'inlineStr' ? Array.from(c.getElementsByTagName('t')).map((t) => t.textContent ?? '').join('')
          : val
      row[colIndex(c.getAttribute('r') ?? 'A')] = text
    }
    rows.push(Array.from(row, (x) => x ?? ''))
  }
  return rows.filter((r) => r.some((c) => String(c).trim()))
}

const pick = (header: string[], names: RegExp) => header.findIndex((h) => names.test(h.trim().toLowerCase()))

/** Turns sheet rows into guests. */
export function rowsToGuests(rows: string[][]): SheetGuest[] {
  if (!rows.length) return []
  const header = rows[0].map(String)
  let iName = pick(header, /^(full\s*)?name|^guest|^naam/)
  let iPhone = pick(header, /phone|mobile|whats\s*app|number|contact|cell/)
  let iCount = pick(header, /^(guests?|people|persons?|count|members?|party|seats?|total|afrad)/)
  const iEvents = pick(header, /events?|functions?|invited to/)
  let body = rows.slice(1)
  if (iName < 0) { iName = 0; iPhone = 1; iCount = 2; body = rows }
  return body.map((r) => ({
    name: String(r[iName] ?? '').trim(),
    phone: iPhone >= 0 ? String(r[iPhone] ?? '').trim() : undefined,
    party_size: iCount >= 0 ? Number(String(r[iCount] ?? '').replace(/[^\d]/g, '')) || 1 : 1,
    events: iEvents >= 0 ? String(r[iEvents] ?? '').split(/[,;/|]/).map((e) => e.trim()).filter(Boolean) : [],
  })).filter((g) => g.name && !/^\d+$/.test(g.name))
}

export async function readGuestFile(file: File): Promise<SheetGuest[]> {
  if (file.size > 5 * 1024 * 1024) throw new Error('The file is too big (5 MB max).')
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.xlsx')) return rowsToGuests(await parseXlsx(await file.arrayBuffer()))
  if (lower.endsWith('.csv') || lower.endsWith('.txt')) return rowsToGuests(parseCsv(await file.text()))
  if (lower.endsWith('.xls')) throw new Error('Old .xls files are not supported. In Excel choose File → Save As → Excel Workbook (.xlsx).')
  throw new Error('Please upload an Excel (.xlsx) or CSV file.')
}
