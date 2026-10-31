-- Tests for AI credits: bought with a verified payment, spent all-or-nothing, refunded only by the server.
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
-- AI stays paid even in free mode.
update public.app_settings set value = 'true'::jsonb where key = 'free_mode';

insert into auth.users values ('00000000-0000-0000-0000-0000000000c3');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c3';
select pg_temp.denied($$select public.use_ai_credits(1, 'design', 'gemini')$$, 'no AI credits, no AI request (free mode does not make AI free)');
update public.profiles set ai_credits = 99;
select pg_temp.ok(coalesce((select ai_credits from public.profiles where user_id = auth.uid()), 0) = 0, 'cannot give yourself AI credits');
select pg_temp.denied($$insert into public.ai_generations (user_id, credits) values (auth.uid(), 0)$$, 'cannot write the AI log directly');
reset role;

set local role service_role;
set local request.jwt.claim.sub = '';
insert into public.payments (user_id, order_ref, method, amount_pkr, purpose, credits, product) values
  ('00000000-0000-0000-0000-0000000000c3', 'DNAIPACK0001', 'card', 299, 'ai', 10, 'ai10');
select pg_temp.ok(public.complete_payment('DNAIPACK0001', 'T9', 'PAID'), 'AI pack payment completes');
select pg_temp.ok(public.complete_payment('DNAIPACK0001', 'T9', 'PAID'), 'AI pack completes once (idempotent)');
select pg_temp.ok((select ai_credits = 10 and link_credits = 0 from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c3'),
                  'AI credits added once; guest links untouched');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c3';
select pg_temp.ok(public.use_ai_credits(3, 'image', 'gpt') > 0, 'a GPT picture uses 3 credits');
select pg_temp.ok((select ai_credits = 7 from public.profiles where user_id = auth.uid()), '7 credits left');
select pg_temp.denied($$select public.use_ai_credits(8, 'design', 'claude')$$, 'cannot spend more than you have');
select pg_temp.denied($$select public.use_ai_credits(0, 'design', 'claude')$$, 'a request always costs something');
select pg_temp.denied($$select public.use_ai_credits(1, 'design', 'other-ai')$$, 'only known AI models');
select pg_temp.denied($$select public.refund_ai_credits((select max(id) from public.ai_generations))$$, 'users cannot refund themselves');
select pg_temp.ok((select count(*) = 1 from public.ai_generations), 'owner sees their own AI log');
reset role;

set local role service_role;
set local request.jwt.claim.sub = '';
select pg_temp.ok(public.refund_ai_credits((select max(id) from public.ai_generations)), 'server refunds a failed request');
select pg_temp.ok(not public.refund_ai_credits((select max(id) from public.ai_generations)), 'a request is refunded only once');
select pg_temp.ok((select ai_credits = 10 from public.profiles where user_id = '00000000-0000-0000-0000-0000000000c3'), 'credits are back');
reset role;
rollback;
