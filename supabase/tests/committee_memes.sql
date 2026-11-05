-- Run on staging with all migrations and KAMUN seed data. Rolls back every fixture.
begin;
insert into auth.users(id,aud,role,email,created_at,updated_at) values
 ('80000000-0000-4000-8000-000000000051','authenticated','authenticated','meme-test@example.invalid',now(),now());
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000051',900051,'delegate','ILO','France',repeat('b',64));
reset role;
-- Simulate the Storage service's completed upload metadata (no remote file is needed).
insert into storage.objects(bucket_id,name,owner_id) values('committee-memes','80000000-0000-4000-8000-000000000051/10000000-0000-4000-8000-000000000001/test.jpg','80000000-0000-4000-8000-000000000051');
insert into storage.objects(bucket_id,name,owner_id) values('committee-memes','80000000-0000-4000-8000-000000000051/10000000-0000-4000-8000-000000000001/general.jpg','80000000-0000-4000-8000-000000000051');
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000051',true);
do $$
declare c uuid; other_c uuid; m uuid; g uuid;
begin
 select id into c from public.committees where conference_id='10000000-0000-4000-8000-000000000001' and abbreviation='ILO' and published limit 1;
 m:=public.post_committee_meme('10000000-0000-4000-8000-000000000001',c,'80000000-0000-4000-8000-000000000051/10000000-0000-4000-8000-000000000001/test.jpg',' Test caption ');
 select id into other_c from public.committees where conference_id='10000000-0000-4000-8000-000000000001' and published and id<>c limit 1;
 if other_c is null then raise exception 'Test needs another committee'; end if;
 begin
  perform public.post_committee_meme('10000000-0000-4000-8000-000000000001',other_c,'80000000-0000-4000-8000-000000000051/10000000-0000-4000-8000-000000000001/test.jpg','Wrong committee');
  raise exception 'Cross-committee post accepted';
 exception when insufficient_privilege then null;
 end;
 perform set_config('test.meme_id',m::text,true);
 perform set_config('test.committee_id',c::text,true);
 if exists(select 1 from public.list_committee_memes('10000000-0000-4000-8000-000000000001') where id=m) then raise exception 'Committee meme leaked into General'; end if;
 if not exists(select 1 from public.list_committee_memes('10000000-0000-4000-8000-000000000001',c) where id=m and is_own and caption='Test caption') then raise exception 'Posted meme missing from feed'; end if;
 if exists(select 1 from public.committee_memes where id=m) then raise exception 'Author identity exposed through table'; end if;
 if not public.can_read_meme_image('80000000-0000-4000-8000-000000000051/10000000-0000-4000-8000-000000000001/test.jpg') then raise exception 'Participant cannot read photo'; end if;
 g:=public.post_committee_meme('10000000-0000-4000-8000-000000000001',null,'80000000-0000-4000-8000-000000000051/10000000-0000-4000-8000-000000000001/general.jpg','General meme');
 if not exists(select 1 from public.list_committee_memes('10000000-0000-4000-8000-000000000001') where id=g and committee_id is null) then raise exception 'General meme missing'; end if;
 if exists(select 1 from public.list_committee_memes('10000000-0000-4000-8000-000000000001',c) where id=g) then raise exception 'General meme leaked into committee'; end if;
 if public.remove_committee_meme(m) then raise exception 'Delegate removed own meme'; end if;
 if public.can_moderate_meme_gallery('10000000-0000-4000-8000-000000000001',c) then raise exception 'Delegate has moderation permission'; end if;
 begin
  perform public.report_committee_meme(m,'Please review');
  raise exception 'Reporting is still enabled';
 exception when insufficient_privilege then null;
 end;
 -- Forged object ownership and missing uploads must be rejected.
 begin
  perform public.post_committee_meme('10000000-0000-4000-8000-000000000001',c,'other-user/test.jpg','');
  raise exception 'Forged upload accepted';
 exception when raise_exception then
  if sqlerrm='Forged upload accepted' then raise; end if;
 end;
end $$;
-- A signed-in account without valid participant access sees no feed and cannot remove/report.
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000052',true);
do $$ begin
 if exists(select 1 from public.list_committee_memes('10000000-0000-4000-8000-000000000001')) then raise exception 'Unauthorized feed access'; end if;
 if public.remove_committee_meme(current_setting('test.meme_id')::uuid) then raise exception 'Other account removed meme'; end if;
 begin
  perform public.report_committee_meme(current_setting('test.meme_id')::uuid,'Unauthorized report');
  raise exception 'Unauthorized report accepted';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
update public.attendee_memberships set access_type='chair',committee_id=current_setting('test.committee_id')::uuid where user_id='80000000-0000-4000-8000-000000000051';
update public.ecg_participant_bindings set access_type='chair',committee_id=current_setting('test.committee_id')::uuid where user_id='80000000-0000-4000-8000-000000000051';
set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000051',true);
do $$ begin
 if public.can_moderate_meme_gallery('10000000-0000-4000-8000-000000000001',null) then raise exception 'Chair can moderate General'; end if;
 if exists(select 1 from public.committees c where c.conference_id='10000000-0000-4000-8000-000000000001' and c.id<>current_setting('test.committee_id')::uuid and public.can_moderate_meme_gallery(c.conference_id,c.id)) then raise exception 'Chair can moderate another committee'; end if;
 if not public.remove_committee_meme(current_setting('test.meme_id')::uuid) then raise exception 'Chair removal failed'; end if;
 if exists(select 1 from public.list_committee_memes('10000000-0000-4000-8000-000000000001',current_setting('test.committee_id')::uuid) where id=current_setting('test.meme_id')::uuid) then raise exception 'Removed meme still visible'; end if;
end $$;
reset role;
do $$ begin
 if has_function_privilege('authenticated','public.report_committee_meme(uuid,text)','execute') then raise exception 'Reporting permission remains'; end if;
 if (select public from storage.buckets where id='committee-memes') then raise exception 'Meme bucket must be private'; end if;
end $$;
rollback;
