begin;
insert into auth.users(id) values('91000000-0000-4000-8000-000000000001'),('91000000-0000-4000-8000-000000000002'),('91000000-0000-4000-8000-000000000003');
select set_config('request.jwt.claim.role','service_role',true);
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001',901,'delegate','ILO','Fixture seat',repeat('a',64));
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000002',902,'chair','ILO',null,repeat('b',64));
select * from public.ecg_bind_verified_admin('10000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000003',903,repeat('c',64),repeat('d',64));
select public.web_push_register('91000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','https://fcm.googleapis.com/fake/1','fixture','fixture');
select public.web_push_register('91000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','https://fcm.googleapis.com/fake/2','fixture','fixture');
select public.web_push_register('91000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','https://web.push.apple.com/fake/3','fixture','fixture');
insert into public.announcements(id,conference_id,title,body,audience,published,published_at) values
('92000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Fixture','Fixture','chair',true,now()),
('92000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Fixture','Fixture','member',true,now()),
('92000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','Fixture','Fixture','all',true,now()),
('92000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','Future','Fixture','all',true,now()+interval '1 hour'),
('92000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000001','Draft','Fixture','all',false,null);
do $$
begin
 if (select count(*) from public.web_push_deliveries where announcement_id='92000000-0000-4000-8000-000000000001')<>2 then raise exception 'Chair audience'; end if;
 if (select count(*) from public.web_push_deliveries where announcement_id='92000000-0000-4000-8000-000000000002')<>2 then raise exception 'Delegate audience'; end if;
 if (select count(*) from public.web_push_deliveries where announcement_id='92000000-0000-4000-8000-000000000003')<>3 then raise exception 'Everyone'; end if;
 if exists(select 1 from public.web_push_deliveries where announcement_id='92000000-0000-4000-8000-000000000005') then raise exception 'Draft leaked'; end if;
end $$;
update public.announcements set title='Edited' where id='92000000-0000-4000-8000-000000000003';
create temporary table first_claim as select * from public.web_push_claim(100);
do $$
begin
 if (select count(*) from first_claim)<>7 then raise exception 'Due queue / duplicate edits'; end if;
 if exists(select 1 from public.web_push_claim(100)) then raise exception 'Concurrent lease duplicate'; end if;
 if not public.web_push_eligible((select id from public.web_push_subscriptions where person_id=901),'92000000-0000-4000-8000-000000000003') then raise exception 'Eligible delegate'; end if;
 if public.web_push_eligible((select id from public.web_push_subscriptions where person_id=901),'92000000-0000-4000-8000-000000000001') then raise exception 'Wrong audience'; end if;
end $$;
-- Closed app leases can expire; that never grants foreground access. Dispatch
-- additionally checks ECE status before delivery.
update public.ecg_participant_bindings set valid_until=now()-interval '1 minute',verified_at=now()-interval '6 minutes' where ecg_person_id=901;
do $$ begin
 if not public.web_push_eligible((select id from public.web_push_subscriptions where person_id=901),'92000000-0000-4000-8000-000000000003') then raise exception 'Background lease'; end if;
 begin
 perform public.web_push_register('91000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','https://fcm.googleapis.com/fake/new','fixture','fixture');
 raise exception 'Expired registration accepted';
 exception when insufficient_privilege then null; end;
end $$;
update public.ecg_participant_bindings set revoked_at=now() where ecg_person_id=901;
do $$ begin
 if exists(select 1 from public.web_push_subscriptions where person_id=901 and enabled) then raise exception 'Logout subscription retained'; end if;
 if public.web_push_eligible((select id from public.web_push_subscriptions where person_id=901),'92000000-0000-4000-8000-000000000003') then raise exception 'Revoked eligible'; end if;
end $$;
-- Transfer same browser endpoint to a different signed-in person: old queue gone.
select public.web_push_register('91000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','https://fcm.googleapis.com/fake/1','fixture','fixture');
do $$ begin
 if exists(select 1 from public.web_push_deliveries d join first_claim f on f.delivery_id=d.id where f.person_id=901) then raise exception 'Old device queue retained'; end if;
end $$;
-- Removing an update while pending prevents dispatch.
update public.announcements set published=false where id='92000000-0000-4000-8000-000000000001';
do $$ begin
 if public.web_push_eligible((select id from public.web_push_subscriptions where person_id=902 limit 1),'92000000-0000-4000-8000-000000000001') then raise exception 'Removed update eligible'; end if;
end $$;
-- Old worker cannot acknowledge another worker's retry lease.
select public.web_push_finish(delivery_id,gen_random_uuid(),'sent',201) from first_claim;
do $$ begin
 if exists(select 1 from public.web_push_deliveries where state='sent') then raise exception 'Wrong lease acknowledged'; end if;
end $$;
select public.web_push_finish(delivery_id,lease_id,'pending',503) from first_claim;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
do $$ begin
 begin perform * from public.web_push_subscriptions; raise exception 'Endpoints exposed'; exception when insufficient_privilege then null; end;
 begin perform * from public.web_push_claim(); raise exception 'Client dispatch'; exception when insufficient_privilege then null; end;
 begin perform public.web_push_register('91000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','https://fcm.googleapis.com/fake/new','fixture','fixture'); raise exception 'Client self-registration'; exception when insufficient_privilege then null; end;
end $$;
rollback;
