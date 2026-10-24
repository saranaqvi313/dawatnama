# Dawatnama

Digital invitations for Pakistan: animated cards with RSVP, countdown, maps, a design editor and a drag-and-drop card designer.
Built with Next.js 15, Supabase (database, sign-in, photo storage), Safepay (card payments) and Three.js.
The dashboard uses the **Core 2.0 Dashboard Builder** design kit (Tailwind CSS v4, Inter Display): sidebar, header,
cards, tables, forms, pricing and settings layouts all come from the kit. The invitation cards guests open keep their
own fairy-tale styles (`src/app/card.css`).

## Project layout

| Folder | What |
| --- | --- |
| `src/app` | Pages and API routes (Dawatnama pages plus the kit's demo pages) |
| `src/components` | The kit's components (`Button`, `Card`, `Field`, `Table`, `Layout`, `Sidebar`, `Header`…) |
| `src/components/dawat` | Dawatnama's own components (editor, guest list, card rendering, designer…) |
| `src/templates`, `src/mocks` | The kit's page templates and sample data, used by the kit pages |
| `src/contstants/navigation.tsx` | Sidebar and user-menu links |
| `src/app/globals.css` | The kit's theme (colours, type, light/dark) plus spinner and designer styles |
| `src/app/card.css` | Invitation card styles (unchanged look) |

The kit's own demo pages are kept as they come in the kit, under "Kit pages" in the sidebar:
`/demo` (kit dashboard), `/demo/settings`, `/products`, `/customers`, `/shop`, `/income/*`, `/promote`, `/messages`,
`/notifications`, `/affiliate-center`, `/explore-creators`, `/upgrade-to-pro`. They show sample data only.

## What is inside

| Area | Where |
| --- | --- |
| Home, templates, designer cards, live previews | `/`, `/templates`, `/designs`, `/preview/[template]` |
| Dashboard, all invitations, guests overview, profile settings | `/dashboard`, `/invitations`, `/guests`, `/settings` |
| Sign in / sign up with mobile number + password (SMS codes switched off) | `/login`, `src/app/api/login/*`, `src/lib/passwordAuth.ts` |
| Card editor: details, functions, photos & video, design, share | `/dashboard/[id]` |
| Fairy-tale scenes and opening effects | `src/components/Scene.tsx`, `InvitationView.tsx`, `globals.css` |
| Guest list: Excel/CSV upload, personal links, WhatsApp invite/remind, QR, headcount per function | `/dashboard/[id]/guests` |
| Card links and guest links (`your-site.com/ali-khan`), WhatsApp preview image | `src/app/[slug]`, `src/lib/ogImage.tsx` |
| Plans: guest links, bundles, Shaadi package, Premium | `/premium`, `src/lib/pricing.ts`, `src/app/api/pay/*` |
| Drag-and-drop designer (Premium) | `/design/[id]` |
| Terms, privacy, refund policy, contact | `/terms`, `/privacy`, `/refund-policy`, `/contact` |
| Card idea pages for Google, sitemap | `/cards/*`, `/sitemap.xml`, `/robots.txt` |
| Admin: payments, users, cards, errors, backup download | `/admin` (numbers in `ADMIN_PHONES`) |
| Database tables, rules and tests | `supabase/schema.sql`, `supabase/tests/*` |

## What is free and what costs money

| Free | Guest links | Premium | Shaadi package |
| --- | --- | --- | --- |
| Pick a template; add names, functions, photos, video; preview; guest list | Rs 100 each, 5 for Rs 400, 20 for Rs 1,400. One link = one guest's personal link, or a card's open link | Rs 1,499 once: scenes, calligraphy, openings, colours, designer | Rs 3,999: Premium + 50 links |

All of it is enforced in the database (`enforce_share_payment`, `guard_guest`, `enforce_premium_customisation`
triggers and the `activate_*` functions), not only in the app. Only the server can add links or Premium,
and only after Safepay confirms the payment.

## 1. Set up Supabase

1. Create a project at https://supabase.com (region: Mumbai or Singapore).
2. **SQL Editor** → paste the whole of `supabase/schema.sql` → **Run**. Safe to run again on an existing project.
3. **Project Settings → API**: copy the **Project URL**, the **anon public** key and the **service_role** key (keep this one secret).

### Sign-in: mobile number + password (current)

Users sign in with their mobile number and a password (at least 10 characters with a letter, a number
and a special character). A new number creates the account with the password chosen. Accounts made
before passwords existed get the first password typed. Forgot password: `/admin` → Users → New password.
SMS codes are switched off (`OTP_ENABLED = false` in `src/lib/otp.ts`); the section below describes
how to turn them on later.

### Sign-in codes by SMS (no Twilio needed)

Every sign-in asks for a 6-digit code sent by SMS. The site sends the codes itself through
**textbee**, which uses your own Android phone and SIM as the SMS sender (free plan: 300 SMS a month).

4. Put a SIM with an SMS package in an Android phone that stays on and connected to the internet.
5. Sign up at https://textbee.dev, install the textbee app on that phone, and register the phone from the dashboard.
6. Copy the **API key** into `TEXTBEE_API_KEY` and set `OTP_PROVIDER=textbee`.
7. Keep **Authentication → Providers → Email** switched on in Supabase (it is by default). The phone
   provider and Twilio are not needed.

For testing without SMS, set `OTP_PROVIDER=demo` on a Preview deployment: the code is shown on screen.
Demo codes never work on the live (production) site.

Numbers can be typed as `0300 1234567`, `3001234567`, `+92 300 1234567` or `923001234567`.

## 2. Set up card payments (Safepay)

Customers pay with a Visa or Mastercard debit/credit card from any bank, on Safepay's secure page.
Card details never reach your server.

1. Sign up at https://getsafepay.com (Merchant sign-up). You start in **sandbox** (test mode) straight away;
   going live needs your business details (CNIC, bank account; NTN for companies) and Safepay's approval.
2. In the Safepay dashboard open **Developer** and copy:
   - the **API key** → `SAFEPAY_API_KEY`
   - the **secret key** (webhook / shared secret) → `SAFEPAY_SECRET_KEY`
3. Under **Developer → Webhooks**, add `https://YOUR-SITE/api/pay/webhook`.
   (Backup in case a customer closes the browser before returning.)
4. Test with `SAFEPAY_ENV=sandbox` and Safepay's test cards, then switch to `production` with the live keys.

How it works:

- **Pay by card** creates a Safepay payment for the price set on the server (`PREMIUM_PRICE_PKR`, or `SHARE_PRICE_PKR` for a card's link) and sends the customer to Safepay.
- After paying, Safepay sends them back to `/api/pay/card/done` with a signed confirmation.
- Premium (or the card's link) switches on only if the signature is valid **and** it is for the payment we created for that order.
- The webhook does the same check, so Premium still switches on if the customer never comes back.

**No Safepay keys yet?** Set `PAYMENT_MODE=demo` to try the whole flow with a test checkout (no money moves).
Demo mode is ignored on Vercel's production deployment, so it can never give Premium away on the live site.

## 3. Deploy on Vercel

Import the repository, then add these **Environment Variables** (all are described in `.env.example`):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (secret) |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://dawatnama.vercel.app` |
| `PREMIUM_PRICE_PKR`, `NEXT_PUBLIC_PREMIUM_PRICE_PKR` | `1499` |
| `SHARE_PRICE_PKR`, `NEXT_PUBLIC_SHARE_PRICE_PKR` | `100` |
| `OTP_PROVIDER`, `TEXTBEE_API_KEY` | `textbee`, your textbee API key |
| `ADMIN_PHONES` | your mobile number(s), comma separated |
| `NEXT_PUBLIC_BUSINESS_NAME`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_BUSINESS_ADDRESS` | shown on Contact / Terms / Refund pages |
| `PAYMENT_MODE` | `card` (or `demo` on Preview deployments) |
| `SAFEPAY_ENV` | `sandbox`, later `production` |
| `SAFEPAY_API_KEY`, `SAFEPAY_SECRET_KEY` | from Safepay → Developer |

Then in Supabase **Authentication → URL Configuration**, set **Site URL** to your Vercel address.
(Redirect URLs are not needed: sign-in uses no links.)

## The drag-and-drop designer

Open it from the home page (**Design every detail yourself** → **Customise this design**) or from a designer card in the dashboard.

- Drag items from the **Add** panel onto the card, or click to drop them in the middle.
- Drag to move, corner handles to resize (Shift keeps the shape), the top dot to rotate.
- Items snap to the centre and edges of the card; hold Alt to stop snapping.
- **Edit** panel: text, font, size, colour, alignment, spacing, photo upload, shape and ornament style.
- **Background**: colours, blend, pattern, background photo. **Layers**: order, lock, delete.
- Keyboard: arrows nudge (Shift ×10), Delete removes, Ctrl+Z / Ctrl+Y undo/redo, Ctrl+D duplicates, Ctrl+S saves.
- **Publish** → copy the link → anyone can open it in a browser at `/i/your-card`.

## Run locally

```bash
cp .env.example .env.local   # fill in the values; PAYMENT_MODE=demo to test without Safepay keys
npm install                   # .npmrc sets legacy-peer-deps (one kit package has an old peer range)
npm run dev
npm test                      # unit tests: phone parsing and sign-in accounts, Safepay signatures, payment rules, designer validation
```

Database security tests (on a throwaway local PostgreSQL, never your Supabase project):

```bash
psql -d scratch -f supabase/tests/supabase_stub.sql
psql -d scratch -f supabase/schema.sql
psql -d scratch -f supabase/tests/premium_gate.sql   # 35 checks; rolls back
psql -d scratch -f supabase/tests/guests_credits.sql # 42 checks; rolls back
```

## Security notes

- The anon key is public by design; every table has row-level security.
- `SUPABASE_SERVICE_ROLE_KEY` and `SAFEPAY_SECRET_KEY` are server-only secrets. Never prefix them with `NEXT_PUBLIC_`.
- Users can read their own Premium status and payments, but cannot write either. `complete_payment()` can only be called by the server.
- Designer cards are validated on save and again before display (colours, fonts, image URLs must be https, size limits).

## Error monitoring

Errors from visitors' browsers and from the server are saved in the `error_logs` table and listed on
`/admin` → Errors. Vercel → Logs shows the same server errors with more detail.

## Backups

- **Any time:** `/admin` → **Download backup (JSON)** saves every table (cards, guests, replies, payments, users).
- **Every week, automatically:** `.github/workflows/backup.yml` dumps the whole database, encrypts it and keeps
  it as a GitHub artifact for 90 days. Add two repository secrets first (GitHub → Settings → Secrets and
  variables → Actions): `SUPABASE_DB_URL` (Supabase → Project Settings → Database → connection string,
  "Session pooler", with your password) and `BACKUP_PASSPHRASE` (any long password; keep it safe).
