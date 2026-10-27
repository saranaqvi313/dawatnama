-- ======================================================================================
-- Free mode: everything is free (design tools, the designer, guest links, card links).
-- Run this once in Supabase → SQL editor. Safe to run again.
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
