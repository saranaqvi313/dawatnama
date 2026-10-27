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
  gallery: string[]
  videoUrl: string
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
  nameFont: string
  scene: string
  foil: boolean
  photoShape: string
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
  kind?: 'classic' | 'canvas'
  canvas?: unknown
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

export const FONTS: Record<string, { label: string; css: string; script?: boolean }> = {
  playfair: { label: 'Playfair Display', css: "'Playfair Display', serif" },
  cormorant: { label: 'Cormorant Garamond', css: "'Cormorant Garamond', serif" },
  cinzel: { label: 'Cinzel (engraved capitals)', css: "'Cinzel', serif" },
  marcellus: { label: 'Marcellus', css: "'Marcellus', serif" },
  poppins: { label: 'Poppins', css: "'Poppins', sans-serif" },
  // Calligraphy (script) faces for names
  greatvibes: { label: 'Great Vibes', css: "'Great Vibes', cursive", script: true },
  pinyon: { label: 'Pinyon Script', css: "'Pinyon Script', cursive", script: true },
  alexbrush: { label: 'Alex Brush', css: "'Alex Brush', cursive", script: true },
  parisienne: { label: 'Parisienne', css: "'Parisienne', cursive", script: true },
  allura: { label: 'Allura', css: "'Allura', cursive", script: true },
  italianno: { label: 'Italianno', css: "'Italianno', cursive", script: true },
  rouge: { label: 'Rouge Script', css: "'Rouge Script', cursive", script: true },
  monsieur: { label: 'Monsieur La Doulaise', css: "'Monsieur La Doulaise', cursive", script: true },
  petitformal: { label: 'Petit Formal Script', css: "'Petit Formal Script', cursive", script: true },
  tangerine: { label: 'Tangerine', css: "'Tangerine', cursive", script: true },
}
export const SCRIPT_FONTS = Object.entries(FONTS).filter(([, f]) => f.script).map(([k]) => k)
export const TEXT_FONTS = Object.entries(FONTS).filter(([, f]) => !f.script).map(([k]) => k)

export const PALETTES: { name: string; bg: string; ink: string; accent: string }[] = [
  { name: 'Sheesh Mahal plum', bg: '#2a0f2e', ink: '#fbeee6', accent: '#e8b86a' },
  { name: 'Moonlit indigo', bg: '#0e1433', ink: '#eef1ff', accent: '#d9c27a' },
  { name: 'Gulab blush', bg: '#fbe9e7', ink: '#5b1f33', accent: '#b8365c' },
  { name: 'Lantern dusk', bg: '#1a1c3d', ink: '#fff3df', accent: '#f2a541' },
  { name: 'Mehndi green', bg: '#1f4d2b', ink: '#fff7e0', accent: '#f5b324' },
  { name: 'Pari pastel', bg: '#f1ecfb', ink: '#3a2c5a', accent: '#a07ad6' },
  { name: 'Emerald & Gold', bg: '#0f3b2e', ink: '#f6efdc', accent: '#d4af37' },
  { name: 'Ivory & Gold', bg: '#fbf6ea', ink: '#3a2f1c', accent: '#b8892b' },
  { name: 'Maroon', bg: '#4a0f1c', ink: '#fbeede', accent: '#e3b962' },
  { name: 'Marigold', bg: '#fff6da', ink: '#4a2c00', accent: '#e07a00' },
  { name: 'Sage', bg: '#eef2e6', ink: '#2f3b2a', accent: '#7a8f55' },
  { name: 'Midnight', bg: '#10152e', ink: '#eef0ff', accent: '#c9b26b' },
]

export const OPTIONS: Record<'opening' | 'background' | 'effect' | 'layout' | 'cardStyle' | 'scene' | 'photoShape', [string, string][]> = {
  scene: [['sheesh', 'Sheesh Mahal'], ['chandni', 'Chandni Raat'], ['gulistan', 'Gulistan'], ['qandeel', 'Qandeel lanterns'], ['genda', 'Genda phool'], ['castle', 'Pariyon ka Mahal'], ['none', 'No scene']],
  opening: [['storybook', 'Storybook'], ['gates', 'Palace gates'], ['magic', 'Magic sparkle'], ['scroll', 'Royal scroll'], ['envelope', 'Envelope'], ['doors', 'Doors'], ['curtain', 'Curtain'], ['fade', 'Soft fade'], ['none', 'None']],
  background: [['plain', 'Plain'], ['geometric', 'Geometric'], ['floral', 'Floral'], ['arches', 'Arches'], ['jaali', 'Jaali lattice'], ['paisley', 'Paisley'], ['glow', 'Glow']],
  effect: [['none', 'None'], ['fireflies', 'Fireflies'], ['sparkles', 'Gold sparkles'], ['petals', 'Falling petals'], ['stars', 'Twinkling stars'], ['hearts', 'Rising hearts']],
  layout: [['classic', 'Classic centred'], ['editorial', 'Editorial']],
  cardStyle: [['framed', 'Framed'], ['double', 'Double border'], ['arch', 'Arch'], ['glass', 'Frosted glass'], ['plain', 'Borderless']],
  photoShape: [['circle', 'Circle'], ['arch', 'Arch'], ['rounded', 'Rounded'], ['none', 'Hide photo']],
}

