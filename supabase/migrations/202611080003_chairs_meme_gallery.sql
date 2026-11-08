-- Private, conference-wide gallery for chairs. Existing destinations stay unchanged.
begin;
alter table public.committee_memes add column chairs_only boolean not null default false;
alter table public.committee_memes add constraint chairs_gallery_has_no_committee
 check (not chairs_only or committee_id is null);
create index committee_memes_chairs_recent on public.committee_memes(conference_id,created_at desc,id desc)
 where chairs_only and removed_at is null;

create function public.can_access_meme_gallery(p_conference_id uuid,p_chairs_only boolean)
returns boolean language sql stable security definer set search_path=public as $$
 select public.is_kamun_admin() or public.has_current_attendee_access(
  p_conference_id,case when p_chairs_only then 'chair'::text else null::text end);
$$;
revoke all on function public.can_access_meme_gallery(uuid,boolean) from public,anon;
grant execute on function public.can_access_meme_gallery(uuid,boolean) to authenticated;

create or replace function public.list_committee_memes(p_conference_id uuid,p_committee_id uuid default null,p_before timestamptz default null)
returns table(id uuid,committee_id uuid,image_path text,caption text,created_at timestamptz,is_own boolean)
language sql stable security definer set search_path=public as $$
 select m.id,m.committee_id,m.image_path,m.caption,m.created_at,m.author_id=auth.uid()
 from public.committee_memes m where m.conference_id=p_conference_id and m.removed_at is null
 and not m.chairs_only
 and public.can_access_meme_gallery(p_conference_id,false)
 and (m.committee_id is not distinct from p_committee_id)
 and (p_before is null or m.created_at<p_before)
 order by m.created_at desc,m.id desc limit 24;
$$;

create function public.list_chair_memes(p_conference_id uuid,p_before timestamptz default null)
returns table(id uuid,committee_id uuid,image_path text,caption text,created_at timestamptz,is_own boolean)
language sql stable security definer set search_path=public as $$
 select m.id,m.committee_id,m.image_path,m.caption,m.created_at,m.author_id=auth.uid()
 from public.committee_memes m where m.conference_id=p_conference_id and m.removed_at is null
 and m.chairs_only and public.can_access_meme_gallery(p_conference_id,true)
 and (p_before is null or m.created_at<p_before)
 order by m.created_at desc,m.id desc limit 24;
$$;
create function public.post_chair_meme(p_conference_id uuid,p_image_path text,p_caption text default '')
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if not public.has_current_attendee_access(p_conference_id,'chair') then
  raise exception 'Only current chairs can post in Chairs' using errcode='42501';
 end if;
 -- Reuse ownership, upload validation, caption constraints and shared posting limits.
 v_id:=public.post_committee_meme(p_conference_id,null,p_image_path,p_caption);
 update public.committee_memes set chairs_only=true where id=v_id;
 return v_id;
end;
$$;
revoke all on function public.list_chair_memes(uuid,timestamptz),public.post_chair_meme(uuid,text,text) from public,anon;
grant execute on function public.list_chair_memes(uuid,timestamptz),public.post_chair_meme(uuid,text,text) to authenticated;

create or replace function public.can_read_meme_image(p_path text) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.committee_memes m where m.image_path=p_path
  and m.removed_at is null and public.can_access_meme_gallery(m.conference_id,m.chairs_only));
$$;
-- Ownership must not bypass the gallery restriction after a chair becomes a delegate.
create function public.can_read_unpublished_meme_upload(p_path text) returns boolean
language sql stable security definer set search_path=public as $$
 select public.can_upload_reserved_meme(p_path)
  and not exists(select 1 from public.committee_memes where image_path=p_path);
$$;
revoke all on function public.can_read_unpublished_meme_upload(text) from public,anon;
grant execute on function public.can_read_unpublished_meme_upload(text) to authenticated;
drop policy meme_image_read on storage.objects;
create policy meme_image_read on storage.objects for select to authenticated
 using(bucket_id='committee-memes' and (public.is_kamun_admin()
  or public.can_read_meme_image(name) or public.can_read_unpublished_meme_upload(name)));

-- Cleanup is only for an upload that never became a post. A former chair must
-- not delete a private gallery's backing object via their old ownership path.
create function public.can_cleanup_meme_upload(p_path text) returns boolean
language sql stable security definer set search_path=public as $$
 select split_part(p_path,'/',1)=auth.uid()::text
  and not exists(select 1 from public.committee_memes where image_path=p_path);
$$;
revoke all on function public.can_cleanup_meme_upload(text) from public,anon;
grant execute on function public.can_cleanup_meme_upload(text) to authenticated;
drop policy meme_cleanup on storage.objects;
create policy meme_cleanup on storage.objects for delete to authenticated
 using(bucket_id='committee-memes' and public.can_cleanup_meme_upload(name));

