begin;
insert into auth.users(id) values('86000000-0000-4000-8000-000000000001');
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','86000000-0000-4000-8000-000000000001',960001,'chair','ILO',null,repeat('a',64));
reset role;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','86000000-0000-4000-8000-000000000001',true);
do $$ declare conf uuid:='10000000-0000-4000-8000-000000000001'; own uuid; other uuid; path text; mid uuid; n integer; begin
 select id into own from public.committees where conference_id=conf and abbreviation='ILO';
 select id into other from public.committees where conference_id=conf and abbreviation='IPC';
 if not own=any(public.get_my_meme_posting_committees(conf)) or other=any(public.get_my_meme_posting_committees(conf)) then raise exception 'Incorrect chair posting grants'; end if;
 for n in 1..3 loop
  path:=public.reserve_meme_upload(conf,'image/png');
  insert into storage.objects(bucket_id,name,owner_id) values('committee-memes',path,auth.uid()::text);
  if n=3 then
   mid:=public.post_chair_meme(conf,path,'Private chair post');
   if not exists(select 1 from public.list_chair_memes(conf) where id=mid) then raise exception 'Chair post missing'; end if;
  else
   mid:=public.post_committee_meme(conf,case when n=1 then null else own end,path,'Chair public post');
   if not exists(select 1 from public.list_committee_memes(conf,case when n=1 then null else own end) where id=mid) then raise exception 'General/own committee post missing'; end if;
  end if;
 end loop;
 begin
  perform public.post_committee_meme(conf,other,'forged','Foreign committee');
  raise exception 'Chair gained foreign committee posting';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
