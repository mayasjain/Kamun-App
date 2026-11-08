begin;
insert into auth.users(id) values('83000000-0000-4000-8000-000000000001');
insert into public.ecg_admin_bindings values('10000000-0000-4000-8000-000000000001','83000000-0000-4000-8000-000000000001',930001,repeat('a',64),repeat('1',64),now(),now()+interval '5 minutes',null);
insert into public.resources(id,conference_id,title,kind,url,published) values('83000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Admin resource','link','https://example.org',true);
insert into public.announcements(id,conference_id,title,body,published) values('83000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','Admin update','Test',true);
insert into public.schedule_events(id,conference_id,title,starts_at,ends_at,published) values('83000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','Admin event',now(),now()+interval '1 hour',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','83000000-0000-4000-8000-000000000001',true);
do $$ declare path text; meme uuid; comment uuid; begin
 if public.is_conference_admin('10000000-0000-4000-8000-000000000002') then raise exception 'Cross conference admin'; end if;
 path:=public.reserve_meme_upload('10000000-0000-4000-8000-000000000001','image/png');
 insert into storage.objects(bucket_id,name,owner_id) values('committee-memes',path,auth.uid()::text);
 meme:=public.post_chair_meme('10000000-0000-4000-8000-000000000001',path,'Admin post');
 perform public.set_meme_vote(meme,1);
 comment:=public.add_meme_comment(meme,'Admin comment');
 if not exists(select 1 from public.list_meme_comments(meme) where id=comment and author_label='Administrator' and can_remove) then raise exception 'Admin comment missing'; end if;
 if not exists(select 1 from public.get_meme_activity(array[meme]) where my_vote=1) then raise exception 'Admin vote missing'; end if;
 if not public.remove_meme_comment(comment) or not public.remove_committee_meme(meme) then raise exception 'Admin moderation failed'; end if;
 if not public.remove_conference_content('10000000-0000-4000-8000-000000000001','resources','83000000-0000-4000-8000-000000000002') then raise exception 'Removal failed'; end if;
 if not public.remove_conference_content('10000000-0000-4000-8000-000000000001','announcements','83000000-0000-4000-8000-000000000003')
 or not public.remove_conference_content('10000000-0000-4000-8000-000000000001','schedule_events','83000000-0000-4000-8000-000000000004') then raise exception 'Update/event removal failed'; end if;
 if public.remove_conference_content('10000000-0000-4000-8000-000000000001','resources','83000000-0000-4000-8000-000000000002') then raise exception 'Repeated removal succeeded'; end if;
 begin
 perform public.remove_conference_content('10000000-0000-4000-8000-000000000001','conferences','10000000-0000-4000-8000-000000000001');
 raise exception 'Unexpected content type accepted'; exception when invalid_parameter_value then null; end;
 if exists(select 1 from public.resources where id='83000000-0000-4000-8000-000000000002' and published) then raise exception 'Resource still published'; end if;
 begin
 perform public.remove_conference_content('10000000-0000-4000-8000-000000000002','resources','83000000-0000-4000-8000-000000000002');
 raise exception 'Cross conference removal allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.ecg_admin_bindings set revoked_at=now() where user_id='83000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
 if public.can_access_meme_gallery('10000000-0000-4000-8000-000000000001',true) then raise exception 'Revoked admin gallery access'; end if;
 begin
 perform public.reserve_meme_upload('10000000-0000-4000-8000-000000000001','image/png');
 raise exception 'Revoked admin uploaded'; exception when insufficient_privilege then null; end;
 begin
 perform public.remove_conference_content('10000000-0000-4000-8000-000000000001','resources','83000000-0000-4000-8000-000000000002');
 raise exception 'Revoked admin removed'; exception when insufficient_privilege then null; end;
end $$;
rollback;
