-- Tests for the Premium gate and payments. Run against a THROWAWAY database that has
-- Supabase's auth schema (or the stub in supabase/tests/supabase_stub.sql) and schema.sql.
-- Everything is rolled back.
begin;
create function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'FAIL [%]', label; end if; raise notice 'ok  %', label; end $$;
create function pg_temp.denied(stmt text, label text) returns void language plpgsql as $$
begin
  begin execute stmt; exception when others then raise notice 'ok  % (%)', label, sqlerrm; return; end;
  raise exception 'FAIL [%]: was allowed', label;
end $$;
grant execute on all functions in schema pg_temp to public;

insert into auth.users values ('00000000-0000-0000-0000-0000000000f1'), ('00000000-0000-0000-0000-0000000000f2');

-- ---- As a FREE user (f1) ----
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';

insert into public.invitations (id, slug, template, content) values
  ('10000000-0000-0000-0000-000000000001', 'free-card', 'emerald-mehrab', '{"name1":"A"}');
select pg_temp.ok(true, 'free user can create a template card');
update public.invitations set content = '{"name1":"B"}', published = true where id = '10000000-0000-0000-0000-000000000001';
select pg_temp.ok((select content->>'name1' = 'B' from public.invitations where id = '10000000-0000-0000-0000-000000000001'),
                  'free user can edit text and publish');
select pg_temp.denied($$update public.invitations set design = '{"bg":"#000"}' where id = '10000000-0000-0000-0000-000000000001'$$,
                      'free user cannot change the design');
select pg_temp.denied($$insert into public.invitations (slug, template, design) values ('x1', 'emerald-mehrab', '{"bg":"#000"}')$$,
                      'free user cannot insert a custom design');
select pg_temp.denied($$insert into public.invitations (slug, template, kind, canvas) values ('x2', 'canvas', 'canvas', '{"elements":[]}')$$,
                      'free user cannot create a designer card');
update public.profiles set is_premium = true;  -- no UPDATE policy: silently matches zero rows
select pg_temp.ok(not public.is_premium('00000000-0000-0000-0000-0000000000f1'), 'free user cannot make themselves Premium (update)');
select pg_temp.denied($$insert into public.profiles (user_id, is_premium) values ('00000000-0000-0000-0000-0000000000f1', true)$$,
                      'free user cannot make themselves Premium (insert)');
select pg_temp.denied($$insert into public.payments (user_id, order_ref, method, amount_pkr, status) values ('00000000-0000-0000-0000-0000000000f1', 'FAKE123456', 'card', 1, 'paid')$$,
                      'free user cannot write a payment');
select pg_temp.denied($$select public.complete_payment('ANY123456', 'x', 'PAID')$$,
                      'free user cannot call complete_payment');
reset role;

-- ---- Server (service role) records a pending payment, then completes it ----
set local role service_role;
insert into public.payments (user_id, order_ref, method, amount_pkr) values
  ('00000000-0000-0000-0000-0000000000f1', 'DN1234567890', 'card', 1499);
select pg_temp.ok(public.complete_payment('DN1234567890', 'TXN1', 'PAID'), 'service role completes a pending payment');
select pg_temp.ok(public.complete_payment('DN1234567890', 'TXN1', 'PAID'), 'completing twice is harmless (idempotent)');
select pg_temp.ok(not public.complete_payment('NOPE12345678', 'x', 'PAID'), 'unknown order does not grant Premium');
select pg_temp.ok((select count(*) = 1 from public.profiles where is_premium), 'exactly one Premium profile');
reset role;

-- ---- Now f1 is PREMIUM ----
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
update public.invitations set design = '{"bg":"#000"}' where id = '10000000-0000-0000-0000-000000000001';
select pg_temp.ok((select design->>'bg' = '#000' from public.invitations where id = '10000000-0000-0000-0000-000000000001'),
                  'Premium user can change the design');
insert into public.invitations (slug, template, kind, canvas) values ('canvas-1', 'canvas', 'canvas', '{"elements":[]}');
select pg_temp.ok(true, 'Premium user can create a designer card');
select pg_temp.ok((select count(*) = 1 from public.payments), 'user sees own payment');

-- ---- Another free user (f2) sees nothing of f1 ----
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f2';
select pg_temp.ok((select count(*) = 0 from public.payments), 'other users cannot see payments');
select pg_temp.ok((select count(*) = 0 from public.profiles), 'other users cannot see profiles');
select pg_temp.ok(not public.is_premium('00000000-0000-0000-0000-0000000000f2'), 'f2 is not Premium');
update public.invitations set content = '{}' where id = '10000000-0000-0000-0000-000000000001';
select pg_temp.ok((select content->>'name1' = 'B' from public.invitations where id = '10000000-0000-0000-0000-000000000001'),
                  'other users cannot edit someone else''s card');

-- ---- Guests (anon) ----
set local role anon;
set local request.jwt.claim.sub = '';
select pg_temp.ok((select count(*) = 1 from public.invitations where slug = 'free-card'), 'anyone can open a published card');
select pg_temp.ok((select count(*) = 0 from public.invitations where slug = 'canvas-1'), 'unpublished designer card is hidden');
reset role;
rollback;
