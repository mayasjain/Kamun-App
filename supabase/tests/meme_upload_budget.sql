-- Disposable database only, after migrations and seed. All fixtures roll back.
begin;
insert into auth.users(id,aud,role,email,created_at,updated_at) values
 ('80000000-0000-4000-8000-000000000081','authenticated','authenticated','upload-budget@example.invalid',now(),now());
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000081',900081,'delegate','ILO','France',repeat('c',64));
reset role;
-- Isolate counters from other staging data without deleting any Storage objects.
update public.meme_upload_budgets set issued=0 where budget_key='bucket';
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000081',true);
do $$ declare p text; i integer; begin
 -- Direct arbitrary uploads (also copy destinations) must no longer work.
 begin
  insert into storage.objects(bucket_id,name,owner_id) values('committee-memes','80000000-0000-4000-8000-000000000081/10000000-0000-4000-8000-000000000001/arbitrary.png',auth.uid()::text);
  raise exception 'Unreserved upload accepted';
 exception when insufficient_privilege then null; end;
 p:=public.reserve_meme_upload('10000000-0000-4000-8000-000000000001','image/png');
 perform set_config('test.upload_path',p,true);
 if not public.can_upload_reserved_meme(p) then raise exception 'Valid reservation denied'; end if;
 insert into storage.objects(bucket_id,name,owner_id) values('committee-memes',p,auth.uid()::text);
 -- The normal upload -> post workflow remains valid.
 perform public.post_committee_meme('10000000-0000-4000-8000-000000000001',null,p,'Reserved upload');
 for i in 2..10 loop
  perform public.reserve_meme_upload('10000000-0000-4000-8000-000000000001','image/jpeg');
 end loop;
 begin
  perform public.reserve_meme_upload('10000000-0000-4000-8000-000000000001','image/png');
  raise exception 'Eleventh upload accepted';
 exception when program_limit_exceeded then null; end;
 begin
  perform public.reserve_meme_upload('10000000-0000-4000-8000-000000000001','image/svg+xml');
  raise exception 'Unsupported MIME accepted';
 exception when invalid_parameter_value then null; end;
 begin
  insert into public.meme_upload_reservations(image_path,user_id,conference_id)
   values('forged',auth.uid(),'10000000-0000-4000-8000-000000000001');
  raise exception 'Reservation forgery accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if (select issued from public.meme_upload_budgets where budget_key='bucket')<>10 then
  raise exception 'Rejected allocation leaked budget'; end if;
end $$;
-- Expiry does not refund capacity, and cannot authorize new object creation.
update public.meme_upload_reservations set expires_at=now()-interval '1 minute';
set local role authenticated;
do $$ begin
 if public.can_upload_reserved_meme(current_setting('test.upload_path')) then raise exception 'Expired reservation accepted'; end if;
end $$;
reset role;
-- Simulate older allocations to test cumulative bounds independently of hourly limit.
update public.meme_upload_reservations set created_at=now()-interval '2 hours';
update public.meme_upload_budgets set issued=100 where budget_key='user:80000000-0000-4000-8000-000000000081';
set local role authenticated;
do $$ begin
 begin
  perform public.reserve_meme_upload('10000000-0000-4000-8000-000000000001','image/webp');
  raise exception 'Account capacity bypassed';
 exception when program_limit_exceeded then null; end;
end $$;
reset role;
update public.meme_upload_budgets set issued=0 where budget_key='user:80000000-0000-4000-8000-000000000081';
update public.meme_upload_budgets set issued=1999 where budget_key='bucket';
set local role authenticated;
select public.reserve_meme_upload('10000000-0000-4000-8000-000000000001','image/webp');
do $$ begin
 begin
  perform public.reserve_meme_upload('10000000-0000-4000-8000-000000000001','image/png');
  raise exception 'Bucket capacity bypassed';
 exception when program_limit_exceeded then null; end;
end $$;
reset role;
update public.meme_upload_reservations set expires_at=now()+interval '10 minutes';
set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000082',true);
do $$ begin
 if public.can_upload_reserved_meme(current_setting('test.upload_path')) then raise exception 'Foreign reservation accepted'; end if;
 begin
  perform public.reserve_meme_upload('10000000-0000-4000-8000-000000000001','image/png');
  raise exception 'Nonparticipant reserved upload';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
