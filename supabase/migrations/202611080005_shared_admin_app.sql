begin;
-- ECG admins are scoped to their conference; recovery admins retain their existing scope.
create function public.is_conference_admin(p_conference_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.admin_profiles where user_id=auth.uid())
 or exists(select 1 from public.ecg_admin_bindings where user_id=auth.uid()
 and conference_id=p_conference_id and revoked_at is null and valid_until>now());
$$;
revoke all on function public.is_conference_admin(uuid) from public,anon;
grant execute on function public.is_conference_admin(uuid) to authenticated;

create function public.remove_conference_content(p_conference_id uuid,p_table text,p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not public.is_conference_admin(p_conference_id) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_table not in ('announcements','schedule_events','resources') or p_table is null then raise exception 'Invalid content type' using errcode='22023'; end if;
 execute format('update public.%I set published=false where id=$1 and conference_id=$2 and published returning id',p_table)
 into p_id using p_id,p_conference_id;
 return p_id is not null;
end;
$$;
revoke all on function public.remove_conference_content(uuid,text,uuid) from public,anon;
grant execute on function public.remove_conference_content(uuid,text,uuid) to authenticated;


create or replace function public.reserve_meme_upload(p_conference_id uuid,p_content_type text)
returns text language plpgsql security definer set search_path=public as $$
declare
 v_user uuid := auth.uid();
 v_count bigint;
 v_path text;
 v_extension text;
begin
 if v_user is null or (not public.has_current_attendee_access(p_conference_id) and not public.is_conference_admin(p_conference_id)) then
  raise exception 'Current participant access required' using errcode='42501';
 end if;
 v_extension := case p_content_type when 'image/jpeg' then 'jpeg'
  when 'image/png' then 'png' when 'image/webp' then 'webp' end;
 if v_extension is null then
  raise exception 'Choose a JPG, PNG or WebP photo' using errcode='22023';
 end if;

 -- Atomic UPDATE serializes allocation, including concurrent accounts. With
 -- the bucket's 8 MiB object limit, 2,000 paths bound retained bytes to 16 GiB.
 update public.meme_upload_budgets set issued=issued+1
  where budget_key='bucket' and issued<2000 returning issued into v_count;
 if not found then
  raise exception 'The gallery upload capacity has been reached' using errcode='54000';
 end if;
 insert into public.meme_upload_budgets as b(budget_key,issued)
  values('user:' || v_user::text,1)
  on conflict(budget_key) do update set issued=b.issued+1 where b.issued<100
  returning issued into v_count;
 if not found then
  raise exception 'Your gallery upload capacity has been reached' using errcode='54000';
 end if;
 if (select count(*) from public.meme_upload_reservations
     where user_id=v_user and created_at>now()-interval '1 hour')>=10 then
  raise exception 'You have started ten uploads this hour. Try again later.' using errcode='54000';
 end if;
 v_path := v_user::text || '/' || p_conference_id::text || '/' || gen_random_uuid()::text || '.' || v_extension;
 insert into public.meme_upload_reservations(image_path,user_id,conference_id)
  values(v_path,v_user,p_conference_id);
 return v_path;
end;
$$;

create or replace function public.can_upload_reserved_meme(p_path text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.meme_upload_reservations r
  where r.image_path=p_path and r.user_id=auth.uid() and r.expires_at>now()
   and (public.has_current_attendee_access(r.conference_id) or public.is_conference_admin(r.conference_id)));
$$;

create or replace function public.post_committee_meme(p_conference_id uuid,p_committee_id uuid,p_image_path text,p_caption text default '') returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
 if (not public.has_current_attendee_access(p_conference_id) and not public.is_conference_admin(p_conference_id)) then raise exception 'Current participant access required'; end if;
 if p_committee_id is not null and not public.is_conference_admin(p_conference_id) and not public.has_current_attendee_access(p_conference_id,null,p_committee_id) then
  raise exception 'You can post only to General or your own committee' using errcode='42501';
 end if;
 if p_committee_id is not null and not exists(select 1 from public.committees c join public.conferences f on f.id=c.conference_id where c.id=p_committee_id and c.conference_id=p_conference_id and c.published and f.published) then raise exception 'Committee unavailable'; end if;
 if split_part(p_image_path,'/',1)<>auth.uid()::text or split_part(p_image_path,'/',2)<>p_conference_id::text or not exists(select 1 from storage.objects where bucket_id='committee-memes' and name=p_image_path and owner_id=auth.uid()::text) then raise exception 'Upload a photo first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,51));
 if (select count(*) from public.committee_memes where author_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'You have posted ten memes this hour. Try again later.'; end if;
 insert into public.committee_memes(conference_id,committee_id,author_id,image_path,caption) values(p_conference_id,p_committee_id,auth.uid(),p_image_path,trim(coalesce(p_caption,''))) returning id into result;
 return result;
end; $$;

create or replace function public.can_access_meme_gallery(p_conference_id uuid,p_chairs_only boolean)
returns boolean language sql stable security definer set search_path=public as $$
 select public.is_conference_admin(p_conference_id) or public.has_current_attendee_access(
  p_conference_id,case when p_chairs_only then 'chair'::text else null::text end);
$$;

create or replace function public.post_chair_meme(p_conference_id uuid,p_image_path text,p_caption text default '')
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if not public.has_current_attendee_access(p_conference_id,'chair') and not public.is_conference_admin(p_conference_id) then
  raise exception 'Only current chairs can post in Chairs' using errcode='42501';
 end if;
 -- Reuse ownership, upload validation, caption constraints and shared posting limits.
 v_id:=public.post_committee_meme(p_conference_id,null,p_image_path,p_caption);
 update public.committee_memes set chairs_only=true where id=v_id;
 return v_id;
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
 if public.is_conference_admin(m.conference_id) then v_label:='Administrator'; end if;
 insert into public.meme_comments(meme_id,conference_id,actor,author_label,body)
 values(m.id,m.conference_id,v_actor,v_label,v_body) returning id into v_id;
 return v_id;
end;
$$;

create or replace function public.can_moderate_meme_gallery(p_conference_id uuid,p_committee_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select public.is_conference_admin(p_conference_id) or (
  p_committee_id is not null
  and public.has_current_attendee_access(p_conference_id,'chair',p_committee_id)
 );
$$;

create or replace function public.meme_actor(p_conference_id uuid) returns text
language sql stable security definer set search_path=public as $$
 select coalesce((select 'ecg-admin:' || ecg_person_id::text from public.ecg_admin_bindings
 where conference_id=p_conference_id and user_id=auth.uid() and revoked_at is null and valid_until>now()),
 (select 'admin:' || auth.uid()::text where exists(select 1 from public.admin_profiles where user_id=auth.uid())),
 (select case when m.identity_source='ecg' then 'ecg:' || b.ecg_person_id::text
  else 'legacy:' || m.access_code_id::text end
 from public.attendee_memberships m left join public.ecg_participant_bindings b
  on b.conference_id=m.conference_id and b.user_id=m.user_id
 where m.conference_id=p_conference_id and m.user_id=auth.uid()
  and public.has_current_attendee_access(p_conference_id) limit 1));
$$;

commit;
