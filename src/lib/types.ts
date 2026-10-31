import type { CategoryId } from './categories'

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

export type Template = { id: string; name: string; tag: string; categories: CategoryId[]; design: Design; content: Content }

const design = (d: Partial<Design> & Pick<Design, 'bg' | 'ink' | 'accent'>): Design => ({
  headingFont: 'cormorant', bodyFont: 'poppins', nameFont: 'pinyon', scene: 'none', foil: true, photoShape: 'circle',
  opening: 'fade', background: 'plain', effect: 'none', layout: 'classic', cardStyle: 'framed', ...d,
})
const ev = (name: string, date: string, time: string, venue: string, address: string): EventItem => ({ name, date, time, venue, address })

export const TEMPLATES: Template[] = [
  {
    id: 'sheesh-mahal', name: 'Sheesh Mahal', tag: 'Nikah · Baraat', categories: ['nikah', 'baraat'],
    design: design({ bg: '#2a0f2e', ink: '#fbeee6', accent: '#e8b86a', headingFont: 'cinzel', bodyFont: 'cormorant', nameFont: 'pinyon', scene: 'sheesh', opening: 'gates', background: 'jaali', effect: 'sparkles', cardStyle: 'glass', photoShape: 'arch' }),
    content: { ...baseContent, eventType: 'Shaadi', heading: 'With the blessings of Allah and our elders',
      events: [ev('Nikah', '2026-12-19', '18:00', 'Faisal Mosque', 'Shah Faisal Avenue, Islamabad'), ev('Baraat', '2026-12-20', '19:30', 'Serena Hotel', 'Khayaban-e-Suhrawardy, Islamabad')] },
  },
  {
    id: 'chandni-raat', name: 'Chandni Raat', tag: 'Walima', categories: ['walima'],
    design: design({ bg: '#0e1433', ink: '#eef1ff', accent: '#d9c27a', headingFont: 'marcellus', bodyFont: 'cormorant', nameFont: 'alexbrush', scene: 'chandni', opening: 'storybook', background: 'glow', effect: 'fireflies', cardStyle: 'glass' }),
    content: { ...baseContent, eventType: 'Walima', heading: 'Under the moon and the stars, please join us for',
      events: [ev('Walima', '2026-12-22', '20:00', 'Marriott Hotel', 'Aga Khan Road, Islamabad')] },
  },
  {
    id: 'gulistan', name: 'Gulistan', tag: 'Nikah', categories: ['nikah'],
    design: design({ bg: '#fbe9e7', ink: '#5b1f33', accent: '#b8365c', headingFont: 'cormorant', bodyFont: 'cormorant', nameFont: 'parisienne', scene: 'gulistan', opening: 'envelope', background: 'floral', effect: 'petals', cardStyle: 'arch', photoShape: 'arch' }),
    content: { ...baseContent, eventType: 'Nikah', heading: 'In a garden of roses, two hearts become one',
      events: [ev('Nikah', '2026-12-19', '17:00', 'Lawn of the Family Home', 'F-7/2, Islamabad')] },
  },
  {
    id: 'qandeel', name: 'Qandeel', tag: 'Mehndi · Sangeet', categories: ['mehndi'],
    design: design({ bg: '#1a1c3d', ink: '#fff3df', accent: '#f2a541', headingFont: 'marcellus', bodyFont: 'poppins', nameFont: 'allura', scene: 'qandeel', opening: 'magic', background: 'plain', effect: 'stars', cardStyle: 'glass' }),
    content: { ...baseContent, eventType: 'Mehndi', heading: 'Light a lantern with us', showBismillah: false,
      events: [ev('Mehndi', '2026-12-17', '20:00', 'Rooftop, Family Residence', 'DHA Phase 2, Islamabad'), ev('Sangeet', '2026-12-18', '21:00', 'Rooftop, Family Residence', 'DHA Phase 2, Islamabad')] },
  },
  {
    id: 'genda-phool', name: 'Genda Phool', tag: 'Mehndi · Mayun', categories: ['mehndi'],
    design: design({ bg: '#1f4d2b', ink: '#fff7e0', accent: '#f5b324', headingFont: 'cinzel', bodyFont: 'poppins', nameFont: 'rouge', scene: 'genda', opening: 'curtain', background: 'paisley', effect: 'petals', cardStyle: 'double', foil: true }),
    content: { ...baseContent, eventType: 'Mehndi', heading: 'Dhol, mehndi and marigolds. Come dance with us!', showBismillah: false,
      events: [ev('Mayun', '2026-12-15', '16:00', 'Family Residence', 'G-10/4, Islamabad'), ev('Mehndi', '2026-12-17', '20:00', 'Marquee at Club Road', 'Club Road, Islamabad')] },
  },
  {
    id: 'pariyon-ka-mahal', name: 'Pariyon ka Mahal', tag: 'Engagement · Birthday', categories: ['engagement', 'birthday'],
    design: design({ bg: '#f1ecfb', ink: '#3a2c5a', accent: '#a07ad6', headingFont: 'cormorant', bodyFont: 'poppins', nameFont: 'monsieur', scene: 'castle', opening: 'storybook', background: 'plain', effect: 'sparkles', cardStyle: 'glass' }),
    content: { ...baseContent, eventType: 'Engagement', heading: 'Once upon a time, a promise was made', showBismillah: false,
      events: [ev('Mangni', '2026-11-28', '18:00', 'The Monal', 'Pir Sohawa Road, Islamabad')] },
  },
  {
    id: 'emerald-mehrab', name: 'Emerald Mehrab', tag: 'Nikah', categories: ['nikah'],
    design: design({ bg: '#0f3b2e', ink: '#f6efdc', accent: '#d4af37', nameFont: 'greatvibes', opening: 'doors', background: 'geometric', effect: 'sparkles', cardStyle: 'arch', scene: 'sheesh' }),
    content: baseContent,
  },
  {
    id: 'gulab-garden', name: 'Gulab Garden', tag: 'Mehndi', categories: ['mehndi'],
    design: design({ bg: '#fff1f1', ink: '#5a2333', accent: '#c2456b', headingFont: 'cormorant', bodyFont: 'cormorant', nameFont: 'greatvibes', opening: 'curtain', background: 'floral', effect: 'petals', cardStyle: 'double', scene: 'gulistan' }),
    content: { ...baseContent, eventType: 'Mehndi', heading: 'Join us for an evening of colour', events: [ev('Mehndi', '2026-12-18', '20:00', 'Family Residence', 'F-7/2, Islamabad')] },
  },
  {
    id: 'midnight-sitara', name: 'Midnight Sitara', tag: 'Walima', categories: ['walima'],
    design: design({ bg: '#10152e', ink: '#eef0ff', accent: '#c9b26b', headingFont: 'playfair', nameFont: 'italianno', opening: 'fade', background: 'glow', effect: 'stars', layout: 'editorial', cardStyle: 'plain', scene: 'chandni' }),
    content: { ...baseContent, eventType: 'Walima', heading: 'Walima reception', events: [ev('Walima', '2026-12-22', '19:30', 'Marriott Hotel', 'Aga Khan Road, Islamabad')] },
  },
  {
    id: 'ivory-classic', name: 'Ivory Classic', tag: 'Engagement', categories: ['engagement', 'anniversary'],
    design: design({ bg: '#fbf6ea', ink: '#3a2f1c', accent: '#b8892b', headingFont: 'playfair', bodyFont: 'cormorant', nameFont: 'petitformal', opening: 'envelope', background: 'arches', cardStyle: 'framed', foil: false }),
    content: { ...baseContent, eventType: 'Engagement', heading: 'We are getting engaged', events: [ev('Engagement', '2026-11-28', '18:00', 'The Monal', 'Pir Sohawa Road, Islamabad')] },
  },
  {
    id: 'saalgirah', name: 'Saalgirah', tag: 'Birthday', categories: ['birthday'],
    design: design({ bg: '#fff6da', ink: '#4a2c00', accent: '#e07a00', headingFont: 'poppins', nameFont: 'tangerine', opening: 'magic', effect: 'hearts', layout: 'editorial', cardStyle: 'plain', foil: false, scene: 'qandeel' }),
    content: { ...baseContent, eventType: 'Birthday', heading: 'You are invited to celebrate', message: 'Come for cake, games and fun.', showBismillah: false, showFamily: false, events: [ev('Birthday party', '2026-11-14', '16:00', 'Fun City', 'Centaurus Mall, Islamabad')] },
  },
  // ---- One or more cards for every kind of event (see lib/categories.ts)
  {
    id: 'shahi-baraat', name: 'Shahi Baraat', tag: 'Baraat · Rukhsati', categories: ['baraat'],
    design: design({ bg: '#4a0f1c', ink: '#fbeede', accent: '#e3b962', headingFont: 'cinzel', bodyFont: 'cormorant', nameFont: 'greatvibes', scene: 'sheesh', opening: 'gates', background: 'jaali', effect: 'sparkles', cardStyle: 'double', photoShape: 'arch' }),
    content: { ...baseContent, eventType: 'Baraat', heading: 'With the blessings of Allah, the baraat arrives',
      events: [ev('Baraat', '2026-12-20', '19:30', 'Marquee name', 'Address, City'), ev('Rukhsati', '2026-12-20', '23:00', 'Marquee name', 'Address, City')] },
  },
  {
    id: 'dholki-raat', name: 'Dholki Raat', tag: 'Dholki · Mayun', categories: ['mehndi'],
    design: design({ bg: '#fff6da', ink: '#4a2c00', accent: '#e07a00', headingFont: 'cinzel', bodyFont: 'poppins', nameFont: 'rouge', scene: 'genda', opening: 'curtain', background: 'paisley', effect: 'petals', cardStyle: 'double' }),
    content: { ...baseContent, eventType: 'Dholki', heading: 'Bring your voice and your clap. The dholki has begun!', showBismillah: false,
      events: [ev('Dholki', '2026-12-10', '20:00', 'Family residence', 'Address, City')] },
  },
  {
    id: 'gulabi-mangni', name: 'Gulabi Mangni', tag: 'Mangni', categories: ['engagement'],
    design: design({ bg: '#fbe9e7', ink: '#5b1f33', accent: '#b8365c', headingFont: 'playfair', bodyFont: 'cormorant', nameFont: 'parisienne', scene: 'gulistan', opening: 'envelope', background: 'floral', effect: 'hearts', cardStyle: 'arch', photoShape: 'arch' }),
    content: { ...baseContent, eventType: 'Mangni', heading: 'Two families, one promise', showBismillah: false,
      events: [ev('Mangni', '2026-11-28', '18:00', 'Venue name', 'Address, City')] },
  },
  {
    id: 'eid-milan', name: 'Eid Milan', tag: 'Eid party', categories: ['eid'],
    design: design({ bg: '#0b2a3a', ink: '#f4ecd8', accent: '#e7c46a', headingFont: 'marcellus', bodyFont: 'cormorant', nameFont: 'greatvibes', scene: 'chandni', opening: 'magic', background: 'geometric', effect: 'stars', cardStyle: 'glass' }),
    content: { ...baseContent, eventType: 'Eid Milan', heading: 'Eid Mubarak! Join us for an Eid get-together', name1: 'Eid Mubarak', hosts: 'The Khan family',
      message: 'Sheer khurma, mehndi, eidi and lots of love. Please bring the whole family.', showBismillah: false, showFamily: false,
      events: [ev('Eid Milan', '2027-03-21', '19:00', 'Our home', 'Address, City')] },
  },
  {
    id: 'chand-raat', name: 'Chand Raat', tag: 'Eid · Chand Raat', categories: ['eid'],
    design: design({ bg: '#1a1c3d', ink: '#fff3df', accent: '#f2a541', headingFont: 'marcellus', bodyFont: 'poppins', nameFont: 'allura', scene: 'qandeel', opening: 'fade', background: 'glow', effect: 'sparkles', cardStyle: 'glass' }),
    content: { ...baseContent, eventType: 'Chand Raat', heading: 'The moon is out. Come for mehndi, choorian and chaat!', name1: 'Chand Raat', showBismillah: false, showFamily: false,
      events: [ev('Chand Raat party', '2027-03-20', '20:30', 'Rooftop', 'Address, City')] },
  },
  {
    id: 'eid-ul-adha-dawat', name: 'Bakra Eid Dawat', tag: 'Eid ul Adha', categories: ['eid'],
    design: design({ bg: '#1f4d2b', ink: '#fff7e0', accent: '#f5b324', headingFont: 'cinzel', bodyFont: 'cormorant', nameFont: 'pinyon', opening: 'doors', background: 'geometric', effect: 'none', cardStyle: 'framed' }),
    content: { ...baseContent, eventType: 'Eid ul Adha', heading: 'Eid ul Adha Mubarak. Please join us for a family dawat', name1: 'Eid Dawat', showFamily: false,
      events: [ev('Eid lunch', '2027-05-28', '14:00', 'Our home', 'Address, City')] },
  },
  {
    id: 'aqeeqa-noor', name: 'Noor-e-Aqeeqa', tag: 'Aqeeqa', categories: ['aqeeqa'],
    design: design({ bg: '#eef6f1', ink: '#22433a', accent: '#4f9a7f', headingFont: 'cormorant', bodyFont: 'poppins', nameFont: 'greatvibes', opening: 'fade', background: 'arches', effect: 'stars', cardStyle: 'arch', photoShape: 'circle', foil: false }),
    content: { ...baseContent, eventType: 'Aqeeqa', heading: 'With gratitude to Allah for the gift of our little one', name1: 'Baby name',
      message: 'Please join us for the Aqeeqa of our son / daughter and make dua for them.', hosts: 'Proud parents',
      events: [ev('Aqeeqa', '2026-12-05', '13:00', 'Family residence', 'Address, City')] },
  },
  {
    id: 'nanhi-pari', name: 'Nanhi Pari', tag: 'Baby shower', categories: ['baby-shower', 'aqeeqa'],
    design: design({ bg: '#f1ecfb', ink: '#3a2c5a', accent: '#a07ad6', headingFont: 'cormorant', bodyFont: 'poppins', nameFont: 'monsieur', scene: 'castle', opening: 'storybook', effect: 'hearts', cardStyle: 'glass', foil: false }),
    content: { ...baseContent, eventType: 'Baby Shower', heading: 'A little one is on the way!', name1: 'Mom to be', showBismillah: false, showFamily: false,
      message: 'Come shower the mom-to-be with love, games and dua.', events: [ev('Baby shower', '2026-11-22', '16:00', 'Venue name', 'Address, City')] },
  },
  {
    id: 'quran-khwani', name: 'Quran Khwani', tag: 'Quran Khwani · Dua', categories: ['religious'],
    design: design({ bg: '#0f2f24', ink: '#f3ead0', accent: '#c9a54a', headingFont: 'cinzel', bodyFont: 'cormorant', nameFont: 'cormorant', opening: 'none', background: 'geometric', effect: 'none', cardStyle: 'framed', photoShape: 'none', foil: false }),
    content: { ...baseContent, eventType: 'Quran Khwani', heading: 'You are invited to a Quran Khwani and Dua-e-Khair', name1: 'Quran Khwani',
      message: 'Please join us to recite the Holy Quran and pray together.', showCountdown: false, showFamily: false,
      events: [ev('Quran Khwani', '2026-11-20', '11:00', 'Family residence', 'Address, City')] },
  },
  {
    id: 'mehfil-e-milad', name: 'Mehfil-e-Milad', tag: 'Milad', categories: ['religious'],
    design: design({ bg: '#10152e', ink: '#eef0ff', accent: '#d9c27a', headingFont: 'marcellus', bodyFont: 'cormorant', nameFont: 'cormorant', scene: 'chandni', opening: 'fade', background: 'glow', effect: 'stars', cardStyle: 'plain', photoShape: 'none' }),
    content: { ...baseContent, eventType: 'Milad', heading: 'Mehfil-e-Milad and Naat Khwani', name1: 'Mehfil-e-Milad', showFamily: false,
      message: 'Please join us for an evening of naats, salaam and dua, followed by niaz.', events: [ev('Milad', '2026-11-27', '20:00', 'Family residence', 'Address, City')] },
  },
  {
    id: 'ameen-bismillah', name: 'Ameen Mubarak', tag: 'Ameen · Bismillah', categories: ['religious'],
    design: design({ bg: '#fbf6ea', ink: '#3a2f1c', accent: '#b8892b', headingFont: 'playfair', bodyFont: 'cormorant', nameFont: 'greatvibes', opening: 'scroll', background: 'arches', effect: 'sparkles', cardStyle: 'framed' }),
    content: { ...baseContent, eventType: 'Ameen', heading: 'Alhamdulillah! Our child has completed the Holy Quran', name1: 'Child name', showFamily: false,
      message: 'Please join us for the Ameen ceremony and share our joy.', events: [ev('Ameen', '2026-12-12', '17:00', 'Family residence', 'Address, City')] },
  },
  {
    id: 'iftar-dawat', name: 'Iftar Dawat', tag: 'Iftar', categories: ['iftar'],
    design: design({ bg: '#1a1c3d', ink: '#fff3df', accent: '#f2a541', headingFont: 'marcellus', bodyFont: 'cormorant', nameFont: 'allura', scene: 'qandeel', opening: 'fade', background: 'jaali', effect: 'fireflies', cardStyle: 'glass' }),
    content: { ...baseContent, eventType: 'Iftar', heading: 'Ramadan Kareem. Please break your fast with us', name1: 'Iftar Dawat', showFamily: false,
      message: 'Iftar followed by Maghrib prayer and dinner.', events: [ev('Iftar', '2027-02-25', '18:15', 'Our home', 'Address, City')] },
  },
  {
    id: 'saath-hamesha', name: 'Saath Hamesha', tag: 'Anniversary', categories: ['anniversary'],
    design: design({ bg: '#4a0f1c', ink: '#fbeede', accent: '#e3b962', headingFont: 'playfair', bodyFont: 'cormorant', nameFont: 'italianno', opening: 'envelope', background: 'floral', effect: 'hearts', cardStyle: 'double', photoShape: 'circle' }),
    content: { ...baseContent, eventType: 'Anniversary', heading: 'Celebrating 25 years of togetherness', showBismillah: false,
      message: 'Please join us for dinner as we celebrate our silver jubilee.', events: [ev('Anniversary dinner', '2026-12-30', '20:00', 'Restaurant name', 'Address, City')] },
  },
  {
    id: 'sitaron-wali-saalgirah', name: 'Sitaron Wali Saalgirah', tag: 'Kids birthday', categories: ['birthday'],
    design: design({ bg: '#1d1446', ink: '#fff5e0', accent: '#ffb000', headingFont: 'poppins', bodyFont: 'poppins', nameFont: 'tangerine', scene: 'castle', opening: 'magic', effect: 'stars', layout: 'editorial', cardStyle: 'glass', foil: false }),
    content: { ...baseContent, eventType: 'Birthday', heading: 'Turning 5! Come to a magical party', name1: 'Child name', showBismillah: false, showFamily: false,
      message: 'Cake, magic show, games and goody bags.', events: [ev('Birthday party', '2026-11-14', '16:00', 'Venue name', 'Address, City')] },
  },
  {
    id: 'naya-ghar', name: 'Naya Ghar', tag: 'Housewarming', categories: ['housewarming'],
    design: design({ bg: '#eef2e6', ink: '#2f3b2a', accent: '#7a8f55', headingFont: 'cormorant', bodyFont: 'poppins', nameFont: 'parisienne', scene: 'genda', opening: 'doors', background: 'plain', effect: 'petals', cardStyle: 'framed', foil: false }),
    content: { ...baseContent, eventType: 'Housewarming', heading: 'Alhamdulillah, we have a new home!', name1: 'Our new home', showFamily: false,
      message: 'Please come for Quran Khwani, dua and dinner at our new place.', events: [ev('Housewarming', '2026-12-06', '19:00', 'New address', 'Street, City')] },
  },
  {
    id: 'convocation', name: 'Convocation', tag: 'Graduation', categories: ['graduation'],
    design: design({ bg: '#10152e', ink: '#eef0ff', accent: '#c9b26b', headingFont: 'playfair', bodyFont: 'poppins', nameFont: 'italianno', opening: 'fade', background: 'plain', effect: 'sparkles', layout: 'editorial', cardStyle: 'plain', foil: true }),
    content: { ...baseContent, eventType: 'Graduation', heading: 'Join us to celebrate our graduate', name1: 'Graduate name', showBismillah: false, showFamily: false,
      message: 'Dinner and celebrations after the convocation.', events: [ev('Graduation dinner', '2026-12-18', '19:30', 'Restaurant name', 'Address, City')] },
  },
  {
    id: 'corporate-gala', name: 'Gala Night', tag: 'Corporate · Dinner', categories: ['corporate'],
    design: design({ bg: '#121212', ink: '#f2f2f2', accent: '#c9a54a', headingFont: 'cinzel', bodyFont: 'poppins', nameFont: 'cinzel', opening: 'fade', background: 'plain', effect: 'none', layout: 'editorial', cardStyle: 'framed', photoShape: 'none' }),
    content: { ...baseContent, eventType: 'Corporate', heading: 'You are cordially invited to our annual dinner', name1: 'Company name', showBismillah: false, showFamily: false,
      message: 'An evening of awards, dinner and networking. Dress code: formal.', events: [ev('Annual dinner', '2026-12-15', '19:30', 'Hotel name', 'Address, City')] },
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
