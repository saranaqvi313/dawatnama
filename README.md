# Dawatnama

Digital invitations for Pakistan: animated cards with RSVP, countdown, maps, a design editor and a drag-and-drop card designer.
Built with Next.js 15, Supabase (database, sign-in, photo storage), Safepay (card payments) and Three.js.

## What is inside

| Area | Where |
| --- | --- |
| Landing page, including the 3 designer templates | `src/app/page.tsx` (`#designs`) |
| Templates and live previews | `/templates`, `/preview/[template]` |
| Sign-in with a one-time code (phone or email, no links) | `/login` → `/login/verify` |
| Premium page and card payments | `/premium`, `src/app/api/pay/*`, `src/lib/safepay.ts` |
| Drag-and-drop designer (Premium) | `/design/[id]`, `src/components/canvas/*` |
| Dashboard, editor, RSVP list, CSV export | `/dashboard/...` |
| Public invitation / shared card link | `/i/[slug]` |
| Database tables and security rules | `supabase/schema.sql` |

## What is free and what is Premium

| Free | Premium (one payment, all cards) |
| --- | --- |
| Pick a template, edit names, events, message, photo, family list | Design tab: colours, fonts, artwork, opening animation, 3D effects, card style |
| Publish and share the link, collect RSVPs | Drag-and-drop designer and its design templates |

Premium is enforced by the database (`enforce_premium_customisation` trigger), not only by the app,
so it cannot be bypassed with the public anon key. Only the server can switch Premium on, and only
after Safepay confirms the payment.

## 1. Set up Supabase

1. Create a project at https://supabase.com (region: Mumbai or Singapore).
2. **SQL Editor** → paste the whole of `supabase/schema.sql` → **Run**. Safe to run again on an existing project.
3. **Project Settings → API**: copy the **Project URL**, the **anon public** key and the **service_role** key (keep this one secret).

### Sign-in with a code, not a link

4. **Authentication → Emails → Templates → Magic Link**: replace the body with the code only, for example:

   ```html
   <h2>Your Dawatnama code</h2>
   <p>Enter this code to sign in: <strong>{{ .Token }}</strong></p>
   <p>It expires in 1 hour. If you didn't ask for it, ignore this email.</p>
   ```

   Do the same for **Confirm signup** (first-time users get that template). Without this step Supabase also puts a link in the email.
5. **Authentication → Emails → SMTP Settings**: add your own sender (for example Resend). The built-in sender only allows a few emails per hour.

### Phone numbers (optional)

Supabase supports phone sign-in, but it sends SMS through a provider you pay for. Twilio is the usual choice for Pakistani numbers.

6. **Authentication → Providers → Phone**: enable it, choose **Twilio** (or Twilio Verify / MessageBird / Vonage) and enter its credentials.
7. Set `NEXT_PUBLIC_PHONE_LOGIN=on`. Until you do, the sign-in screen asks for email only.

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

- **Pay by card** creates a Safepay payment for the price set on the server (`PREMIUM_PRICE_PKR`) and sends the customer to Safepay.
- After paying, Safepay sends them back to `/api/pay/card/done` with a signed confirmation.
- Premium switches on only if the signature is valid **and** it is for the payment we created for that order.
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
| `NEXT_PUBLIC_PHONE_LOGIN` | `on` once SMS is set up, otherwise `off` |
| `PREMIUM_PRICE_PKR`, `NEXT_PUBLIC_PREMIUM_PRICE_PKR` | `1499` |
| `PAYMENT_MODE` | `card` (or `demo` on Preview deployments) |
| `SAFEPAY_ENV` | `sandbox`, later `production` |
| `SAFEPAY_API_KEY`, `SAFEPAY_SECRET_KEY` | from Safepay → Developer |

Then in Supabase **Authentication → URL Configuration**, set **Site URL** to your Vercel address.
(Redirect URLs are no longer needed: sign-in uses codes, not links.)

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
npm test                      # unit tests: phone parsing, Safepay signatures, payment rules, designer validation
```

Database security tests (on a throwaway local PostgreSQL, never your Supabase project):

```bash
psql -d scratch -f supabase/tests/supabase_stub.sql
psql -d scratch -f supabase/schema.sql
psql -d scratch -f supabase/tests/premium_gate.sql   # 22 checks; rolls back
```

## Security notes

- The anon key is public by design; every table has row-level security.
- `SUPABASE_SERVICE_ROLE_KEY` and `SAFEPAY_SECRET_KEY` are server-only secrets. Never prefix them with `NEXT_PUBLIC_`.
- Users can read their own Premium status and payments, but cannot write either. `complete_payment()` can only be called by the server.
- Designer cards are validated on save and again before display (colours, fonts, image URLs must be https, size limits).
