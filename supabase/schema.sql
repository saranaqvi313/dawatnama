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

-- ======================================================================================
-- Share links: each card's link costs a one-off fee (Rs 100), separate from Premium.
-- Premium unlocks design; paying for a card unlocks that card's share link.
-- Safe to run again.
-- ======================================================================================
alter table public.invitations add column if not exists share_paid boolean not null default false;
alter table public.invitations add column if not exists share_paid_at timestamptz;

-- First run only: cards that were already live before this change keep their link.
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'invitations_share_gate') then
    update public.invitations set share_paid = true, share_paid_at = coalesce(share_paid_at, now())
     where published and not share_paid;
  end if;
end $$;

-- What a payment was for: Premium for the account, or one card's share link.
alter table public.payments add column if not exists purpose text not null default 'premium';
alter table public.payments add column if not exists invitation_id uuid;
do $$ begin
  alter table public.payments add constraint payments_purpose_check check (purpose in ('premium', 'share'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.payments add constraint payments_share_has_card check (purpose = 'premium' or invitation_id is not null);
exception when duplicate_object then null; end $$;

-- Only published AND paid cards are visible to people with the link, or accept RSVPs.
drop policy if exists "public read published" on public.invitations;
create policy "public read published" on public.invitations for select to anon, authenticated
  using (published = true and share_paid = true);
drop policy if exists "guest insert rsvp" on public.rsvps;
create policy "guest insert rsvp" on public.rsvps for insert to anon, authenticated
  with check (exists (select 1 from public.invitations i where i.id = invitation_id and i.published and i.share_paid));

-- Users cannot mark a card as paid themselves, and cannot publish a card that is not paid.
create or replace function public.enforce_share_payment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    return new;  -- server-side jobs (service role) after a verified payment
  end if;
  if tg_op = 'INSERT' then
    if new.share_paid or new.share_paid_at is not null or new.published then
      raise exception 'payment_required' using errcode = 'P0001', hint = 'Pay for this card to get its share link.';
    end if;
  else
    if new.share_paid is distinct from old.share_paid or new.share_paid_at is distinct from old.share_paid_at then
      raise exception 'payment_required' using errcode = 'P0001', hint = 'Only a verified payment can unlock a share link.';
    end if;
    if new.published and not new.share_paid then
      raise exception 'payment_required' using errcode = 'P0001', hint = 'Pay for this card to get its share link.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists invitations_share_gate on public.invitations;
create trigger invitations_share_gate before insert or update on public.invitations
  for each row execute function public.enforce_share_payment();

-- Completes a verified payment once: Premium for the account, or the paid card's link (published).
create or replace function public.complete_payment(p_order_ref text, p_gateway_ref text, p_gateway_status text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_purpose text; v_card uuid;
begin
  update public.payments
     set status = 'paid', paid_at = now(), gateway_ref = p_gateway_ref, gateway_status = p_gateway_status
   where order_ref = p_order_ref and status = 'pending'
  returning user_id, purpose, invitation_id into v_user, v_purpose, v_card;
  if v_user is null then
    return exists (select 1 from public.payments where order_ref = p_order_ref and status = 'paid');
  end if;
  if v_purpose = 'share' then
    update public.invitations
       set share_paid = true, share_paid_at = coalesce(share_paid_at, now()), published = true
     where id = v_card and user_id = v_user;
  else
    insert into public.profiles (user_id, is_premium, premium_since)
         values (v_user, true, now())
    on conflict (user_id) do update set is_premium = true,
           premium_since = coalesce(public.profiles.premium_since, now()), updated_at = now();
  end if;
  return true;
end $$;
revoke all on function public.complete_payment(text, text, text) from public, anon, authenticated;
grant execute on function public.complete_payment(text, text, text) to service_role;

-- ======================================================================================
-- Sign-in codes, link credits & bundles, personal guest links, per-event RSVP,
-- open tracking and error log (added 2026-10). Safe to run again.
-- ======================================================================================

-- ---- One-time sign-in codes. Server only: RLS on and no policies, so the public keys can't read them.
create table if not exists public.login_codes (
  phone text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  sends_in_window int not null default 1,
  window_start timestamptz not null default now(),
  last_sent_at timestamptz not null default now()
);
alter table public.login_codes enable row level security;
revoke all on public.login_codes from anon, authenticated;

-- ---- Link credits: one credit = one live link (a guest's personal link or a card's open link).
alter table public.profiles add column if not exists link_credits int not null default 0;
do $$ begin
  alter table public.profiles add constraint profiles_credits_nonneg check (link_credits >= 0);
exception when duplicate_object then null; end $$;

alter table public.payments add column if not exists credits int not null default 0;
alter table public.payments add column if not exists product text;
alter table public.payments drop constraint if exists payments_purpose_check;
alter table public.payments add constraint payments_purpose_check check (purpose in ('premium', 'share', 'credits', 'package'));
alter table public.payments drop constraint if exists payments_share_has_card;
alter table public.payments add constraint payments_share_has_card check (purpose <> 'share' or invitation_id is not null);

-- Server-side switch used by the functions below to make trusted changes the triggers would block.
create or replace function public.is_trusted() returns boolean language sql stable as $$
  select auth.uid() is null or coalesce(current_setting('dawatnama.trusted', true), '') = 'on'
$$;

-- Card links: the share gate now also accepts trusted changes (link unlocked with a credit).
create or replace function public.enforce_share_payment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.is_trusted() then return new; end if;
  if tg_op = 'INSERT' then
    if new.share_paid or new.share_paid_at is not null or new.published then
      raise exception 'payment_required' using errcode = 'P0001', hint = 'Unlock this card''s link first.';
    end if;
  else
    if new.share_paid is distinct from old.share_paid or new.share_paid_at is distinct from old.share_paid_at then
      raise exception 'payment_required' using errcode = 'P0001', hint = 'Only a verified payment can unlock a link.';
    end if;
    if new.published and not new.share_paid then
      raise exception 'payment_required' using errcode = 'P0001', hint = 'Unlock this card''s link first.';
    end if;
  end if;
  return new;
end $$;

-- Completes a verified payment once: Premium, a card's link, link credits, or the wedding package.
create or replace function public.complete_payment(p_order_ref text, p_gateway_ref text, p_gateway_status text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_purpose text; v_card uuid; v_credits int;
begin
  update public.payments
     set status = 'paid', paid_at = now(), gateway_ref = p_gateway_ref, gateway_status = p_gateway_status
   where order_ref = p_order_ref and status = 'pending'
  returning user_id, purpose, invitation_id, credits into v_user, v_purpose, v_card, v_credits;
  if v_user is null then
    return exists (select 1 from public.payments where order_ref = p_order_ref and status = 'paid');
  end if;
  perform set_config('dawatnama.trusted', 'on', true);
  if v_purpose = 'share' then
    update public.invitations
       set share_paid = true, share_paid_at = coalesce(share_paid_at, now()), published = true
     where id = v_card and user_id = v_user;
  elsif v_purpose in ('credits', 'package') then
    insert into public.profiles (user_id, is_premium, premium_since, link_credits)
         values (v_user, v_purpose = 'package', case when v_purpose = 'package' then now() end, greatest(v_credits, 0))
    on conflict (user_id) do update set
         link_credits = public.profiles.link_credits + greatest(v_credits, 0),
         is_premium = public.profiles.is_premium or v_purpose = 'package',
         premium_since = case when v_purpose = 'package' then coalesce(public.profiles.premium_since, now()) else public.profiles.premium_since end,
         updated_at = now();
  else
    insert into public.profiles (user_id, is_premium, premium_since)
         values (v_user, true, now())
    on conflict (user_id) do update set is_premium = true,
           premium_since = coalesce(public.profiles.premium_since, now()), updated_at = now();
  end if;
  perform set_config('dawatnama.trusted', 'off', true);
  return true;
end $$;
revoke all on function public.complete_payment(text, text, text) from public, anon, authenticated;
grant execute on function public.complete_payment(text, text, text) to service_role;

-- ---- Personal guest links: your-site.com/ali-khan opens the card addressed to Ali Khan.
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  phone text check (phone is null or phone ~ '^\+[0-9]{8,15}$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  party_size int not null default 1 check (party_size between 1 and 50),
  events text[] not null default '{}',
  link_active boolean not null default false,
  activated_at timestamptz,
  open_count int not null default 0,
  opened_at timestamptz,
  last_opened_at timestamptz,
  reminded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists guests_invitation_idx on public.guests(invitation_id);
alter table public.guests enable row level security;
drop policy if exists "owner all guests" on public.guests;
create policy "owner all guests" on public.guests for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()));

-- Guests' link state and open counts change only through the functions below.
create or replace function public.guard_guest() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.is_trusted() then return new; end if;
  if tg_op = 'INSERT' then
    if new.link_active or new.activated_at is not null or new.open_count <> 0 or new.opened_at is not null or new.last_opened_at is not null then
      raise exception 'payment_required' using errcode = 'P0001', hint = 'Use a link credit to make a guest link live.';
    end if;
  else
    if new.link_active is distinct from old.link_active or new.activated_at is distinct from old.activated_at
       or new.open_count is distinct from old.open_count or new.opened_at is distinct from old.opened_at
       or new.last_opened_at is distinct from old.last_opened_at or new.invitation_id is distinct from old.invitation_id then
      raise exception 'not_allowed' using errcode = 'P0001', hint = 'This field is managed by the site.';
    end if;
    if old.link_active and new.slug is distinct from old.slug then
      raise exception 'link_locked' using errcode = 'P0001', hint = 'A live guest link cannot be renamed.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guests_guard on public.guests;
create trigger guests_guard before insert or update on public.guests
  for each row execute function public.guard_guest();

-- Card links and guest links share one address space (your-site.com/<name>).
create or replace function public.link_name_taken(p_slug text, p_self uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.invitations where slug = p_slug and id is distinct from p_self)
      or exists (select 1 from public.guests where slug = p_slug and id is distinct from p_self)
$$;
revoke all on function public.link_name_taken(text, uuid) from public;
grant execute on function public.link_name_taken(text, uuid) to authenticated, service_role;

create or replace function public.unique_link_name() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (tg_op = 'INSERT' or new.slug is distinct from old.slug) and public.link_name_taken(new.slug, new.id) then
    raise exception 'link_taken' using errcode = '23505', hint = 'That link name is already used.';
  end if;
  return new;
end $$;
drop trigger if exists invitations_unique_link on public.invitations;
create trigger invitations_unique_link before insert or update of slug on public.invitations
  for each row execute function public.unique_link_name();
drop trigger if exists guests_unique_link on public.guests;
create trigger guests_unique_link before insert or update of slug on public.guests
  for each row execute function public.unique_link_name();

-- Uses one credit per guest link. All-or-nothing: fails if there aren't enough credits.
create or replace function public.activate_guest_links(p_guest_ids uuid[]) returns int
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_need int; v_have int;
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;
  select count(*) into v_need from public.guests where id = any(p_guest_ids) and user_id = v_uid and not link_active;
  if v_need = 0 then return 0; end if;
  select link_credits into v_have from public.profiles where user_id = v_uid for update;
  if coalesce(v_have, 0) < v_need then
    raise exception 'not_enough_credits' using errcode = 'P0001', hint = format('Needs %s link credits, you have %s.', v_need, coalesce(v_have, 0));
  end if;
  perform set_config('dawatnama.trusted', 'on', true);
  update public.guests set link_active = true, activated_at = now()
   where id = any(p_guest_ids) and user_id = v_uid and not link_active;
  update public.profiles set link_credits = link_credits - v_need, updated_at = now() where user_id = v_uid;
  perform set_config('dawatnama.trusted', 'off', true);
  return v_need;
end $$;
revoke all on function public.activate_guest_links(uuid[]) from public, anon;
grant execute on function public.activate_guest_links(uuid[]) to authenticated;

-- Uses one credit to unlock a card's open link (anyone with it can open the card).
create or replace function public.activate_card_link(p_invitation_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_have int;
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from public.invitations where id = p_invitation_id and user_id = v_uid) then
    raise exception 'not_found';
  end if;
  if exists (select 1 from public.invitations where id = p_invitation_id and share_paid) then return true; end if;
  select link_credits into v_have from public.profiles where user_id = v_uid for update;
  if coalesce(v_have, 0) < 1 then
    raise exception 'not_enough_credits' using errcode = 'P0001', hint = 'Needs 1 link credit.';
  end if;
  perform set_config('dawatnama.trusted', 'on', true);
  update public.invitations set share_paid = true, share_paid_at = now(), published = true where id = p_invitation_id;
  update public.profiles set link_credits = link_credits - 1, updated_at = now() where user_id = v_uid;
  perform set_config('dawatnama.trusted', 'off', true);
  return true;
end $$;
revoke all on function public.activate_card_link(uuid) from public, anon;
grant execute on function public.activate_card_link(uuid) to authenticated;

-- ---- What guests see: the card plus who it is addressed to, only for live guest links.
create or replace function public.guest_invite(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'invitation', to_jsonb(i) - 'user_id',
    'guest', jsonb_build_object('id', g.id, 'name', g.name, 'party_size', g.party_size, 'events', g.events, 'slug', g.slug))
  from public.guests g join public.invitations i on i.id = g.invitation_id
  where g.slug = p_slug and g.link_active
$$;
revoke all on function public.guest_invite(text) from public;
grant execute on function public.guest_invite(text) to anon, authenticated, service_role;

-- Counts opens (the card owner's own visits are not counted).
alter table public.invitations add column if not exists open_count int not null default 0;
create or replace function public.record_open(p_slug text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('dawatnama.trusted', 'on', true);
  update public.guests set open_count = open_count + 1, opened_at = coalesce(opened_at, now()), last_opened_at = now()
   where slug = p_slug and link_active and user_id is distinct from auth.uid();
  if not found then
    update public.invitations set open_count = open_count + 1
     where slug = p_slug and published and share_paid and user_id is distinct from auth.uid();
  end if;
  perform set_config('dawatnama.trusted', 'off', true);
end $$;
revoke all on function public.record_open(text) from public;
grant execute on function public.record_open(text) to anon, authenticated;

-- ---- RSVP per event.
alter table public.rsvps add column if not exists guest_id uuid references public.guests(id) on delete cascade;
alter table public.rsvps add column if not exists event_name text check (event_name is null or char_length(event_name) <= 80);
create index if not exists rsvps_guest_idx on public.rsvps(guest_id);
drop policy if exists "guest insert rsvp" on public.rsvps;
create policy "guest insert rsvp" on public.rsvps for insert to anon, authenticated
  with check (guest_id is null and exists (select 1 from public.invitations i where i.id = invitation_id and i.published and i.share_paid));

-- A guest replies through their own link; replying again replaces the earlier reply.
create or replace function public.submit_guest_rsvp(p_slug text, p_rows jsonb, p_message text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare g public.guests; r jsonb; v_att text; v_n int;
begin
  select * into g from public.guests where slug = p_slug and link_active;
  if g.id is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 or jsonb_array_length(p_rows) > 20 then
    return false;
  end if;
  delete from public.rsvps where guest_id = g.id;
  for r in select * from jsonb_array_elements(p_rows) loop
    v_att := case when r->>'attending' in ('yes', 'no', 'maybe') then r->>'attending' else 'yes' end;
    v_n := case when v_att = 'no' then 0 else least(greatest(coalesce((r->>'guests')::int, 1), 1), g.party_size) end;
    insert into public.rsvps (invitation_id, guest_id, name, attending, guests, message, event_name)
    values (g.invitation_id, g.id, g.name, v_att, v_n, nullif(left(coalesce(p_message, ''), 500), ''), nullif(left(coalesce(r->>'event', ''), 80), ''));
  end loop;
  return true;
end $$;
revoke all on function public.submit_guest_rsvp(text, jsonb, text) from public;
grant execute on function public.submit_guest_rsvp(text, jsonb, text) to anon, authenticated;

-- ---- Error log, read on the admin page. Written by the server only.
create table if not exists public.error_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  source text not null check (char_length(source) <= 40),
  message text not null check (char_length(message) <= 1000),
  detail text check (detail is null or char_length(detail) <= 4000),
  url text check (url is null or char_length(url) <= 500),
  user_id uuid
);
create index if not exists error_logs_created_idx on public.error_logs(created_at desc);
alter table public.error_logs enable row level security;
revoke all on public.error_logs from anon, authenticated;

-- Page to return to after paying (for example the card the customer was working on).
alter table public.payments add column if not exists return_path text;
do $$ begin
  alter table public.payments add constraint payments_return_path_check check (return_path is null or (char_length(return_path) <= 200 and return_path ~ '^/[^/\\]'));
exception when duplicate_object then null; end $$;

-- Finds a free link name for each wanted name: ali-khan, ali-khan-2, ali-khan-3, …
create or replace function public.free_link_names(p_names text[]) returns text[]
language plpgsql stable security definer set search_path = '' as $$
declare v_out text[] := '{}'; v_base text; v_try text; v_n int;
begin
  if array_length(p_names, 1) > 500 then raise exception 'too_many'; end if;
  foreach v_base in array coalesce(p_names, '{}') loop
    v_try := v_base; v_n := 1;
    while public.link_name_taken(v_try, null) or v_try = any(v_out) loop
      v_n := v_n + 1; v_try := left(v_base, 54) || '-' || v_n;
    end loop;
    v_out := v_out || v_try;
  end loop;
  return v_out;
end $$;
revoke all on function public.free_link_names(text[]) from public, anon;
grant execute on function public.free_link_names(text[]) to authenticated, service_role;


-- ======================================================================================
-- Free mode: everything is free (design tools, the designer, guest links, card links).
-- (Same as supabase/free_mode.sql.) Safe to run again.
-- To start charging again later:  update public.app_settings set value = 'false' where key = 'free_mode';
-- (and set NEXT_PUBLIC_FREE_MODE=off in Vercel).
-- ======================================================================================

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
-- No policies: only the database's own functions (and the service role) read or change it.
alter table public.app_settings enable row level security;
insert into public.app_settings (key, value) values ('free_mode', 'true'::jsonb) on conflict (key) do nothing;

create or replace function public.free_mode() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select s.value = 'true'::jsonb from public.app_settings s where s.key = 'free_mode'), false)
$$;
revoke all on function public.free_mode() from public;
grant execute on function public.free_mode() to anon, authenticated, service_role;

-- Everyone counts as Premium while free mode is on (design, designer, animations).
create or replace function public.is_premium(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.free_mode() or coalesce((select p.is_premium from public.profiles p where p.user_id = uid), false)
$$;
revoke all on function public.is_premium(uuid) from public;
grant execute on function public.is_premium(uuid) to authenticated, service_role;

-- Guest links: no credits needed while free mode is on.
create or replace function public.activate_guest_links(p_guest_ids uuid[]) returns int
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_need int; v_have int; v_free boolean := public.free_mode();
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;
  select count(*) into v_need from public.guests where id = any(p_guest_ids) and user_id = v_uid and not link_active;
  if v_need = 0 then return 0; end if;
  if not v_free then
    select link_credits into v_have from public.profiles where user_id = v_uid for update;
    if coalesce(v_have, 0) < v_need then
      raise exception 'not_enough_credits' using errcode = 'P0001', hint = format('Needs %s link credits, you have %s.', v_need, coalesce(v_have, 0));
    end if;
  end if;
  perform set_config('dawatnama.trusted', 'on', true);
  update public.guests set link_active = true, activated_at = now()
   where id = any(p_guest_ids) and user_id = v_uid and not link_active;
  if not v_free then
    update public.profiles set link_credits = link_credits - v_need, updated_at = now() where user_id = v_uid;
  end if;
  perform set_config('dawatnama.trusted', 'off', true);
  return v_need;
end $$;
revoke all on function public.activate_guest_links(uuid[]) from public, anon;
grant execute on function public.activate_guest_links(uuid[]) to authenticated;

-- A card's open link: free while free mode is on.
create or replace function public.activate_card_link(p_invitation_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_have int; v_free boolean := public.free_mode();
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from public.invitations where id = p_invitation_id and user_id = v_uid) then
    raise exception 'not_found';
  end if;
  if exists (select 1 from public.invitations where id = p_invitation_id and share_paid) then return true; end if;
  if not v_free then
    select link_credits into v_have from public.profiles where user_id = v_uid for update;
    if coalesce(v_have, 0) < 1 then
      raise exception 'not_enough_credits' using errcode = 'P0001', hint = 'Needs 1 link credit.';
    end if;
  end if;
  perform set_config('dawatnama.trusted', 'on', true);
  update public.invitations set share_paid = true, share_paid_at = now(), published = true where id = p_invitation_id;
  if not v_free then
    update public.profiles set link_credits = link_credits - 1, updated_at = now() where user_id = v_uid;
  end if;
  perform set_config('dawatnama.trusted', 'off', true);
  return true;
end $$;
revoke all on function public.activate_card_link(uuid) from public, anon;
grant execute on function public.activate_card_link(uuid) to authenticated;
