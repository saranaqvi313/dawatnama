import type { Lang } from './types'
import { PRICE_LABEL, SHARE_PRICE_LABEL } from './pricing'

export const dict = {
  en: {
    brand: 'Dawatnama', templates: 'Templates', how: 'How it works', faq: 'FAQ', signin: 'Sign in', dashboard: 'My invitations', signout: 'Log out',
    heroTitle: 'Invitations your guests will open twice', heroSub: 'Animated digital shadi cards and event invitations with RSVP, maps and countdown. Start free, design it your way with Premium, share one link on WhatsApp.',
    ctaCreate: 'Create my invitation', ctaLive: 'See a live card',
    whyKicker: 'Why Dawatnama', whyTitle: 'More than a printed card can do',
    features: [
      ['Opens like a real invitation', 'Doors, envelopes and curtains that open on tap, with petals, sparkles and stars in motion.'],
      ['Design it yourself (Premium)', 'Drag and drop text, photos and ornaments, or change colours, fonts, artwork and animations, with a live preview.'],
      ['RSVP built in', 'Guests confirm on the card. See who is coming and how many, and export the list.'],
      ['Edit after sharing', 'Time or venue changed? Update it once; the same link updates for everyone.'],
      ['Directions, countdown, calendar', 'One tap to Google Maps, a live countdown, and add-to-calendar.'],
      ['One link, unlimited guests', 'Send it to 50 people or 5,000. No printing, no courier, no per-guest cost.'],
    ],
    tplKicker: 'Templates', tplTitle: 'Choose a starting point', tplSub: 'Every template is fully customisable after you pick it.', preview: 'Preview', use: 'Use template',
    howTitle: 'Three steps',
    steps: [['Choose a template', 'Preview any design. Sign in with your mobile number and a text code.'], ['Add details and design', 'Names, events, venues, family list. Then make the card your own.'], ['Get your link and share', 'Get your card\'s link for ' + SHARE_PRICE_LABEL + ', send it on WhatsApp and watch the RSVPs come in.']],
    faqTitle: 'Questions',
    faqs: [['What does it cost?', 'Creating a card and adding your details and events is free. Each card\'s share link is ' + SHARE_PRICE_LABEL + ', paid once per card. Customising the design (colours, fonts, animations and the drag-and-drop designer) is Premium: a one-time ' + PRICE_LABEL + ' that unlocks it for all your cards. The two are separate.'], ['How can I pay?', 'With any Visa or Mastercard debit or credit card, from any bank, on a secure payment page. Premium or your link switches on as soon as the payment is confirmed.'], ['Can I change details after publishing?', 'Yes. Edit from your dashboard; the same link updates instantly.'], ['How do guests RSVP?', 'At the bottom of the card they enter their name and attendance. You see it in your dashboard and can export a CSV.'], ['Do guests need an app?', 'No. The link opens in any browser on any phone.']],
    finalTitle: 'Your celebration starts with the invitation.', footer: 'Made in Pakistan',
    loginTitle: 'Sign in or sign up', loginSub: 'Enter your mobile number. We will text you a code to sign in. No password needed.',
    myInvites: 'My invitations', newInvite: 'New invitation', empty: 'You have no invitations yet. Pick a template to begin.', edit: 'Edit', guests: 'RSVPs', view: 'View', live: 'Live', draft: 'Draft', del: 'Delete',
  },
}

export type Dict = typeof dict.en

/** Labels shown on the invitation card itself (follows the card's language). */
export const cardText = {
  en: { bismillah: 'In the name of Allah, the Most Gracious, the Most Merciful', open: 'Tap to open', and: '&', invite: 'request the pleasure of your company', schedule: 'Events', directions: 'Directions', calendar: 'Add to calendar', countdown: 'Counting down', days: 'Days', hours: 'Hours', mins: 'Minutes', secs: 'Seconds', family: 'Awaiting your arrival', rsvp: 'Will you join us?', name: 'Your name', yes: 'Yes, coming', no: 'Sorry, cannot', maybe: 'Maybe', guests: 'Number of guests', note: 'A message (optional)', send: 'Send RSVP', thanks: 'Thank you! Your reply has been sent.', error: 'Could not send. Please try again.', demo: 'RSVP opens once this invitation is published.', made: 'Made with Dawatnama · make your own' },
}

export function asLang(_v?: string | null): Lang {
  return 'en'
}
