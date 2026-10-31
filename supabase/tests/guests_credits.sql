-- Tests for link credits, bundles, guest links, per-event RSVP and open tracking.
-- Run on a THROWAWAY local database (with supabase_stub.sql + schema.sql), never on Supabase. Rolls back.
begin;
create function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'FAIL [%]', label; end if; raise notice 'ok  %', label; end $$;
create function pg_temp.denied(stmt text, label text) returns void language plpgsql as $$
begin
  begin execute stmt; exception when others then raise notice 'ok  % (%)', label, sqlerrm; return; end;
  raise exception 'FAIL [%]: was allowed', label;
end $$;
grant execute on all functions in schema pg_temp to public;
-- These tests check paid mode (free mode is tested in free_mode.sql).
update public.app_settings set value = 'false'::jsonb where key = 'free_mode';

insert into auth.users values ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000b2');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
insert into public.invitations (id, slug, template, content) values
  ('20000000-0000-0000-0000-000000000001', 'sara-weds-ali', 'emerald-mehrab', '{"name1":"Sara","events":[{"name":"Mehndi"},{"name":"Baraat"}]}');
insert into public.guests (id, invitation_id, name, slug, party_size, events) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Ali Khan', 'ali-khan', 3, '{Mehndi,Baraat}'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Hina', 'hina', 1, '{}'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Zara', 'zara-family', 2, '{}');
select pg_temp.ok(true, 'owner can add guests');
select pg_temp.denied($$insert into public.guests (invitation_id, name, slug) values ('20000000-0000-0000-0000-000000000001', 'X', 'sara-weds-ali')$$,
                      'guest link cannot reuse a card link name');
select pg_temp.denied($$update public.invitations set slug = 'ali-khan' where id = '20000000-0000-0000-0000-000000000001'$$,
                      'card link cannot reuse a guest link name');
select pg_temp.denied($$update public.guests set link_active = true where slug = 'hina'$$, 'owner cannot switch a guest link on directly');
select pg_temp.denied($$insert into public.guests (invitation_id, name, slug, link_active) values ('20000000-0000-0000-0000-000000000001', 'Y', 'yyy', true)$$,
                      'owner cannot insert a live guest link');
select pg_temp.denied($$select public.activate_guest_links(array['30000000-0000-0000-0000-000000000001']::uuid[])$$,
                      'no credits, no live link');
update public.profiles set link_credits = 99;
select pg_temp.ok(coalesce((select link_credits from public.profiles where user_id = auth.uid()), 0) = 0, 'cannot give yourself credits');
insert into public.guests (invitation_id, name, slug, token) values ('20000000-0000-0000-0000-000000000001', 'Picked', 'picked-code', 'aaaaaaaaaaaa');
select pg_temp.ok((select token <> 'aaaaaaaaaaaa' and token ~ '^[0-9a-f]{12}$' from public.guests where slug = 'picked-code'), 'the database makes the link code, not the owner');
select pg_temp.denied($$update public.guests set token = 'bbbbbbbbbbbb' where slug = 'picked-code'$$, 'owner cannot change a link code');
delete from public.guests where slug = 'picked-code';
reset role;
-- Known codes for the checks below (only the site itself can set them).
set local dawatnama.trusted = 'on';
update public.guests set token = 'alikhan00001' where slug = 'ali-khan';
update public.guests set token = 'hina00000002' where slug = 'hina';
update public.guests set token = 'zarafamily03' where slug = 'zara-family';
set local dawatnama.trusted = 'off';

-- Server completes a 5-link bundle and a wedding package for a1
set local role service_role;
set local request.jwt.claim.sub = '';
insert into public.payments (user_id, order_ref, method, amount_pkr, purpose, credits, product) values
  ('00000000-0000-0000-0000-0000000000a1', 'DNBUNDLE0001', 'card', 400, 'credits', 2, 'links2');
