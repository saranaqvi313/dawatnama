# Dawatnama

Digital invitations for Pakistan: animated cards with RSVP, countdown, maps, a design editor and a drag-and-drop card designer.
Built with Next.js 15, Supabase (database, sign-in, photo storage), Safepay (card payments) and Three.js.

## What is inside

| Area | Where |
| --- | --- |
| Landing page, including the 3 designer templates | `src/app/page.tsx` (`#designs`) |
| Templates and live previews | `/templates`, `/preview/[template]` |
| Sign-in / sign-up with mobile number only | `/login`, `src/app/api/login`, `src/lib/phoneAccount.ts` |
| Premium page and card payments | `/premium`, `src/app/api/pay/*`, `src/lib/safepay.ts` |
| Drag-and-drop designer (Premium) | `/design/[id]`, `src/components/canvas/*` |
| Dashboard, editor, RSVP list, CSV export | `/dashboard/...` |
| Public invitation / shared card link | `/<link-name>` (e.g. `/ali-khan`; set in the Share tab), also `/i/<link-name>` |
| Database tables and security rules | `supabase/schema.sql` |

## What is free and what costs money

| Free | Share link (Rs 100 per card) | Premium (Rs 1,499 once, all cards) |
| --- | --- | --- |
| Pick a template; edit names, details, events, message, photo, family list | A link for that card to send on WhatsApp; guests open it and RSVP | Design tab: colours, fonts, artwork, opening animation, 3D effects, card style |
| Preview the card while you edit | Pay once per card from its **Share** tab; unpublish and republish freely | Drag-and-drop designer and its design templates |

Share links and Premium are separate payments. Both are enforced by the database
(`enforce_share_payment` and `enforce_premium_customisation` triggers), not only by the app,
so they cannot be bypassed with the public anon key. Only the server can unlock them, and only
after Safepay confirms the payment. Cards that were already live before share links became paid keep working.

## 1. Set up Supabase

1. Create a project at https://supabase.com (region: Mumbai or Singapore).
2. **SQL Editor** → paste the whole of `supabase/schema.sql` → **Run**. Safe to run again on an existing project.
3. **Project Settings → API**: copy the **Project URL**, the **anon public** key and the **service_role** key (keep this one secret).

### Sign-in with mobile number only

Users type their mobile number and are signed in straight away: no SMS code, no email link, no
password, and no SMS provider to set up. Nothing to configure in Supabase for this.

How it works: the server (`/api/login`) opens an internal Supabase account for each number, with a
placeholder email that is never emailed and a password derived from the number with
`SUPABASE_SERVICE_ROLE_KEY`. Keep **Authentication → Providers → Email** switched on (it is by default).
If you ever rotate the service_role key, existing users are re-synced on their next sign-in automatically.

**Important:** nothing proves the person owns the number. Anyone who types a number can open
that account, including its invitations, RSVP lists and Premium. Add an SMS code or a PIN later if that matters.

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
npm install
npm run dev
npm test                      # unit tests: phone parsing and sign-in accounts, Safepay signatures, payment rules, designer validation
```

Database security tests (on a throwaway local PostgreSQL, never your Supabase project):

```bash
psql -d scratch -f supabase/tests/supabase_stub.sql
psql -d scratch -f supabase/schema.sql
psql -d scratch -f supabase/tests/premium_gate.sql   # 37 checks; rolls back
```

## Security notes

- The anon key is public by design; every table has row-level security.
- `SUPABASE_SERVICE_ROLE_KEY` and `SAFEPAY_SECRET_KEY` are server-only secrets. Never prefix them with `NEXT_PUBLIC_`.
- Users can read their own Premium status and payments, but cannot write either. `complete_payment()` can only be called by the server.
- Designer cards are validated on save and again before display (colours, fonts, image URLs must be https, size limits).