/** Every function a Pakistani wedding (or other celebration) might have. */
export const EVENT_TYPES = [
  'Dholki', 'Mayun', 'Ubtan', 'Mehndi', 'Rasm-e-Hina', 'Sangeet', 'Nikah', 'Baraat', 'Rukhsati', 'Walima',
  'Mangni', 'Engagement', 'Baat Pakki', 'Haldi', 'Qawwali Night', 'Bridal Shower', 'Chauthi', 'Reception',
  'Aqeeqa', 'Bismillah', 'Ameen', 'Quran Khwani', 'Milad', 'Dua-e-Khair', 'Birthday', 'Anniversary',
  'Baby Shower', 'Housewarming', 'Graduation', 'Iftar', 'Eid Milan', 'Corporate', 'Dinner',
]

const baseContent: Content = {
  lang: 'en', eventType: 'Nikah', heading: 'Together with their families',
  name1: '', name2: '', hosts: '',
  message: 'We request the honour of your presence as we begin our new journey together.',
  events: [{ name: 'Nikah', date: '2026-12-20', time: '19:00', venue: 'Serena Hotel', address: 'Khayaban-e-Suhrawardy, Islamabad' }],
  family: [],
  photoUrl: '', gallery: [], videoUrl: '', musicUrl: '', showBismillah: true, showCountdown: true, showFamily: true, showRsvp: true,
}

export type Template = { id: string; name: string; tag: string; design: Design; content: Content }

const design = (d: Partial<Design> & Pick<Design, 'bg' | 'ink' | 'accent'>): Design => ({
  headingFont: 'cormorant', bodyFont: 'poppins', nameFont: 'pinyon', scene: 'none', foil: true, photoShape: 'circle',
  opening: 'fade', background: 'plain', effect: 'none', layout: 'classic', cardStyle: 'framed', ...d,
})
const ev = (name: string, date: string, time: string, venue: string, address: string): EventItem => ({ name, date, time, venue, address })

