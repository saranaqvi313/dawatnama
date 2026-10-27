'use client'
import { useState } from 'react'
import Item from './FaqItem'

/** Questions and answers in the kit's FAQ accordion. */
export default function FaqList({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div>
      {items.map(([title, content], i) => (
        <Item key={title} value={{ id: i, title, content }} isActive={open === i} onClick={() => setOpen(open === i ? null : i)} />
      ))}
    </div>
  )
}
