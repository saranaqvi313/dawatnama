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

-- ======================================================================================
-- Premium, payments and the drag-and-drop designer (added 2026-10).
-- Safe to run again on an existing project: everything below is idempotent.
-- ======================================================================================

-- Designer cards: an invitation is either a 'classic' template card or a free-form
-- 'canvas' card built in the drag-and-drop designer.
alter table public.invitations add column if not exists kind text not null default 'classic';
alter table public.invitations add column if not exists canvas jsonb;
do $$ begin
  alter table public.invitations add constraint invitations_kind_check check (kind in ('classic', 'canvas'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.invitations add constraint invitations_canvas_size check (canvas is null or octet_length(canvas::text) <= 200000);
exception when duplicate_object then null; end $$;

-- One row per user who has paid. Users can read their own row; only the server
-- (service role, after the payment is verified with Safepay) can write it.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_premium boolean not null default false,
  premium_since timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (user_id = auth.uid());

-- Every payment attempt. Written only by the server.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_ref text not null unique check (order_ref ~ '^[A-Za-z0-9]{6,30}$'),
  method text not null check (method in ('card', 'demo')),
  amount_pkr int not null check (amount_pkr > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  gateway_ref text,
  gateway_status text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_user_idx on public.payments(user_id, created_at desc);
-- Webhooks look payments up by the gateway's tracker token.
create unique index if not exists payments_gateway_ref_idx on public.payments(gateway_ref) where gateway_ref is not null;
alter table public.payments enable row level security;
drop policy if exists "read own payments" on public.payments;
create policy "read own payments" on public.payments for select to authenticated using (user_id = auth.uid());

create or replace function public.is_premium(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_premium from public.profiles p where p.user_id = uid), false)
$$;
revoke all on function public.is_premium(uuid) from public;
grant execute on function public.is_premium(uuid) to authenticated, service_role;

-- Marks a verified payment as paid and switches Premium on, atomically and only once.
-- Called by the server after Safepay confirms the transaction.
create or replace function public.complete_payment(p_order_ref text, p_gateway_ref text, p_gateway_status text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  update public.payments
     set status = 'paid', paid_at = now(), gateway_ref = p_gateway_ref, gateway_status = p_gateway_status
   where order_ref = p_order_ref and status = 'pending'
  returning user_id into v_user;
  if v_user is null then
    return exists (select 1 from public.payments where order_ref = p_order_ref and status = 'paid');
  end if;
  insert into public.profiles (user_id, is_premium, premium_since)
       values (v_user, true, now())
  on conflict (user_id) do update set is_premium = true,
         premium_since = coalesce(public.profiles.premium_since, now()), updated_at = now();
  return true;
end $$;
revoke all on function public.complete_payment(text, text, text) from public, anon, authenticated;
grant execute on function public.complete_payment(text, text, text) to service_role;

-- Customisation is Premium. Enforced here, so it cannot be bypassed by calling the
-- database directly with the public anon key:
--   * non-Premium users create cards with the template's default design ('{}') and no canvas;
--   * non-Premium users cannot change design or canvas afterwards.
-- Text, events, photos and publishing stay free.
create or replace function public.enforce_premium_customisation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_premium(auth.uid()) then
    return new;  -- server-side jobs (service role) and Premium users
  end if;
  if tg_op = 'INSERT' then
    if new.design <> '{}'::jsonb or new.canvas is not null or new.kind <> 'classic' then
      raise exception 'premium_required' using errcode = 'P0001',
        hint = 'Customising the design is a Premium feature.';
    end if;
  elsif new.design is distinct from old.design or new.canvas is distinct from old.canvas or new.kind is distinct from old.kind then
    raise exception 'premium_required' using errcode = 'P0001',
      hint = 'Customising the design is a Premium feature.';
  end if;
  return new;
end $$;
drop trigger if exists invitations_premium_gate on public.invitations;
create trigger invitations_premium_gate before insert or update on public.invitations
  for each row execute function public.enforce_premium_customisation();
