export type Lang = 'en'

export type EventItem = { name: string; date: string; time: string; venue: string; address: string }
/** One line of the day's programme ("17:00 · Nikah ceremony"), with a small drawing. */
export type ProgramItem = { time: string; title: string; icon: string }
export const PROGRAM_ICONS = ['rings', 'mosque', 'glass', 'dinner', 'camera', 'music', 'car', 'cake', 'heart', 'flower'] as const

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
  /** Story cards (long, website-style invitations) */
  program: ProgramItem[]
  dressCode: string
  dressColors: string[]
  closing: string
  showCalendar: boolean
  showProgram: boolean
  showDress: boolean
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
  /** Colour story for story cards: burgundy, emerald, olive, noir, pearl */
  theme: string
}

/** Colour stories for the long, website-style cards. */
export const STORY_THEMES: Record<string, { label: string; bg: string; paper: string; ink: string; accent: string; gold: string; soft: string; deco: 'roses' | 'peony' | 'olive' | 'lace' | 'pearls' }> = {
  burgundy: { label: 'Burgundy romance', bg: '#5a1322', paper: '#f7f0e7', ink: '#3b0d17', accent: '#7a1a2c', gold: '#c9a46a', soft: '#e9d9cc', deco: 'roses' },
  emerald: { label: 'Emerald garden', bg: '#10291f', paper: '#f4f1e9', ink: '#15291f', accent: '#1f4a3a', gold: '#d6be86', soft: '#dfe5dc', deco: 'peony' },
  olive: { label: 'Olive grove', bg: '#6a7247', paper: '#f2eee3', ink: '#3c3f26', accent: '#5b6838', gold: '#b69c60', soft: '#e3e3d1', deco: 'olive' },
  noir: { label: 'Black & white lace', bg: '#161616', paper: '#f5f2ed', ink: '#1b1b1b', accent: '#1b1b1b', gold: '#9d9d9d', soft: '#e6e2dc', deco: 'lace' },
  pearl: { label: 'Pearl & taupe', bg: '#a29482', paper: '#f6f1e9', ink: '#4a4036', accent: '#7f705e', gold: '#c7b494', soft: '#e8dfd2', deco: 'pearls' },
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
  program: [], dressCode: '', dressColors: [], closing: '', showCalendar: true, showProgram: true, showDress: true,
}

export type Template = { id: string; name: string; tag: string; design: Design; content: Content; /** kept for older cards, not shown in the gallery */ hidden?: boolean }

const design = (d: Partial<Design> & Pick<Design, 'bg' | 'ink' | 'accent'>): Design => ({
  headingFont: 'cormorant', bodyFont: 'poppins', nameFont: 'pinyon', scene: 'none', foil: true, photoShape: 'circle',
  opening: 'fade', background: 'plain', effect: 'none', layout: 'classic', cardStyle: 'framed', theme: 'burgundy', ...d,
})
const ev = (name: string, date: string, time: string, venue: string, address: string): EventItem => ({ name, date, time, venue, address })

const story = (theme: string, d: Partial<Design> = {}): Design => {
  const t = STORY_THEMES[theme]
  return design({ bg: t.paper, ink: t.ink, accent: t.accent, headingFont: 'cormorant', bodyFont: 'cormorant', nameFont: 'pinyon', layout: 'story', theme, opening: 'seal', effect: 'none', foil: false, ...d })
}
const prog = (...items: [string, string, string][]): ProgramItem[] => items.map(([time, title, icon]) => ({ time, title, icon }))

