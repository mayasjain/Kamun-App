begin;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
-- Vault values are provisioned privately during deployment, never in migrations.
create function public.web_push_wake() returns void
language plpgsql security definer set search_path=public,extensions as $$
declare target text; dispatch_key text;
begin
 if not exists(select 1 from public.web_push_deliveries where state in ('pending','sending') and available_at<=now() and attempts<6) then return; end if;
 select decrypted_secret into target from vault.decrypted_secrets where name='web_push_dispatch_url';
 select decrypted_secret into dispatch_key from vault.decrypted_secrets where name='web_push_dispatch_key';
 if target is null or dispatch_key is null then return; end if;
 perform net.http_post(url:=target,headers:=jsonb_build_object('Content-Type','application/json','X-Push-Dispatch-Key',dispatch_key),body:='{}'::jsonb,timeout_milliseconds:=120000);
end $$;
revoke all on function public.web_push_wake() from public,anon,authenticated;
grant execute on function public.web_push_wake() to service_role;
create function public.web_push_wake_trigger() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 perform public.web_push_wake();
 return null;
end $$;
revoke all on function public.web_push_wake_trigger() from public,anon,authenticated;
-- Statement trigger batches one wake per enqueue statement. No delivery happens
-- before the publishing transaction commits. The minute cron retries outages.
create trigger wake_web_push after insert on public.web_push_deliveries for each statement execute function public.web_push_wake_trigger();
select cron.schedule('kamun-web-push','* * * * *','select public.web_push_wake()');
-- Bound retained device credentials and delivery history.
select cron.schedule('kamun-web-push-cleanup','17 3 * * *',
 $$delete from public.web_push_deliveries where created_at<now()-interval '7 days';
 delete from public.web_push_subscriptions where not enabled and updated_at<now()-interval '7 days';$$);
commit;
