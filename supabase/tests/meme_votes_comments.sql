-- Disposable seeded Supabase only. No Storage files are uploaded. Rolls back.
begin;
insert into auth.users(id,aud,role,email,created_at,updated_at)
select ('80000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','discussion-' || n || '@example.invalid',now(),now()
from generate_series(91,94) n;
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000091',900091,'delegate','ILO','France',repeat('d',64));
-- A second installation belonging to the SAME person.
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000092',900091,'delegate','ILO','France',repeat('d',64));
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000093',900093,'delegate','ILO','Brazil',repeat('e',64));
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000094',900094,'chair','ILO',null,repeat('f',64));
reset role;
insert into public.committee_memes(id,conference_id,committee_id,author_id,image_path,caption)
select ('90000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,'10000000-0000-4000-8000-000000000001',
case when n=1 then (select id from public.committees where conference_id='10000000-0000-4000-8000-000000000001' and abbreviation='ILO') else null end,
'80000000-0000-4000-8000-000000000091','discussion-fixture-' || n,'Fixture' from generate_series(1,2) n;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000091',true);
select public.set_meme_vote('90000000-0000-4000-8000-000000000001',1);
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000092',true);
select public.set_meme_vote('90000000-0000-4000-8000-000000000001',1);
do $$ declare a record; c uuid; i integer; begin
 select * into a from public.get_meme_activity(array['90000000-0000-4000-8000-000000000001'::uuid]);
 if a.upvotes<>1 or a.downvotes<>0 or a.my_vote<>1 then raise exception 'Duplicate vote across devices'; end if;
 perform public.set_meme_vote(a.meme_id,-1);
 select * into a from public.get_meme_activity(array[a.meme_id]);
 if a.upvotes<>0 or a.downvotes<>1 or a.my_vote<>-1 then raise exception 'Vote switch failed'; end if;
 perform public.set_meme_vote(a.meme_id,0);
 select * into a from public.get_meme_activity(array[a.meme_id]);
 if a.upvotes<>0 or a.downvotes<>0 or a.my_vote<>0 then raise exception 'Vote removal failed'; end if;
 begin perform public.set_meme_vote(a.meme_id,2); raise exception 'Invalid vote accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.add_meme_comment(a.meme_id,E' \n\t '); raise exception 'Blank comment accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.add_meme_comment(a.meme_id,repeat('x',501)); raise exception 'Long comment accepted'; exception when invalid_parameter_value then null; end;
 c:=public.add_meme_comment(a.meme_id,'  Hello <script>alert(1)</script>  ');
 perform set_config('test.comment_id',c::text,true);
 if not exists(select 1 from public.list_meme_comments(a.meme_id) where id=c and body='Hello <script>alert(1)</script>' and author_label='France · ILO' and is_own and can_remove) then raise exception 'Comment contract failed'; end if;
 -- Exhaust the shared-person comment allowance from this installation.
 for i in 2..3 loop c:=public.add_meme_comment(a.meme_id,'Comment ' || i); end loop;
 perform set_config('test.live_comment_id',c::text,true);
 begin perform public.add_meme_comment(a.meme_id,'Fourth'); raise exception 'Comment rate bypassed'; exception when program_limit_exceeded then null; end;
 begin perform 1 from public.meme_votes; raise exception 'Voter identities exposed'; exception when insufficient_privilege then null; end;
 begin perform 1 from public.meme_comments; raise exception 'Raw comment actors exposed'; exception when insufficient_privilege then null; end;
 begin perform public.meme_actor('10000000-0000-4000-8000-000000000001'); raise exception 'Private helper exposed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000091',true);
do $$ begin
 begin perform public.add_meme_comment('90000000-0000-4000-8000-000000000001','Another device'); raise exception 'Device reset comment rate'; exception when program_limit_exceeded then null; end;
 if not public.remove_meme_comment(current_setting('test.comment_id')::uuid) then raise exception 'Cross-device own deletion failed'; end if;
end $$;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000093',true);
do $$ declare c uuid; begin
 if public.remove_meme_comment(current_setting('test.live_comment_id')::uuid) then raise exception 'Foreign deletion accepted'; end if;
 c:=public.add_meme_comment('90000000-0000-4000-8000-000000000001','Moderate this');
 perform set_config('test.moderate_id',c::text,true);
 c:=public.add_meme_comment('90000000-0000-4000-8000-000000000002','General');
 perform set_config('test.general_id',c::text,true);
end $$;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000094',true);
do $$ begin
 if not public.remove_meme_comment(current_setting('test.moderate_id')::uuid) then raise exception 'Chair moderation failed'; end if;
 if public.remove_meme_comment(current_setting('test.general_id')::uuid) then raise exception 'Chair moderated General'; end if;
end $$;
reset role;
-- Dashboard administrators can moderate General without an attendee binding.
insert into public.admin_profiles(user_id) values('80000000-0000-4000-8000-000000000094');
update public.ecg_participant_bindings set revoked_at=now() where user_id='80000000-0000-4000-8000-000000000094';
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.list_meme_comments('90000000-0000-4000-8000-000000000002') where can_remove) then raise exception 'Admin cannot read General comments'; end if;
 if not public.remove_meme_comment(current_setting('test.general_id')::uuid) then raise exception 'Admin cannot moderate General'; end if;