export const TEMPLATES: Template[] = [
  {
    id: 'burgundy-romance', name: 'Burgundy Romance', tag: 'Nikah · Baraat', hidden: true,
    design: story('burgundy', { nameFont: 'pinyon', effect: 'petals' }),
    content: { ...baseContent, eventType: 'Shaadi', name1: 'Ayesha', name2: 'Hamza', heading: 'Together with their families',
      message: 'With the blessings of Allah and the love of our families, we would be honoured to have you with us as we begin our life together.',
      events: [ev('Nikah', '2026-12-19', '17:00', 'Faisal Mosque', 'Shah Faisal Avenue, Islamabad'), ev('Baraat', '2026-12-20', '19:30', 'Serena Hotel', 'Khayaban-e-Suhrawardy, Islamabad')],
      program: prog(['17:00', 'Nikah ceremony', 'mosque'], ['19:30', 'Baraat arrives', 'car'], ['20:30', 'Dinner', 'dinner'], ['22:00', 'Rukhsati', 'heart']),
      dressCode: 'We would love to see you in deep reds, ivory and gold.', dressColors: ['#5a1322', '#8c2a3c', '#e9d9cc', '#c9a46a'],
      closing: 'We are waiting for you!' },
  },
  {
    id: 'emerald-garden', name: 'Emerald Garden', tag: 'Nikah · Walima', hidden: true,
    design: story('emerald', { nameFont: 'parisienne', effect: 'fireflies' }),
    content: { ...baseContent, eventType: 'Walima', name1: 'Maryam', name2: 'Usman', heading: 'You are invited to the wedding of',
      message: 'A garden of white flowers, the people we love, and the start of our forever. Please join us.',
      events: [ev('Nikah', '2026-12-19', '16:00', 'Lawn of the Family Home', 'F-7/2, Islamabad'), ev('Walima', '2026-12-21', '20:00', 'Marriott Hotel', 'Aga Khan Road, Islamabad')],
      program: prog(['16:00', 'Nikah', 'rings'], ['18:00', 'Hi-tea in the garden', 'glass'], ['20:00', 'Walima dinner', 'dinner'], ['21:30', 'Photos with the couple', 'camera']),
      dressCode: 'Garden colours: emerald, sage and white.', dressColors: ['#10291f', '#2f5e47', '#a9bba4', '#f4f1e9'],
      closing: 'See you in the garden' },
  },
  {
    id: 'olive-grove', name: 'Olive Grove', tag: 'Mehndi · Nikah', hidden: true,
    design: story('olive', { nameFont: 'alexbrush', effect: 'petals' }),
    content: { ...baseContent, eventType: 'Mehndi', name1: 'Zara', name2: 'Ali', heading: 'Join us for the celebrations of', showBismillah: false,
      message: 'Dholki nights, mehndi songs and a lot of love. Come celebrate with our families.',
      events: [ev('Mehndi', '2026-12-17', '20:00', 'Family Residence', 'DHA Phase 2, Islamabad'), ev('Nikah', '2026-12-19', '18:00', 'Faisal Mosque', 'Shah Faisal Avenue, Islamabad')],
      program: prog(['20:00', 'Guests arrive', 'flower'], ['20:30', 'Mehndi rasm', 'heart'], ['21:30', 'Dholki and songs', 'music'], ['22:30', 'Dinner', 'dinner']),
      dressCode: 'Mehndi: olive, mustard and cream.', dressColors: ['#5b6838', '#9aa36b', '#d8b45a', '#f2eee3'],
      closing: 'Come dance with us!' },
  },
  {
    id: 'noir-lace', name: 'Noir Lace', tag: 'Engagement · Nikah', hidden: true,
    design: story('noir', { nameFont: 'monsieur', headingFont: 'playfair', effect: 'none' }),
    content: { ...baseContent, eventType: 'Engagement', name1: 'Hina', name2: 'Bilal', heading: 'Save the date', showBismillah: false,
      message: 'Two families, one promise. We would love you to be there when we say yes.',
      events: [ev('Mangni', '2026-11-28', '19:00', 'The Monal', 'Pir Sohawa Road, Islamabad')],
      program: prog(['19:00', 'Welcome', 'glass'], ['19:45', 'Exchange of rings', 'rings'], ['20:30', 'Dinner', 'dinner'], ['21:30', 'Cake', 'cake']),
      dressCode: 'Black, white and silver.', dressColors: ['#161616', '#5c5c5c', '#d9d9d9', '#f5f2ed'],
      closing: 'With love' },
  },
  {
    id: 'pearl-taupe', name: 'Pearl & Taupe', tag: 'Walima · Reception', hidden: true,
    design: story('pearl', { nameFont: 'italianno', headingFont: 'playfair', effect: 'sparkles' }),
    content: { ...baseContent, eventType: 'Walima', name1: 'Sana', name2: 'Omar', heading: 'Dear family and friends',
      message: 'Our hearts are full. Please join us for an evening of dinner, laughter and blessings as we celebrate our Walima.',
      events: [ev('Walima', '2026-12-22', '20:00', 'Serena Hotel', 'Khayaban-e-Suhrawardy, Islamabad')],
      program: prog(['20:00', 'Welcome drinks', 'glass'], ['20:45', 'Couple entrance', 'heart'], ['21:15', 'Dinner', 'dinner'], ['22:30', 'Photos', 'camera']),
      dressCode: 'Soft neutrals: pearl, champagne and taupe.', dressColors: ['#7f705e', '#b9ad9e', '#e8dfd2', '#f6f1e9'],
      closing: 'Thank you for being part of our story' },
  },
  {
    id: 'rose-mehndi', name: 'Rose Mehndi', tag: 'Mehndi · Dholki', hidden: true,
    design: story('burgundy', { nameFont: 'greatvibes', headingFont: 'cinzel', effect: 'petals' }),
    content: { ...baseContent, eventType: 'Mehndi', name1: 'Fatima', name2: 'Ahmed', heading: 'Rang, khushboo aur dholki', showBismillah: false,
      message: 'An evening of roses, mehndi and music. Your presence will make it complete.',
      events: [ev('Dholki', '2026-12-14', '20:00', 'Family Residence', 'G-10/4, Islamabad'), ev('Mehndi', '2026-12-17', '20:00', 'Marquee at Club Road', 'Club Road, Islamabad')],
      program: prog(['20:00', 'Dholki', 'music'], ['21:00', 'Mehndi rasm', 'flower'], ['22:00', 'Dinner', 'dinner']),
      dressCode: 'Reds, pinks and gold.', dressColors: ['#7a1a2c', '#c0405a', '#f0b9c0', '#c9a46a'],
      closing: 'Come dance with us!' },
  },
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
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES.find((t) => !t.hidden) ?? TEMPLATES[0]
}