select pg_temp.ok(public.complete_payment('DNBUNDLE0001', 'T1', 'PAID'), 'bundle payment completes');
select pg_temp.ok(public.complete_payment('DNBUNDLE0001', 'T1', 'PAID'), 'bundle completes once (idempotent)');
select pg_temp.ok((select link_credits = 2 and not is_premium from public.profiles where user_id = '00000000-0000-0000-0000-0000000000a1'),
                  'credits added once, Premium not switched on');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select pg_temp.denied($$select public.activate_guest_links(array['30000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000003']::uuid[])$$,
                      'asking for 3 links with 2 credits fails (all or nothing)');
select pg_temp.ok((select count(*) = 0 from public.guests where link_active), 'no link went live after the failed attempt');
select pg_temp.ok(public.activate_guest_links(array['30000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002']::uuid[]) = 2,
                  'two credits make two guest links live');
select pg_temp.ok(public.activate_guest_links(array['30000000-0000-0000-0000-000000000001']::uuid[]) = 0, 'a live link is not charged again');
select pg_temp.ok((select link_credits = 0 from public.profiles where user_id = auth.uid()), 'credits used up');
select pg_temp.denied($$update public.guests set slug = 'ali-k' where slug = 'ali-khan'$$, 'a live guest link cannot be renamed');
update public.guests set name = 'Ali Khan Sahab', party_size = 4 where slug = 'ali-khan';
select pg_temp.ok(true, 'owner can still edit the guest name and party size');
select public.record_open('ali-khan', 'alikhan00001');
select pg_temp.ok((select open_count = 0 from public.guests where slug = 'ali-khan'), 'owner opening the link is not counted');
reset role;

-- Another user cannot spend a1's links or see a1's guests
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select pg_temp.ok((select count(*) = 0 from public.guests), 'other users cannot see guests');
select pg_temp.denied($$insert into public.guests (invitation_id, name, slug) values ('20000000-0000-0000-0000-000000000001', 'Hack', 'hack-guest')$$,
                      'cannot add guests to someone else''s card');
select pg_temp.denied($$select public.activate_card_link('20000000-0000-0000-0000-000000000001')$$, 'cannot unlock someone else''s card');
reset role;

-- ---- Guests (anon)
set local role anon;
set local request.jwt.claim.sub = '';
select pg_temp.ok((public.guest_invite('ali-khan', 'alikhan00001')->'guest'->>'name') = 'Ali Khan Sahab', 'live guest link opens the card with the guest''s name');
select pg_temp.ok(public.guest_invite('zara-family', 'zarafamily03') is null, 'guest link that is not live shows nothing');
select pg_temp.ok((public.guest_invite('ali-khan', 'alikhan00001')->'invitation') ? 'user_id' = false, 'guest view does not expose the owner id');
select pg_temp.ok(public.guest_invite('ali-khan', 'hina00000002') is null, 'another guest''s code does not open Ali''s card');
select pg_temp.ok(public.guest_invite('hina', 'alikhan00001') is null, 'putting another name in front of your code shows nothing');
select pg_temp.ok(public.guest_invite('ali-khan', 'alikhan00002') is null, 'a guessed code shows nothing');
select public.record_open('hina', 'alikhan00001');
select public.record_open('ali-khan', 'alikhan00001', 'visitor-one'); select public.record_open('ali-khan', 'alikhan00001', 'visitor-one');
select pg_temp.ok(not public.submit_guest_rsvp('ali-khan', 'hina00000002', '[{"event":"Mehndi","attending":"no"}]', ''), 'cannot reply for a guest with someone else''s code');
select pg_temp.ok(public.submit_guest_rsvp('ali-khan', 'alikhan00001', '[{"event":"Mehndi","attending":"yes","guests":9},{"event":"Baraat","attending":"no","guests":2}]', 'Mubarak!'),
                  'guest replies per event');
