begin;
insert into auth.users(id) values
 ('85000000-0000-4000-8000-000000000001'),
 ('85000000-0000-4000-8000-000000000002'),
 ('85000000-0000-4000-8000-000000000003');
insert into public.ecg_admin_bindings values('10000000-0000-4000-8000-000000000001','85000000-0000-4000-8000-000000000001',950001,repeat('a',64),repeat('b',64),now(),now()+interval '5 minutes',null);
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','85000000-0000-4000-8000-000000000002',950002,'chair','ILO',null,repeat('c',64));
select public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','85000000-0000-4000-8000-000000000003',950003,'delegate','ILO','France',repeat('d',64));
reset role;
insert into public.committee_gossip(conference_id,committee_id,sender_user_id,message,status)
select conference_id,id,'85000000-0000-4000-8000-000000000003','Fixture for '||abbreviation,case when abbreviation='IPC' then 'dismissed' else 'new' end
from public.committees where conference_id='10000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','85000000-0000-4000-8000-000000000001',true);
do $$ declare c record; g record; n integer; conf uuid:='10000000-0000-4000-8000-000000000001'; begin
 select count(distinct committee_id) into n from public.my_admin_gossip(conf);
 if n<>10 then raise exception 'Admin cannot see all ten boxes: %',n; end if;
 for c in select id from public.committees where conference_id=conf loop
  select count(*) into n from public.my_admin_gossip(conf,c.id);
  if n<>1 then raise exception 'Committee filter failed'; end if;
 end loop;
 select * into g from public.my_admin_gossip(conf) limit 1;
 if to_jsonb(g) ? 'sender_user_id' then raise exception 'Sender identity exposed'; end if;
 if not exists(select 1 from public.my_admin_gossip(conf) where status='dismissed') then raise exception 'Dismissed messages hidden'; end if;
 if public.set_chair_gossip_status(g.id,'read') then raise exception 'Admin gained chair moderation'; end if;
 begin perform 1 from public.committee_gossip; raise exception 'Raw table exposed'; exception when insufficient_privilege then null; end;
 begin perform 1 from public.my_admin_gossip('10000000-0000-4000-8000-000000000099'); raise exception 'Cross conference access'; exception when insufficient_privilege then null; end;
 begin perform 1 from public.my_admin_gossip(conf,'20000000-0000-4000-8000-000000000099'); raise exception 'Invalid committee accepted'; exception when invalid_parameter_value then null; end;
end $$;
-- Chairs retain only their own box; delegates cannot read inboxes.
select set_config('request.jwt.claim.sub','85000000-0000-4000-8000-000000000002',true);
do $$ begin
 if (select count(*) from public.my_chair_gossip())<>1 then raise exception 'Chair scope changed'; end if;
 begin perform 1 from public.my_admin_gossip('10000000-0000-4000-8000-000000000001'); raise exception 'Chair got admin access'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','85000000-0000-4000-8000-000000000003',true);
do $$ begin
 if exists(select 1 from public.my_chair_gossip()) then raise exception 'Delegate read gossip'; end if;
 begin perform 1 from public.my_admin_gossip('10000000-0000-4000-8000-000000000001'); raise exception 'Delegate got admin access'; exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Pagination remains complete when many messages share the same timestamp.
insert into public.committee_gossip(conference_id,committee_id,sender_user_id,message)
select '10000000-0000-4000-8000-000000000001',(select id from public.committees where abbreviation='IPC'),
 '85000000-0000-4000-8000-000000000003','Page fixture '||n from generate_series(1,110) n;
set local role authenticated;
select set_config('request.jwt.claim.sub','85000000-0000-4000-8000-000000000001',true);
do $$ declare c uuid; cursor_row record; conf uuid:='10000000-0000-4000-8000-000000000001'; begin
 select id into c from public.committees where abbreviation='IPC';
 if (select count(*) from public.my_admin_gossip(conf,c))<>100 then raise exception 'Unbounded first page'; end if;
 select * into cursor_row from public.my_admin_gossip(conf,c) offset 99 limit 1;
 if (select count(*) from public.my_admin_gossip(conf,c,cursor_row.created_at,cursor_row.id))<>11 then raise exception 'Older messages missing'; end if;
 begin perform 1 from public.my_admin_gossip(conf,c,now(),null); raise exception 'Invalid cursor accepted'; exception when invalid_parameter_value then null; end;
end $$;
reset role;
update public.ecg_admin_bindings set verified_at=now()-interval '4 minutes',valid_until=now()-interval '1 minute' where ecg_person_id=950001;
set local role authenticated;
select set_config('request.jwt.claim.sub','85000000-0000-4000-8000-000000000001',true);
do $$ begin
 begin perform 1 from public.my_admin_gossip('10000000-0000-4000-8000-000000000001'); raise exception 'Expired admin allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.ecg_admin_bindings set verified_at=now(),valid_until=now()+interval '5 minutes',revoked_at=now() where ecg_person_id=950001;
set local role authenticated;
do $$ begin
 begin perform 1 from public.my_admin_gossip('10000000-0000-4000-8000-000000000001'); raise exception 'Revoked admin allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.admin_profiles(user_id) values('85000000-0000-4000-8000-000000000001');
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.my_admin_gossip('10000000-0000-4000-8000-000000000001',(select id from public.committees where abbreviation='ILO'))) then raise exception 'Recovery admin denied'; end if;
end $$;
reset role;
rollback;
