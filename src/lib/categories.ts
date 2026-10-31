/** Every kind of event a card can be for. Templates list the categories they suit; the gallery filters by them. */
export const CATEGORIES = [
  { id: 'nikah', name: 'Nikah', note: 'Nikah ceremony cards' },
  { id: 'baraat', name: 'Baraat & Shaadi', note: 'Baraat, Rukhsati and full wedding cards' },
  { id: 'walima', name: 'Walima', note: 'Walima and reception cards' },
  { id: 'mehndi', name: 'Mehndi, Mayun & Dholki', note: 'Mehndi, Mayun, Ubtan, Dholki and Sangeet' },
  { id: 'engagement', name: 'Mangni & Engagement', note: 'Mangni, Baat Pakki and engagement cards' },
  { id: 'birthday', name: 'Birthday', note: 'Birthday and Saalgirah cards for kids and grown-ups' },
  { id: 'eid', name: 'Eid party', note: 'Eid Milan, Eid ul Adha dawat and Chand Raat' },
  { id: 'aqeeqa', name: 'Aqeeqa & new baby', note: 'Aqeeqa and welcoming a new baby' },
  { id: 'baby-shower', name: 'Baby shower', note: 'Baby shower and godh bharai' },
  { id: 'religious', name: 'Quran Khwani, Milad & Ameen', note: 'Quran Khwani, Milad, Dua-e-Khair, Ameen and Bismillah' },
  { id: 'iftar', name: 'Iftar & Ramadan', note: 'Iftar dawat and Ramadan gatherings' },
  { id: 'anniversary', name: 'Anniversary', note: 'Wedding anniversaries' },
  { id: 'housewarming', name: 'Housewarming', note: 'New home, naya ghar' },
  { id: 'graduation', name: 'Graduation', note: 'Graduation and convocation' },
  { id: 'corporate', name: 'Corporate & dinner', note: 'Office events, launches and dinners' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export const isCategory = (v: unknown): v is CategoryId => CATEGORIES.some((c) => c.id === v)
export const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id)