select pg_temp.ok(public.submit_guest_rsvp('ali-khan', 'alikhan00001', '[{"event":"Mehndi","attending":"yes","guests":2},{"event":"Baraat","attending":"maybe","guests":1}]', ''),
                  'guest can change their reply');
select pg_temp.ok(not public.submit_guest_rsvp('zara-family', 'zarafamily03', '[{"event":"Mehndi","attending":"yes"}]', ''), 'no reply through a link that is not live');
select pg_temp.ok((select count(*) = 0 from public.card_views), 'visit log is not readable by the public');
select pg_temp.denied($$insert into public.rsvps (invitation_id, guest_id, name, attending) values ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Fake', 'yes')$$,
                      'cannot post a reply as a guest directly');
select pg_temp.ok((select count(*) = 0 from public.guests), 'guests table is not readable by the public');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select pg_temp.ok((select open_count = 2 and opened_at is not null from public.guests where slug = 'ali-khan'), 'owner sees the guest opened the card twice');
select pg_temp.ok((select count(*) = 2 from public.rsvps where guest_id = '30000000-0000-0000-0000-000000000001'), 'second reply replaced the first');
select pg_temp.ok((select guests = 2 from public.rsvps where event_name = 'Mehndi'), 'party size is capped at what the host allowed');
select pg_temp.ok((select sum(guests) = 3 from public.rsvps where attending <> 'no'), 'food headcount adds up per event');
select pg_temp.ok((select open_count = 0 from public.guests where slug = 'hina'), 'a wrong code is not counted as an open');
select pg_temp.ok((select count(*) = 1 from public.card_views where guest_id = '30000000-0000-0000-0000-000000000001'), 'repeat visits within 30 minutes are logged once');
select public.rename_card_events('20000000-0000-0000-0000-000000000001', array['Mehndi'], array['Mehndi Night']);
select pg_temp.ok((select events = '{Mehndi Night,Baraat}' from public.guests where slug = 'ali-khan'), 'renamed function: guest invitations follow');
select pg_temp.ok((select count(*) = 1 from public.rsvps where event_name = 'Mehndi Night'), 'renamed function: replies follow');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select pg_temp.denied($$select public.rename_card_events('20000000-0000-0000-0000-000000000001', array['Baraat'], array['X'])$$, 'cannot rename functions on someone else''s card');
select pg_temp.ok((select count(*) = 0 from public.card_views), 'other users cannot read the visit log');
reset role;

-- Wedding package: Premium + credits; card open link uses one credit
set local role service_role;
set local request.jwt.claim.sub = '';
insert into public.payments (user_id, order_ref, method, amount_pkr, purpose, credits, product) values
  ('00000000-0000-0000-0000-0000000000a1', 'DNPACKAGE001', 'card', 3999, 'package', 5, 'shaadi');
select pg_temp.ok(public.complete_payment('DNPACKAGE001', 'T2', 'PAID'), 'package payment completes');
select pg_temp.ok((select link_credits = 5 and is_premium from public.profiles where user_id = '00000000-0000-0000-0000-0000000000a1'),
                  'package adds credits and Premium');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select pg_temp.ok(public.activate_card_link('20000000-0000-0000-0000-000000000001'), 'one credit unlocks the card''s open link');
select pg_temp.ok((select share_paid and published from public.invitations where id = '20000000-0000-0000-0000-000000000001'), 'card link is live');
select pg_temp.ok((select link_credits = 4 from public.profiles where user_id = auth.uid()), 'one credit used');
select pg_temp.ok(public.activate_card_link('20000000-0000-0000-0000-000000000001'), 'unlocking again is free');
select pg_temp.ok((select link_credits = 4 from public.profiles where user_id = auth.uid()), 'no extra credit used');
reset role;
set local role anon;
select pg_temp.denied($$select * from public.login_codes$$, 'sign-in codes are not readable by the public');
select pg_temp.denied($$select * from public.error_logs$$, 'error log is not readable by the public');
reset role;
rollback;
