begin;
insert into auth.users(id) values('84000000-0000-4000-8000-000000000001');
insert into public.ecg_admin_bindings values('10000000-0000-4000-8000-000000000001','84000000-0000-4000-8000-000000000001',940001,repeat('a',64),repeat('1',64),now(),now()+interval '5 minutes',null);
insert into public.resources(id,conference_id,title,kind,url,published) values('84000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Protected guide','link','https://example.org',true);
insert into public.schedule_events(id,conference_id,title,starts_at,ends_at,published) values('84000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','Protected event',now(),now()+interval '1 hour',true);
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','84000000-0000-4000-8000-000000000001',true);
do $$ declare v uuid; t text; begin
 insert into public.announcements(conference_id,title,body,audience,published,published_at) values('10000000-0000-4000-8000-000000000001','New update','A message','chair',true,now()) returning id into v;
 if not public.remove_conference_content('10000000-0000-4000-8000-000000000001','announcements',v) then raise exception 'Cannot remove update'; end if;
 foreach t in array array['resources','schedule_events'] loop
  begin
   perform public.remove_conference_content('10000000-0000-4000-8000-000000000001',t,'84000000-0000-4000-8000-000000000002');
   raise exception 'Removal RPC accepted protected content'; exception when insufficient_privilege then null; end;
  begin
   execute format('update public.%I set published=false where conference_id=$1',t) using '10000000-0000-4000-8000-000000000001'::uuid;
   raise exception 'Unpublishing accepted'; exception when insufficient_privilege then null; end;
  begin
   execute format('delete from public.%I where conference_id=$1',t) using '10000000-0000-4000-8000-000000000001'::uuid;
   raise exception 'Deletion accepted'; exception when insufficient_privilege then null; end;
 end loop;
end $$;
reset role;
update public.ecg_admin_bindings set revoked_at=now() where user_id='84000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
 begin
 insert into public.announcements(conference_id,title,body,audience,published,published_at) values('10000000-0000-4000-8000-000000000001','Denied','Revoked','all',true,now());
 raise exception 'Revoked admin published'; exception when insufficient_privilege then null; end;
end $$;
rollback;
