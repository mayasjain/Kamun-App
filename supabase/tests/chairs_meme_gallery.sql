-- Rollback-only fixtures: no real users, credentials, uploads or orders.
begin;
insert into auth.users(id,aud,role,email,created_at,updated_at)
select ('81000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','chairs-gallery-' || n || '@example.invalid',now(),now()
from generate_series(1,4) n;
insert into public.committees(id,conference_id,name,abbreviation,published) values('21000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','DISEC','DISEC',true);
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001',910001,'delegate','ILO','France',repeat('1',64));
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000002',910002,'chair','ILO',null,repeat('2',64));
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000003',910003,'chair','DISEC',null,repeat('3',64));
reset role;
insert into public.admin_profiles(user_id) values('81000000-0000-4000-8000-000000000004');
insert into storage.objects(bucket_id,name,owner_id) values('committee-memes','81000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000001/chairs.png','81000000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000002',true);
do $$ declare v uuid; begin
 v:=public.post_chair_meme('10000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000001/chairs.png','Private chair meme');
 perform set_config('test.chairs_meme',v::text,true);
 if not exists(select 1 from public.list_chair_memes('10000000-0000-4000-8000-000000000001') where id=v) then raise exception 'Chair cannot list Chairs'; end if;
 if exists(select 1 from public.list_committee_memes('10000000-0000-4000-8000-000000000001') where id=v) then raise exception 'Private meme leaked into General'; end if;
 perform public.set_meme_vote(v,1);
 perform set_config('test.chairs_comment',public.add_meme_comment(v,'Private comment')::text,true);
 if not public.can_read_meme_image('81000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000001/chairs.png') then raise exception 'Chair cannot read image'; end if;
end $$;
-- Another chair can browse and interact across the conference.
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000003',true);
do $$ begin
 if not exists(select 1 from public.get_meme_activity(array[current_setting('test.chairs_meme')::uuid])) then raise exception 'Chair cannot read activity'; end if;
 if not exists(select 1 from public.list_meme_comments(current_setting('test.chairs_meme')::uuid)) then raise exception 'Chair cannot read comments'; end if;
end $$;
-- A delegate cannot use any endpoint with a guessed private post or image ID.
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
do $$ declare v uuid:=current_setting('test.chairs_meme')::uuid; begin
 if exists(select 1 from public.list_chair_memes('10000000-0000-4000-8000-000000000001')) then raise exception 'Delegate listed Chairs'; end if;
 if exists(select 1 from public.get_meme_activity(array[v])) then raise exception 'Delegate read private totals'; end if;
 if public.can_read_meme_image('81000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000001/chairs.png') then raise exception 'Delegate read private image'; end if;
 if exists(select 1 from storage.objects where name like '%/chairs.png') then raise exception 'Storage RLS leaked image'; end if;
 begin perform public.post_chair_meme('10000000-0000-4000-8000-000000000001','forged/path.png','No'); raise exception 'Delegate posted to Chairs'; exception when insufficient_privilege then null; end;
 begin perform public.set_meme_vote(v,1); raise exception 'Delegate voted on Chairs'; exception when insufficient_privilege then null; end;
 begin perform public.add_meme_comment(v,'No'); raise exception 'Delegate commented on Chairs'; exception when insufficient_privilege then null; end;
 begin perform 1 from public.list_meme_comments(v); raise exception 'Delegate read private comments'; exception when insufficient_privilege then null; end;
 if public.remove_meme_comment(current_setting('test.chairs_comment')::uuid) then raise exception 'Delegate removed private comment'; end if;
 if public.remove_committee_meme(v) then raise exception 'Delegate removed private meme'; end if;
end $$;
reset role;
-- A formerly-authoring chair switches to a valid delegate role. Ownership is not access.
update public.ecg_participant_bindings set access_type='member',seat_label='Brazil' where user_id='81000000-0000-4000-8000-000000000002';
update public.attendee_memberships set access_type='member' where user_id='81000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000002',true);
do $$ begin
 if exists(select 1 from storage.objects where name like '%/chairs.png') then raise exception 'Former chair owner bypassed image policy'; end if;
 if public.remove_meme_comment(current_setting('test.chairs_comment')::uuid) then raise exception 'Former chair removed private own comment'; end if;
 if public.can_cleanup_meme_upload('81000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000001/chairs.png') then raise exception 'Former chair deleted private image'; end if;
end $$;
-- An administrator with no attendee binding can read and moderate.
-- Posting, votes, and comments are covered in shared_admin_app.sql.
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000004',true);
do $$ declare v uuid:=current_setting('test.chairs_meme')::uuid; begin
 if not exists(select 1 from public.list_chair_memes('10000000-0000-4000-8000-000000000001') where id=v) then raise exception 'Admin cannot list Chairs'; end if;
 if not exists(select 1 from public.committee_memes where id=v and chairs_only) then raise exception 'Admin cannot review Chairs'; end if;
 if not exists(select 1 from public.list_meme_comments(v)) then raise exception 'Admin cannot read private comments'; end if;
 if not exists(select 1 from storage.objects where name like '%/chairs.png') then raise exception 'Admin cannot read private image'; end if;
 if not public.remove_meme_comment(current_setting('test.chairs_comment')::uuid) then raise exception 'Admin cannot moderate private comments'; end if;
 if not public.remove_committee_meme(v) then raise exception 'Admin cannot moderate private meme'; end if;
end $$;
reset role;
rollback;
