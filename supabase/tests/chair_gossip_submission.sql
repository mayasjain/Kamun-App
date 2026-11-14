begin;
insert into auth.users(id) values('88000000-0000-4000-8000-000000000001');
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','88000000-0000-4000-8000-000000000001',980001,'chair','ILO',null,repeat('a',64));
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','88000000-0000-4000-8000-000000000001',true);
do $$ declare conf uuid:='10000000-0000-4000-8000-000000000001'; own uuid; other uuid; mid uuid; begin
 select id into own from public.committees where conference_id=conf and abbreviation='ILO';
 select id into other from public.committees where conference_id=conf and abbreviation='IPC';
 mid:=public.submit_committee_gossip(conf,own,'Chair gossip message');
 if not exists(select 1 from public.my_chair_gossip() where id=mid and message='Chair gossip message') then raise exception 'Chair submission missing'; end if;
 begin perform public.submit_committee_gossip(conf,other,'Foreign committee'); raise exception 'Chair cross-committee submission accepted'; exception when insufficient_privilege then null; end;
 begin perform public.submit_committee_gossip(conf,null,'General'); raise exception 'Null committee accepted'; exception when insufficient_privilege then null; end;
 begin perform public.submit_committee_gossip('10000000-0000-4000-8000-000000000099',own,'Foreign conference'); raise exception 'Cross conference accepted'; exception when insufficient_privilege then null; end;
 begin perform public.submit_committee_gossip(conf,own,'ab'); raise exception 'Short message accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.submit_committee_gossip(conf,own,repeat('x',501)); raise exception 'Long message accepted'; exception when invalid_parameter_value then null; end;
 perform public.submit_committee_gossip(conf,own,'Second message');
 perform public.submit_committee_gossip(conf,own,'Third message');
 begin perform public.submit_committee_gossip(conf,own,'Fourth message'); raise exception 'Rate limit bypassed'; exception when invalid_parameter_value then
  if sqlerrm not like 'Submission limit%' then raise; end if;
 end;
end $$;
reset role;
update public.ecg_participant_bindings set revoked_at=now() where ecg_person_id=980001;
set local role authenticated;
do $$ begin
 begin perform public.submit_committee_gossip('10000000-0000-4000-8000-000000000001',(select id from public.committees where abbreviation='ILO'),'Revoked'); raise exception 'Revoked chair submitted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