/** Templates shown in the gallery (older ones stay available for cards made with them). */
export const GALLERY_TEMPLATES = TEMPLATES.filter((t) => !t.hidden)

/** Fill in anything missing so older or partial rows always render. */
export function normalize(content: Partial<Content> | null, design: Partial<Design> | null, templateId: string) {
  const t = getTemplate(templateId)
  const c = { ...t.content, ...(content ?? {}), lang: 'en' } as Content
  if (!Array.isArray(c.events)) c.events = []
  if (!Array.isArray(c.family)) c.family = []
  c.gallery = Array.isArray(c.gallery) ? c.gallery.filter((u) => typeof u === 'string' && u.startsWith('https://')).slice(0, 8) : []
  if (typeof c.videoUrl !== 'string') c.videoUrl = ''
  if (!Array.isArray(c.program)) c.program = []
  if (!Array.isArray(c.dressColors)) c.dressColors = []
  c.dressColors = c.dressColors.filter((x) => typeof x === 'string' && /^#[0-9a-f]{3,8}$/i.test(x)).slice(0, 8)
  for (const k of ['dressCode', 'closing'] as const) if (typeof c[k] !== 'string') c[k] = ''
  for (const k of ['showCalendar', 'showProgram', 'showDress'] as const) if (typeof c[k] !== 'boolean') c[k] = true
  return { content: c, design: { ...t.design, ...(design ?? {}) } as Design }
}
