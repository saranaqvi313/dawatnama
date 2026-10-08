import type { Lang } from './types'

export const dict = {
  en: {
    brand: 'Dawatnama', templates: 'Templates', how: 'How it works', faq: 'FAQ', signin: 'Sign in', dashboard: 'My invitations', signout: 'Sign out',
    heroTitle: 'Invitations your guests will open twice', heroSub: 'Animated digital shadi cards and event invitations with RSVP, maps and countdown. Design it your way, share one link on WhatsApp. Free.',
    ctaCreate: 'Create my invitation', ctaLive: 'See a live card',
    whyKicker: 'Why Dawatnama', whyTitle: 'More than a printed card can do',
    features: [
      ['Opens like a real invitation', 'Doors, envelopes and curtains that open on tap, with petals, sparkles and stars in motion.'],
      ['Design it yourself', 'Change colours, fonts, artwork, opening animation, effects and card style, with a live phone preview.'],
      ['RSVP built in', 'Guests confirm on the card. See who is coming and how many, and export the list.'],
      ['Edit after sharing', 'Time or venue changed? Update it once; the same link updates for everyone.'],
      ['Directions, countdown, calendar', 'One tap to Google Maps, a live countdown, and add-to-calendar.'],
      ['One link, unlimited guests', 'Send it to 50 people or 5,000. No printing, no courier, no per-guest cost.'],
    ],
    tplKicker: 'Templates', tplTitle: 'Choose a starting point', tplSub: 'Every template is fully customisable after you pick it.', preview: 'Preview', use: 'Use template',
    howTitle: 'Three steps',
    steps: [['Choose a template', 'Preview any design. Sign in with just your email, no password.'], ['Add details and design', 'Names, events, venues, family list. Then make the card your own.'], ['Publish and share', 'Get your link, send it on WhatsApp and watch the RSVPs come in.']],
    faqTitle: 'Questions',
    faqs: [['Is it free?', 'Yes. Creating, publishing and sharing invitations is free.'], ['Can I change details after publishing?', 'Yes. Edit from your dashboard; the same link updates instantly.'], ['How do guests RSVP?', 'At the bottom of the card they enter their name and attendance. You see it in your dashboard and can export a CSV.'], ['Do guests need an app?', 'No. The link opens in any browser on any phone.']],
    finalTitle: 'Your celebration starts with the invitation.', footer: 'Made in Pakistan',
    loginTitle: 'Sign in', loginSub: 'Enter your email and we will send you a sign-in link. No password needed.', email: 'Email address', sendLink: 'Send me the link', linkSent: 'Check your inbox. The sign-in link is on its way.',
    myInvites: 'My invitations', newInvite: 'New invitation', empty: 'You have no invitations yet. Pick a template to begin.', edit: 'Edit', guests: 'RSVPs', view: 'View', live: 'Live', draft: 'Draft', del: 'Delete',
  },
}

export type Dict = typeof dict.en

/** Labels shown on the invitation card itself (follows the card's language). */
export const cardText = {
  en: { bismillah: 'In the name of Allah, the Most Gracious, the Most Merciful', open: 'Tap to open', and: '&', invite: 'request the pleasure of your company', schedule: 'Events', directions: 'Directions', calendar: 'Add to calendar', countdown: 'Counting down', days: 'Days', hours: 'Hours', mins: 'Minutes', secs: 'Seconds', family: 'Awaiting your arrival', rsvp: 'Will you join us?', name: 'Your name', yes: 'Yes, coming', no: 'Sorry, cannot', maybe: 'Maybe', guests: 'Number of guests', note: 'A message (optional)', send: 'Send RSVP', thanks: 'Thank you! Your reply has been sent.', error: 'Could not send. Please try again.', demo: 'RSVP opens once this invitation is published.', made: 'Made with Dawatnama' },
}

export function asLang(_v?: string | null): Lang {
  return 'en'
}
