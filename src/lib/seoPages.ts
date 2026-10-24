/** Landing pages people find on Google: "mehndi card online", "walima invitation" and so on. */
export type SeoPage = {
  slug: string; title: string; h1: string; description: string; intro: string
  templates: string[]; wording: string[]; tips: string[]
}

export const SEO_PAGES: SeoPage[] = [
  {
    slug: 'mehndi-card-online', title: 'Mehndi card online — animated Mehndi invitations', h1: 'Mehndi cards online',
    description: 'Make an animated Mehndi card online in minutes. Marigold torans, dhol night themes, RSVP and WhatsApp sharing. Made for Pakistani weddings.',
    intro: 'Mehndi is the most colourful night of the wedding, and the card should feel like it. Pick a marigold or lantern theme, add the dholki and mehndi functions, and send each guest their own link on WhatsApp.',
    templates: ['genda-phool', 'qandeel', 'gulab-garden'],
    wording: ['Dhol, mehndi and marigolds. Come dance with us at the Mehndi of Ayesha & Hamza.', 'Rang, khushboo aur dholki. Join the families for an evening of mehndi and music.'],
    tips: ['Add Mayun and Dholki as separate functions so guests can reply to each one.', 'Use the Genda Phool scene for a traditional yellow and green look.'],
  },
  {
    slug: 'walima-invitation-card', title: 'Walima invitation card online — elegant digital Walima cards', h1: 'Walima invitation cards',
    description: 'Elegant digital Walima cards with moonlit and palace themes, venue map, countdown and RSVP headcount for catering.',
    intro: 'A Walima card should be calm and graceful. Choose Chandni Raat for a moonlit evening or Sheesh Mahal for a palace reception, then track how many guests are coming so catering is easy.',
    templates: ['chandni-raat', 'sheesh-mahal', 'midnight-sitara'],
    wording: ['The families request the pleasure of your company at the Walima reception of Ayesha & Hamza.', 'With gratitude to Allah, please join us for the Walima dinner.'],
    tips: ['The guest list shows the food headcount for the Walima from guests’ replies.', 'Add the venue address so guests get directions in one tap.'],
  },
  {
    slug: 'nikah-card-online', title: 'Nikah card online — Islamic digital Nikah invitations', h1: 'Nikah cards online',
    description: 'Beautiful Islamic Nikah cards online with Bismillah, calligraphy names, mosque venue map and RSVP.',
    intro: 'Start with Bismillah, add the Nikah time and masjid, and let the calligraphy names and gold foil do the rest. Guests open it in any browser, no app needed.',
    templates: ['sheesh-mahal', 'gulistan', 'emerald-mehrab'],
    wording: ['In the name of Allah, the Most Gracious, the Most Merciful. We request the honour of your presence at the Nikah of Ayesha & Hamza.', 'With the blessings of Allah and our elders, please join us for the Nikah ceremony.'],
    tips: ['Turn on the Bismillah line in Details.', 'Use a mosque name and address so the map opens to the right place.'],
  },
  {
    slug: 'barat-invitation-card', title: 'Baraat invitation card — royal digital Barat cards', h1: 'Baraat invitation cards',
    description: 'Royal Baraat cards with palace gates opening, chandeliers and gold foil names. Share personal links with every guest.',
    intro: 'The Baraat deserves a grand entrance: palace gates that swing open, jhoomar lamps and the couple’s names in gold.',
    templates: ['sheesh-mahal', 'emerald-mehrab', 'chandni-raat'],
    wording: ['The family of the groom requests your presence at the Baraat of Hamza & Ayesha.', 'Join us as the Baraat arrives. Dinner will be served.'],
    tips: ['Choose the Palace gates opening for a royal reveal.', 'Invite some guests to the Baraat only; they will see just that function.'],
  },
  {
    slug: 'dholki-invitation', title: 'Dholki invitation card online', h1: 'Dholki invitations',
    description: 'Fun digital Dholki invitations with marigold and lantern themes. Send on WhatsApp and see who is coming.',
    intro: 'Dholki nights are informal and joyful. A quick card with the date, the house address and a playful line is all you need.',
    templates: ['genda-phool', 'qandeel'],
    wording: ['Dholki at our place! Bring your voice, we’ll bring the dhol.', 'Join us for a dholki night before the big day.'],
    tips: ['Add several dholki dates as separate functions.', 'Use WhatsApp reminders the day before.'],
  },
  {
    slug: 'engagement-card-online', title: 'Engagement card online — Mangni invitations', h1: 'Engagement (Mangni) cards',
    description: 'Fairy-tale engagement cards online: storybook opening, fairy castle, calligraphy names. Free to make.',
    intro: 'Once upon a time, a promise was made. Our Pariyon ka Mahal theme opens like a storybook for engagements and Baat Pakki.',
    templates: ['pariyon-ka-mahal', 'ivory-classic', 'gulistan'],
    wording: ['We are delighted to invite you to the engagement of Ayesha & Hamza.', 'Join us as two families come together for the Mangni.'],
    tips: ['Use the Storybook opening for a fairy-tale reveal.'],
  },
  {
    slug: 'aqeeqa-invitation-card', title: 'Aqeeqa invitation card online', h1: 'Aqeeqa invitations',
    description: 'Gentle digital Aqeeqa invitations with soft colours, the baby’s name and RSVP.',
    intro: 'Celebrate the new arrival with a soft, simple card. Add the baby’s name, the date and the dua.',
    templates: ['pariyon-ka-mahal', 'gulistan'],
    wording: ['Alhamdulillah! Please join us for the Aqeeqa of our son/daughter.', 'With gratitude to Allah, we invite you to the Aqeeqa ceremony.'],
    tips: ['Turn off the countdown if the date is close.'],
  },
  {
    slug: 'birthday-invitation-card', title: 'Birthday invitation card online', h1: 'Birthday invitations',
    description: 'Magical birthday invitation cards online with lanterns, sparkles and RSVP.',
    intro: 'Sky lanterns, sparkles and a fairy castle: birthday cards that kids and grown-ups love to open.',
    templates: ['qandeel', 'pariyon-ka-mahal', 'saalgirah'],
    wording: ['You are invited to celebrate! Come for cake, games and fun.', 'Join us for a magical birthday party.'],
    tips: ['Ask guests how many kids are coming with the RSVP count.'],
  },
  {
    slug: 'wedding-card-online-pakistan', title: 'Wedding card online in Pakistan — digital shadi cards', h1: 'Digital shadi cards for Pakistan',
    description: 'Make your shaadi card online: all functions in one card, personal links for every guest, RSVP and food headcount.',
    intro: 'One card for the whole wedding: Dholki, Mayun, Mehndi, Nikah, Baraat and Walima. Each guest gets their own link with only the functions they are invited to, and you see the headcount for every function.',
    templates: ['sheesh-mahal', 'genda-phool', 'chandni-raat'],
    wording: ['With the blessings of Allah and our elders, we invite you to the wedding celebrations of Ayesha & Hamza.'],
    tips: ['The Shaadi package covers Premium design and links for the whole guest list.', 'Upload your guest list from Excel.'],
  },
]

export const getSeoPage = (slug: string) => SEO_PAGES.find((p) => p.slug === slug)