end $$;
reset role;
-- Daily budget includes removed comments; vote limits are also durable per person.
update public.meme_interaction_limits set attempts=0,window_start=now()-interval '2 minutes';
insert into public.meme_comments(meme_id,conference_id,actor,author_label,body,removed_at)
select '90000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','ecg:900091','France · ILO','Removed',now() from generate_series(1,27);
set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000091',true);
do $$ declare i integer; begin
 begin perform public.add_meme_comment('90000000-0000-4000-8000-000000000001','Daily cap'); raise exception 'Daily budget bypassed'; exception when program_limit_exceeded then null; end;
 for i in 1..60 loop perform public.set_meme_vote('90000000-0000-4000-8000-000000000001',1); end loop;
 begin perform public.set_meme_vote('90000000-0000-4000-8000-000000000001',-1); raise exception 'Vote rate bypassed'; exception when program_limit_exceeded then null; end;
end $$;
reset role;
-- Comment pagination uses the UUID tie-breaker even with identical timestamps.
insert into public.meme_comments(meme_id,conference_id,actor,author_label,body)
select '90000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','fixture:' || n,'Fixture','Page ' || n from generate_series(1,22) n;
set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000093',true);
do $$ declare c record; n integer; begin
 select count(*) into n from public.list_meme_comments('90000000-0000-4000-8000-000000000002');
 if n<>20 then raise exception 'Comment page is unbounded'; end if;
 select * into c from public.list_meme_comments('90000000-0000-4000-8000-000000000002') offset 19 limit 1;
 select count(*) into n from public.list_meme_comments('90000000-0000-4000-8000-000000000002',c.created_at,c.id);
 if n<>2 then raise exception 'Tied timestamp pagination failed'; end if;
 begin perform 1 from public.get_meme_activity(array_fill('90000000-0000-4000-8000-000000000002'::uuid,array[25])); raise exception 'Unbounded activity batch accepted'; exception when invalid_parameter_value then null; end;
end $$;
reset role;
update public.ecg_participant_bindings set revoked_at=now() where user_id='80000000-0000-4000-8000-000000000091';
set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000091',true);
do $$ begin
 if exists(select 1 from public.get_meme_activity(array['90000000-0000-4000-8000-000000000001'::uuid])) then raise exception 'Revoked user read activity'; end if;
 begin perform public.set_meme_vote('90000000-0000-4000-8000-000000000001',1); raise exception 'Revoked user voted'; exception when insufficient_privilege then null; end;
 begin perform public.add_meme_comment('90000000-0000-4000-8000-000000000001','Revoked'); raise exception 'Revoked user commented'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.committee_memes set removed_at=now() where id='90000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000093',true);
do $$ begin
 begin perform 1 from public.list_meme_comments('90000000-0000-4000-8000-000000000001'); raise exception 'Removed meme comments exposed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
