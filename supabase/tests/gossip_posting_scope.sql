-- Run on staging with all migrations and KAMUN seed data. Rolls back every fixture.
begin;
insert into auth.users(id,aud,role,email,created_at,updated_at) values
 ('80000000-0000-4000-8000-000000000051','authenticated','authenticated','meme-test@example.invalid',now(),now());
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000051',900051,'delegate','ILO','France',repeat('b',64));
reset role;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000051',true);
do $$
declare own_id uuid; other_id uuid; message_id uuid;
begin
 select committee_id into own_id from public.attendee_memberships where user_id=auth.uid() and conference_id='10000000-0000-4000-8000-000000000001';
 select id into other_id from public.committees where conference_id='10000000-0000-4000-8000-000000000001' and published and id<>own_id limit 1;
 if own_id is null or other_id is null then raise exception 'Missing committee fixtures'; end if;
 message_id:=public.submit_committee_gossip('10000000-0000-4000-8000-000000000001',own_id,'Own committee message');
 if message_id is null then raise exception 'Own committee submission failed'; end if;
 begin
  perform public.submit_committee_gossip('10000000-0000-4000-8000-000000000001',other_id,'Other committee message');
  raise exception 'Cross-committee submission accepted';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.submit_committee_gossip('10000000-0000-4000-8000-000000000001',null,'General message');
  raise exception 'General submission accepted';
 exception when insufficient_privilege then null;
 end;
 if exists(select 1 from public.my_chair_gossip()) then raise exception 'Delegate can read chair inbox'; end if;
end $$;
rollback;
