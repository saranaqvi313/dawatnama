# Dawatnama

Digital invitations for Pakistan: animated cards with RSVP, countdown, maps and a design editor.
Built with Next.js 15, Supabase (database, sign-in, photo storage) and Three.js.

## What is inside

| Area | Where |
| --- | --- |
| Landing page | `src/app/page.tsx` |
| Templates and live previews | `/templates`, `/preview/[template]` |
| Email magic-link sign-in | `/login`, `/auth/callback` |
| Dashboard, editor, RSVP list, CSV export | `/dashboard/...` |
| Public invitation | `/i/[slug]` |
| Database tables and security rules | `supabase/schema.sql` |

## 1. Set up Supabase (about 5 minutes)

1. Create a free account at https://supabase.com and click **New project**. Pick the region closest to Pakistan (Mumbai or Singapore).
2. Open **SQL Editor**, paste the whole of `supabase/schema.sql`, press **Run**.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.

## 2. Deploy on Vercel

1. Put this folder in a GitHub repository.
2. At https://vercel.com choose **Add New → Project** and import the repository.
3. Before pressing Deploy, open **Environment Variables** and add:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key from Supabase |
| `NEXT_PUBLIC_SITE_URL` | your Vercel address, e.g. `https://dawatnama.vercel.app` |

4. Press **Deploy**.

## 3. Tell Supabase your live address (needed for sign-in)

In Supabase open **Authentication → URL Configuration**:

- **Site URL**: your Vercel address
- **Redirect URLs**: add `https://YOUR-APP.vercel.app/auth/callback` (and `http://localhost:3000/auth/callback` for local work)

Supabase's built-in email sender only sends a few sign-in emails per hour. Before real users arrive, add your own SMTP provider (for example Resend) under **Authentication → Emails → SMTP Settings**.

## Run locally

```bash
cp .env.example .env.local   # then fill in the three values
npm install
npm run dev
```

## Security notes

- Only the anon key is used; it is safe in the browser because every table has row-level security.
- Owners can only see and edit their own invitations and RSVPs. Guests can only read published invitations and add an RSVP.
