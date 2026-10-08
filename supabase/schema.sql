-- Dawatnama database. Paste this whole file into Supabase → SQL Editor → Run.

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  slug text not null unique,
  template text not null,
  content jsonb not null default '{}'::jsonb,
  design jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invitations_user_idx on public.invitations(user_id);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  attending text not null check (attending in ('yes','no','maybe')),
  guests int not null default 1 check (guests between 0 and 20),
  message text check (message is null or char_length(message) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists rsvps_invitation_idx on public.rsvps(invitation_id);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists invitations_touch on public.invitations;
create trigger invitations_touch before update on public.invitations
  for each row execute function public.touch_updated_at();

alter table public.invitations enable row level security;
alter table public.rsvps enable row level security;

-- Owners manage their own invitations
drop policy if exists "owner all" on public.invitations;
create policy "owner all" on public.invitations for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Anyone with the link can read a published invitation
drop policy if exists "public read published" on public.invitations;
create policy "public read published" on public.invitations for select to anon, authenticated
  using (published = true);

-- Guests can RSVP to published invitations only
drop policy if exists "guest insert rsvp" on public.rsvps;
create policy "guest insert rsvp" on public.rsvps for insert to anon, authenticated
  with check (exists (select 1 from public.invitations i where i.id = invitation_id and i.published));
-- Only the invitation owner can see or delete RSVPs
drop policy if exists "owner read rsvps" on public.rsvps;
create policy "owner read rsvps" on public.rsvps for select to authenticated
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()));
drop policy if exists "owner delete rsvps" on public.rsvps;
create policy "owner delete rsvps" on public.rsvps for delete to authenticated
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()));

-- Photo uploads (public bucket, each user writes only inside a folder named after their user id)
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
  on conflict (id) do nothing;
drop policy if exists "photos public read" on storage.objects;
create policy "photos public read" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "photos owner write" on storage.objects;
create policy "photos owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "photos owner delete" on storage.objects;
create policy "photos owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