create or replace function public.get_meme_activity(p_ids uuid[])
returns table(meme_id uuid,upvotes bigint,downvotes bigint,my_vote smallint,comment_count bigint)
language plpgsql stable security definer set search_path=public as $$
begin
 if p_ids is null or cardinality(p_ids)>24 then
  raise exception 'Request up to 24 memes' using errcode='22023'; end if;
 return query select m.id,
  (select count(*) from public.meme_votes v where v.meme_id=m.id and v.value=1),
  (select count(*) from public.meme_votes v where v.meme_id=m.id and v.value=-1),
  coalesce((select v.value from public.meme_votes v where v.meme_id=m.id and v.actor=public.meme_actor(m.conference_id)),0)::smallint,
  (select count(*) from public.meme_comments c where c.meme_id=m.id and c.removed_at is null)
 from public.committee_memes m where m.id=any(p_ids) and m.removed_at is null
  and public.can_access_meme_gallery(m.conference_id,m.chairs_only);
end;
$$;
create or replace function public.set_meme_vote(p_meme_id uuid,p_value integer)
returns void language plpgsql security definer set search_path=public as $$
declare m public.committee_memes%rowtype; v_actor text;
begin
 if p_value is null or p_value not in (-1,0,1) then raise exception 'Invalid vote' using errcode='22023'; end if;
 select * into m from public.committee_memes where id=p_meme_id and removed_at is null for update;
 v_actor:=public.meme_actor(m.conference_id);
 if m.id is null or v_actor is null or not public.can_access_meme_gallery(m.conference_id,m.chairs_only) then raise exception 'Meme unavailable. Sign in again.' using errcode='42501'; end if;
 perform public.acquire_meme_interaction(m.conference_id,v_actor,'vote');
 if p_value=0 then delete from public.meme_votes where meme_id=m.id and actor=v_actor;
 else
  insert into public.meme_votes(meme_id,actor,value) values(m.id,v_actor,p_value)
  on conflict(meme_id,actor) do update set value=excluded.value;
 end if;
end;
$$;

create or replace function public.list_meme_comments(p_meme_id uuid,p_before timestamptz default null,p_before_id uuid default null)
returns table(id uuid,body text,author_label text,created_at timestamptz,is_own boolean,can_remove boolean)
language plpgsql stable security definer set search_path=public as $$
declare m public.committee_memes%rowtype; v_actor text;
begin
 select * into m from public.committee_memes where committee_memes.id=p_meme_id and removed_at is null;
 v_actor:=public.meme_actor(m.conference_id);
 if m.id is null or not public.can_access_meme_gallery(m.conference_id,m.chairs_only) then raise exception 'Meme unavailable. Sign in again.' using errcode='42501'; end if;
 if (p_before is null)<>(p_before_id is null) then raise exception 'Invalid comment cursor' using errcode='22023'; end if;
 return query select c.id,c.body,c.author_label,c.created_at,coalesce(c.actor=v_actor,false),
  coalesce(c.actor=v_actor,false) or public.can_moderate_meme_gallery(m.conference_id,m.committee_id)
 from public.meme_comments c where c.meme_id=m.id and c.removed_at is null
  and (p_before is null or (c.created_at,c.id)<(p_before,p_before_id))
 order by c.created_at desc,c.id desc limit 20;
end;
$$;
create or replace function public.add_meme_comment(p_meme_id uuid,p_body text)
returns uuid language plpgsql security definer set search_path=public as $$
declare m public.committee_memes%rowtype; v_actor text; v_label text; v_id uuid; v_body text:=btrim(p_body);
begin
 if v_body is null or char_length(v_body) not between 1 and 500 or v_body !~ '[^[:space:]]' then
  raise exception 'Write a comment between 1 and 500 characters.' using errcode='22023'; end if;
 select * into m from public.committee_memes where id=p_meme_id and removed_at is null for update;
 v_actor:=public.meme_actor(m.conference_id);
 if m.id is null or v_actor is null or not public.can_access_meme_gallery(m.conference_id,m.chairs_only) then raise exception 'Meme unavailable. Sign in again.' using errcode='42501'; end if;
 perform public.acquire_meme_interaction(m.conference_id,v_actor,'comment');
 if (select count(*) from public.meme_comments c where c.conference_id=m.conference_id and c.actor=v_actor and c.created_at>now()-interval '1 day')>=30 then
  raise exception 'You have reached the daily comment limit.' using errcode='54000'; end if;
 -- Include removed comments so moderation cannot be used to recycle capacity.
 if (select count(*) from public.meme_comments c where c.meme_id=m.id)>=200 then
  raise exception 'This meme has reached its comment limit.' using errcode='54000'; end if;
 select concat_ws(' · ',case when a.access_type='chair' then 'Chair' else coalesce(b.seat_label,'Delegate') end,c.abbreviation)
 into v_label from public.attendee_memberships a
 left join public.ecg_participant_bindings b on b.conference_id=a.conference_id and b.user_id=a.user_id
 left join public.committees c on c.id=a.committee_id
 where a.conference_id=m.conference_id and a.user_id=auth.uid();
 insert into public.meme_comments(meme_id,conference_id,actor,author_label,body)
 values(m.id,m.conference_id,v_actor,v_label,v_body) returning id into v_id;
 return v_id;
end;
$$;
create or replace function public.remove_meme_comment(p_comment_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 update public.meme_comments c set removed_at=now()
 from public.committee_memes m where c.id=p_comment_id and c.meme_id=m.id
  and c.removed_at is null and m.removed_at is null
  and public.can_access_meme_gallery(m.conference_id,m.chairs_only)
  and (c.actor=public.meme_actor(m.conference_id) or public.can_moderate_meme_gallery(m.conference_id,m.committee_id));
 return found;
end;
$$;
commit;
