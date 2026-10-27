-- Tests for free mode (supabase/free_mode.sql): design, designer, guest links and card links
-- with no payment or credits. Run on a THROWAWAY local database (supabase_stub.sql + schema.sql). Rolls back.
begin;
create function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'FAIL [%]', label; end if; raise notice 'ok  %', label; end $$;
create function pg_temp.denied(stmt text, label text) returns void language plpgsql as $$
begin
  begin execute stmt; exception when others then raise notice 'ok  % (%)', label, sqlerrm; return; end;
  raise exception 'FAIL [%]: was allowed', label;
end $$;
grant execute on all functions in schema pg_temp to public;

select pg_temp.ok(public.free_mode(), 'free mode is on by default');
insert into auth.users values ('00000000-0000-0000-0000-0000000000c1'), ('00000000-0000-0000-0000-0000000000c2');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
select pg_temp.ok(public.is_premium(auth.uid()), 'everyone counts as Premium');
insert into public.invitations (id, slug, template, kind, canvas, design, content) values
  ('40000000-0000-0000-0000-000000000001', 'free-designer', 'blank', 'canvas', '{"v":1,"elements":[]}', '{}', '{"name1":"My card"}');
select pg_temp.ok(true, 'free user can create a designer card');
update public.invitations set design = '{"bg":"#000000"}' where id = '40000000-0000-0000-0000-000000000001';
select pg_temp.ok(true, 'free user can change the design');
select pg_temp.ok(public.activate_card_link('40000000-0000-0000-0000-000000000001'), 'card link unlocks with no credits');
select pg_temp.ok((select published and share_paid from public.invitations where id = '40000000-0000-0000-0000-000000000001'), 'card is live');
insert into public.guests (id, invitation_id, name, slug) values
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Ali', 'free-ali'),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Hina', 'free-hina');
select pg_temp.ok(public.activate_guest_links(array['50000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002']::uuid[]) = 2, 'two guest links go live with no credits');
select pg_temp.ok((select count(*) = 2 from public.guests where invitation_id = '40000000-0000-0000-0000-000000000001' and link_active), 'both links are live');
select pg_temp.ok(coalesce((select link_credits from public.profiles where user_id = auth.uid()), 0) = 0, 'no credits were taken');
-- What stays protected in free mode
select pg_temp.denied($$update public.guests set link_active = false where id = '50000000-0000-0000-0000-000000000001'$$, 'link state still changes only through the site');
select pg_temp.denied($$update public.invitations set share_paid = false where id = '40000000-0000-0000-0000-000000000001'$$, 'paid flag still cannot be set by hand');
update public.app_settings set value = 'false'::jsonb where key = 'free_mode';
select pg_temp.ok(public.free_mode(), 'users cannot switch free mode off');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c2';
select pg_temp.ok((select count(*) = 0 from public.guests where invitation_id = '40000000-0000-0000-0000-000000000001'), 'another user cannot see the guests');
select pg_temp.denied($$select public.activate_card_link('40000000-0000-0000-0000-000000000001')$$, 'another user cannot unlock someone else''s card');

-- Switching free mode off brings the payment rules back
reset role;
update public.app_settings set value = 'false'::jsonb where key = 'free_mode';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
select pg_temp.ok(not public.is_premium(auth.uid()), 'paid mode: not Premium without paying');
insert into public.guests (id, invitation_id, name, slug) values ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'Omar', 'free-omar');
select pg_temp.denied($$select public.activate_guest_links(array['50000000-0000-0000-0000-000000000003']::uuid[])$$, 'paid mode: guest link needs a credit');
rollback;
