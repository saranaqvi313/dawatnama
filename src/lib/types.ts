export type Lang = 'en'

export type EventItem = { name: string; date: string; time: string; venue: string; address: string }

export type Content = {
  lang: Lang
  eventType: string
  heading: string
  name1: string
  name2: string
  hosts: string
  message: string
  events: EventItem[]
  family: string[]
  photoUrl: string
  musicUrl: string
  showBismillah: boolean
  showCountdown: boolean
  showFamily: boolean
  showRsvp: boolean
}

export type Design = {
  bg: string
  ink: string
  accent: string
  headingFont: string
  bodyFont: string
  opening: string
  background: string
  effect: string
  layout: string
  cardStyle: string
}

export type Invitation = {
  id: string
  user_id: string
  slug: string
  template: string
  content: Content
  design: Design
  published: boolean
  created_at: string
  updated_at: string
}

export type Rsvp = {
  id: string
  invitation_id: string
  name: string
  attending: 'yes' | 'no' | 'maybe'
  guests: number
  message: string | null
  created_at: string
}

export const FONTS: Record<string, { label: string; css: string }> = {
  playfair: { label: 'Playfair Display', css: "'Playfair Display', serif" },
  cormorant: { label: 'Cormorant Garamond', css: "'Cormorant Garamond', serif" },
  greatvibes: { label: 'Great Vibes (script)', css: "'Great Vibes', cursive" },
  poppins: { label: 'Poppins', css: "'Poppins', sans-serif" },
}

export const PALETTES: { name: string; bg: string; ink: string; accent: string }[] = [
  { name: 'Emerald & Gold', bg: '#0f3b2e', ink: '#f6efdc', accent: '#d4af37' },
  { name: 'Ivory & Gold', bg: '#fbf6ea', ink: '#3a2f1c', accent: '#b8892b' },
  { name: 'Rose', bg: '#fff1f1', ink: '#5a2333', accent: '#c2456b' },
  { name: 'Midnight', bg: '#10152e', ink: '#eef0ff', accent: '#c9b26b' },
  { name: 'Maroon', bg: '#4a0f1c', ink: '#fbeede', accent: '#e3b962' },
  { name: 'Marigold', bg: '#fff6da', ink: '#4a2c00', accent: '#e07a00' },
  { name: 'Sage', bg: '#eef2e6', ink: '#2f3b2a', accent: '#7a8f55' },
  { name: 'Lilac', bg: '#f4effb', ink: '#3b2a55', accent: '#8a5fc7' },
]

export const OPTIONS: Record<'opening' | 'background' | 'effect' | 'layout' | 'cardStyle', [string, string][]> = {
  opening: [['doors', 'Doors'], ['envelope', 'Envelope'], ['curtain', 'Curtain'], ['fade', 'Soft fade'], ['none', 'None']],
  background: [['plain', 'Plain'], ['geometric', 'Geometric'], ['floral', 'Floral'], ['arches', 'Arches'], ['glow', 'Glow']],
  effect: [['none', 'None'], ['petals', 'Falling petals'], ['sparkles', 'Gold sparkles'], ['stars', 'Twinkling stars'], ['hearts', 'Rising hearts']],
  layout: [['classic', 'Classic centred'], ['editorial', 'Editorial']],
  cardStyle: [['framed', 'Framed'], ['double', 'Double border'], ['arch', 'Arch'], ['plain', 'Borderless']],
}

export const EVENT_TYPES = ['Nikah', 'Baraat', 'Walima', 'Mehndi', 'Engagement', 'Birthday', 'Aqeeqa', 'Corporate', 'Eid']

const baseContent: Content = {
  lang: 'en', eventType: 'Nikah', heading: 'Together with their families',
  name1: '', name2: '', hosts: '',
  message: 'We request the honour of your presence as we begin our new journey together.',
  events: [{ name: 'Nikah', date: '2026-12-20', time: '19:00', venue: 'Serena Hotel', address: 'Khayaban-e-Suhrawardy, Islamabad' }],
  family: [],
  photoUrl: '', musicUrl: '', showBismillah: true, showCountdown: true, showFamily: true, showRsvp: true,
}

export type Template = { id: string; name: string; tag: string; design: Design; content: Content }

export const TEMPLATES: Template[] = [
  {
    id: 'emerald-mehrab', name: 'Emerald Mehrab', tag: 'Nikah',
    design: { bg: '#0f3b2e', ink: '#f6efdc', accent: '#d4af37', headingFont: 'cormorant', bodyFont: 'poppins', opening: 'doors', background: 'geometric', effect: 'sparkles', layout: 'classic', cardStyle: 'arch' },
    content: baseContent,
  },
  {
    id: 'gulab-garden', name: 'Gulab Garden', tag: 'Mehndi',
    design: { bg: '#fff1f1', ink: '#5a2333', accent: '#c2456b', headingFont: 'greatvibes', bodyFont: 'cormorant', opening: 'curtain', background: 'floral', effect: 'petals', layout: 'classic', cardStyle: 'double' },
    content: { ...baseContent, eventType: 'Mehndi', heading: 'Join us for an evening of colour', events: [{ name: 'Mehndi', date: '2026-12-18', time: '20:00', venue: 'Family Residence', address: 'F-7/2, Islamabad' }] },
  },
  {
    id: 'midnight-sitara', name: 'Midnight Sitara', tag: 'Walima',
    design: { bg: '#10152e', ink: '#eef0ff', accent: '#c9b26b', headingFont: 'playfair', bodyFont: 'poppins', opening: 'fade', background: 'glow', effect: 'stars', layout: 'editorial', cardStyle: 'plain' },
    content: { ...baseContent, eventType: 'Walima', heading: 'Walima reception', events: [{ name: 'Walima', date: '2026-12-22', time: '19:30', venue: 'Marriott Hotel', address: 'Aga Khan Road, Islamabad' }] },
  },
  {
    id: 'ivory-classic', name: 'Ivory Classic', tag: 'Engagement',
    design: { bg: '#fbf6ea', ink: '#3a2f1c', accent: '#b8892b', headingFont: 'playfair', bodyFont: 'cormorant', opening: 'envelope', background: 'arches', effect: 'none', layout: 'classic', cardStyle: 'framed' },
    content: { ...baseContent, eventType: 'Engagement', heading: 'We are getting engaged', events: [{ name: 'Engagement', date: '2026-11-28', time: '18:00', venue: 'The Monal', address: 'Pir Sohawa Road, Islamabad' }] },
  },
  {
    id: 'saalgirah', name: 'Saalgirah', tag: 'Birthday',
    design: { bg: '#fff6da', ink: '#4a2c00', accent: '#e07a00', headingFont: 'poppins', bodyFont: 'poppins', opening: 'envelope', background: 'plain', effect: 'hearts', layout: 'editorial', cardStyle: 'plain' },
    content: { ...baseContent, eventType: 'Birthday', heading: 'You are invited to celebrate', message: 'Come for cake, games and fun.', showBismillah: false, showFamily: false, events: [{ name: 'Birthday party', date: '2026-11-14', time: '16:00', venue: 'Fun City', address: 'Centaurus Mall, Islamabad' }] },
  },
]

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}

/** Fill in anything missing so older or partial rows always render. */
export function normalize(content: Partial<Content> | null, design: Partial<Design> | null, templateId: string) {
  const t = getTemplate(templateId)
  const c = { ...t.content, ...(content ?? {}), lang: 'en' } as Content
  if (!Array.isArray(c.events)) c.events = []
  if (!Array.isArray(c.family)) c.family = []
  return { content: c, design: { ...t.design, ...(design ?? {}) } as Design }
}
