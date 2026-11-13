begin;
-- Independent expected roster: this must not be derived from the assignment table.
create temporary table expected_ipc(n integer,seat text,target text);
insert into expected_ipc values
 (1,'Al Jazeera (IAEA)','IAEA'),(2,'BBC World (ILO)','ILO'),
 (3,'Charlie Hebdo (European Parliament)','EP'),(4,'China Daily (CUPUOS)','COPUOS'),
 (5,'Eleanzer Oswald (EIC of the Independent Gazetteer) (US CC)','USCC'),
 (6,'Financial Times (ILO)','ILO'),(7,'Fox News (UNSC)','UNSC'),
 (8,'New York Times (WHO)','WHO'),(9,'Russia Today (IAEA)','IAEA'),
 (10,'The Guardian (DISEC)','DISEC'),(11,'The Island Times (PIF)','PIF'),
 (12,'Unknown outlet (IAEA)',null),(13,'Al Jazeera (IAEA)',null);
grant select on expected_ipc to authenticated,service_role;
insert into auth.users(id) select ('81000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from expected_ipc;
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001',
 ('81000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,910000+n,'delegate',
 case when n=13 then 'ILO' else 'IPC' end,seat,repeat('d',64)) from expected_ipc;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
do $$ declare
 r record; own uuid; target uuid; other uuid; allowed uuid[]; dest uuid; path text; mid uuid;
 conf uuid:='10000000-0000-4000-8000-000000000001';
begin
 for r in select * from expected_ipc order by n loop
  perform set_config('request.jwt.claim.sub',('81000000-0000-4000-8000-'||lpad(r.n::text,12,'0')),true);
  select id into own from public.committees where conference_id=conf and abbreviation=case when r.n=13 then 'ILO' else 'IPC' end;
  select id into target from public.committees where conference_id=conf and abbreviation=r.target;
  allowed:=public.get_my_meme_posting_committees(conf);
  if not own=any(allowed) or cardinality(allowed)<>(case when r.target is null then 1 else 2 end) then raise exception 'Incorrect galleries for %',r.seat; end if;
  if target is not null and not target=any(allowed) then raise exception 'Missing assigned gallery for %',r.seat; end if;
  if cardinality(public.get_my_meme_posting_committees('10000000-0000-4000-8000-000000000099'))<>0 then raise exception 'Cross conference grants'; end if;
  foreach dest in array (case when target is null then array[null::uuid,own] else array[null::uuid,own,target] end) loop
   path:=public.reserve_meme_upload(conf,'image/png');
   insert into storage.objects(bucket_id,name,owner_id) values('committee-memes',path,auth.uid()::text);
   mid:=public.post_committee_meme(conf,dest,path,'IPC assignment test');
   if mid is null then raise exception 'Post failed for %',r.seat; end if;
  end loop;
  select id into other from public.committees where conference_id=conf and id<>own and (target is null or id<>target) limit 1;
  begin
   perform public.post_committee_meme(conf,other,'forged','Forbidden');
   raise exception 'Foreign gallery allowed';
  exception when insufficient_privilege then null; end;
  begin
   perform public.post_chair_meme(conf,'forged','Forbidden');
   raise exception 'Chairs gallery allowed';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.ipc_meme_assignments; raise exception 'Assignment table exposed';
  exception when insufficient_privilege then null; end;
  -- Additional posting access must not confer committee membership or moderation.
  if target is not null and (public.has_current_attendee_access(conf,null,target) or public.can_moderate_meme_gallery(conf,target)) then raise exception 'Broader access granted'; end if;
 end loop;
end $$;
reset role;
-- Normalization and server-authoritative identity changes.
update public.ecg_participant_bindings set seat_label='CHINA  DAILY (COPUOS)' where ecg_person_id=910004;
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000004',true);
do $$ begin
 if cardinality(public.get_my_meme_posting_committees('10000000-0000-4000-8000-000000000001'))<>2 then raise exception 'Normalization failed'; end if;
end $$;
reset role;
select set_config('test.unpublished_id',(select id::text from public.committees where abbreviation='COPUOS'),true);
update public.committees set published=false where abbreviation='COPUOS';
set local role authenticated;
do $$ begin
 if cardinality(public.get_my_meme_posting_committees('10000000-0000-4000-8000-000000000001'))<>1 then raise exception 'Unpublished committee allowed'; end if;
 begin
  perform public.post_committee_meme('10000000-0000-4000-8000-000000000001',current_setting('test.unpublished_id')::uuid,'forged','Forbidden');
  raise exception 'Unpublished post allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.ecg_participant_bindings set verified_at=now()-interval '4 minutes',valid_until=now()-interval '1 minute' where ecg_person_id=910001;
update public.ecg_participant_bindings set revoked_at=now() where ecg_person_id=910002;
set local role authenticated;
do $$ declare n integer; begin
 for n in 1..2 loop
  perform set_config('request.jwt.claim.sub','81000000-0000-4000-8000-'||lpad(n::text,12,'0'),true);
  if cardinality(public.get_my_meme_posting_committees('10000000-0000-4000-8000-000000000001'))<>0 then raise exception 'Expired/revoked access'; end if;
  begin
   perform public.post_committee_meme('10000000-0000-4000-8000-000000000001',null,'forged','Forbidden');
   raise exception 'Expired/revoked post allowed';
  exception when raise_exception then
   if sqlerrm<>'Current participant access required' then raise; end if;
  end;
 end loop;
end $$;
reset role;
rollback;