export const TEMPLATES: Template[] = [
  {
    id: 'sheesh-mahal', name: 'Sheesh Mahal', tag: 'Nikah · Baraat',
    design: design({ bg: '#2a0f2e', ink: '#fbeee6', accent: '#e8b86a', headingFont: 'cinzel', bodyFont: 'cormorant', nameFont: 'pinyon', scene: 'sheesh', opening: 'gates', background: 'jaali', effect: 'sparkles', cardStyle: 'glass', photoShape: 'arch' }),
    content: { ...baseContent, eventType: 'Shaadi', heading: 'With the blessings of Allah and our elders',
      events: [ev('Nikah', '2026-12-19', '18:00', 'Faisal Mosque', 'Shah Faisal Avenue, Islamabad'), ev('Baraat', '2026-12-20', '19:30', 'Serena Hotel', 'Khayaban-e-Suhrawardy, Islamabad')] },
  },
  {
    id: 'chandni-raat', name: 'Chandni Raat', tag: 'Walima',
    design: design({ bg: '#0e1433', ink: '#eef1ff', accent: '#d9c27a', headingFont: 'marcellus', bodyFont: 'cormorant', nameFont: 'alexbrush', scene: 'chandni', opening: 'storybook', background: 'glow', effect: 'fireflies', cardStyle: 'glass' }),
    content: { ...baseContent, eventType: 'Walima', heading: 'Under the moon and the stars, please join us for',
      events: [ev('Walima', '2026-12-22', '20:00', 'Marriott Hotel', 'Aga Khan Road, Islamabad')] },
  },
  {
    id: 'gulistan', name: 'Gulistan', tag: 'Nikah',
    design: design({ bg: '#fbe9e7', ink: '#5b1f33', accent: '#b8365c', headingFont: 'cormorant', bodyFont: 'cormorant', nameFont: 'parisienne', scene: 'gulistan', opening: 'envelope', background: 'floral', effect: 'petals', cardStyle: 'arch', photoShape: 'arch' }),
    content: { ...baseContent, eventType: 'Nikah', heading: 'In a garden of roses, two hearts become one',
      events: [ev('Nikah', '2026-12-19', '17:00', 'Lawn of the Family Home', 'F-7/2, Islamabad')] },
  },
  {
    id: 'qandeel', name: 'Qandeel', tag: 'Mehndi · Sangeet',
    design: design({ bg: '#1a1c3d', ink: '#fff3df', accent: '#f2a541', headingFont: 'marcellus', bodyFont: 'poppins', nameFont: 'allura', scene: 'qandeel', opening: 'magic', background: 'plain', effect: 'stars', cardStyle: 'glass' }),
    content: { ...baseContent, eventType: 'Mehndi', heading: 'Light a lantern with us', showBismillah: false,
      events: [ev('Mehndi', '2026-12-17', '20:00', 'Rooftop, Family Residence', 'DHA Phase 2, Islamabad'), ev('Sangeet', '2026-12-18', '21:00', 'Rooftop, Family Residence', 'DHA Phase 2, Islamabad')] },
  },
  {
    id: 'genda-phool', name: 'Genda Phool', tag: 'Mehndi · Mayun',
    design: design({ bg: '#1f4d2b', ink: '#fff7e0', accent: '#f5b324', headingFont: 'cinzel', bodyFont: 'poppins', nameFont: 'rouge', scene: 'genda', opening: 'curtain', background: 'paisley', effect: 'petals', cardStyle: 'double', foil: true }),
    content: { ...baseContent, eventType: 'Mehndi', heading: 'Dhol, mehndi and marigolds. Come dance with us!', showBismillah: false,
      events: [ev('Mayun', '2026-12-15', '16:00', 'Family Residence', 'G-10/4, Islamabad'), ev('Mehndi', '2026-12-17', '20:00', 'Marquee at Club Road', 'Club Road, Islamabad')] },
  },
  {
    id: 'pariyon-ka-mahal', name: 'Pariyon ka Mahal', tag: 'Engagement · Birthday',
    design: design({ bg: '#f1ecfb', ink: '#3a2c5a', accent: '#a07ad6', headingFont: 'cormorant', bodyFont: 'poppins', nameFont: 'monsieur', scene: 'castle', opening: 'storybook', background: 'plain', effect: 'sparkles', cardStyle: 'glass' }),
    content: { ...baseContent, eventType: 'Engagement', heading: 'Once upon a time, a promise was made', showBismillah: false,
      events: [ev('Mangni', '2026-11-28', '18:00', 'The Monal', 'Pir Sohawa Road, Islamabad')] },
  },
  {
    id: 'emerald-mehrab', name: 'Emerald Mehrab', tag: 'Nikah',
    design: design({ bg: '#0f3b2e', ink: '#f6efdc', accent: '#d4af37', nameFont: 'greatvibes', opening: 'doors', background: 'geometric', effect: 'sparkles', cardStyle: 'arch', scene: 'sheesh' }),
    content: baseContent,
  },
  {
    id: 'gulab-garden', name: 'Gulab Garden', tag: 'Mehndi',
    design: design({ bg: '#fff1f1', ink: '#5a2333', accent: '#c2456b', headingFont: 'cormorant', bodyFont: 'cormorant', nameFont: 'greatvibes', opening: 'curtain', background: 'floral', effect: 'petals', cardStyle: 'double', scene: 'gulistan' }),
    content: { ...baseContent, eventType: 'Mehndi', heading: 'Join us for an evening of colour', events: [ev('Mehndi', '2026-12-18', '20:00', 'Family Residence', 'F-7/2, Islamabad')] },
  },
  {
    id: 'midnight-sitara', name: 'Midnight Sitara', tag: 'Walima',
    design: design({ bg: '#10152e', ink: '#eef0ff', accent: '#c9b26b', headingFont: 'playfair', nameFont: 'italianno', opening: 'fade', background: 'glow', effect: 'stars', layout: 'editorial', cardStyle: 'plain', scene: 'chandni' }),
    content: { ...baseContent, eventType: 'Walima', heading: 'Walima reception', events: [ev('Walima', '2026-12-22', '19:30', 'Marriott Hotel', 'Aga Khan Road, Islamabad')] },
  },
  {
    id: 'ivory-classic', name: 'Ivory Classic', tag: 'Engagement',
    design: design({ bg: '#fbf6ea', ink: '#3a2f1c', accent: '#b8892b', headingFont: 'playfair', bodyFont: 'cormorant', nameFont: 'petitformal', opening: 'envelope', background: 'arches', cardStyle: 'framed', foil: false }),
    content: { ...baseContent, eventType: 'Engagement', heading: 'We are getting engaged', events: [ev('Engagement', '2026-11-28', '18:00', 'The Monal', 'Pir Sohawa Road, Islamabad')] },
  },
  {
    id: 'saalgirah', name: 'Saalgirah', tag: 'Birthday',
    design: design({ bg: '#fff6da', ink: '#4a2c00', accent: '#e07a00', headingFont: 'poppins', nameFont: 'tangerine', opening: 'magic', effect: 'hearts', layout: 'editorial', cardStyle: 'plain', foil: false, scene: 'qandeel' }),
    content: { ...baseContent, eventType: 'Birthday', heading: 'You are invited to celebrate', message: 'Come for cake, games and fun.', showBismillah: false, showFamily: false, events: [ev('Birthday party', '2026-11-14', '16:00', 'Fun City', 'Centaurus Mall, Islamabad')] },
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
  c.gallery = Array.isArray(c.gallery) ? c.gallery.filter((u) => typeof u === 'string' && u.startsWith('https://')).slice(0, 8) : []
  if (typeof c.videoUrl !== 'string') c.videoUrl = ''
  return { content: c, design: { ...t.design, ...(design ?? {}) } as Design }
}
