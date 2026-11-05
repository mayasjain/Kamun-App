-- General is a separate destination; existing committee posts stay in their committees.
begin;
alter table public.committee_memes alter column committee_id drop not null;

create or replace function public.list_committee_memes(p_conference_id uuid,p_committee_id uuid default null,p_before timestamptz default null)
returns table(id uuid,committee_id uuid,image_path text,caption text,created_at timestamptz,is_own boolean)
language sql stable security definer set search_path=public as $$
 select m.id,m.committee_id,m.image_path,m.caption,m.created_at,m.author_id=auth.uid()
 from public.committee_memes m where m.conference_id=p_conference_id and m.removed_at is null
 and public.has_current_attendee_access(p_conference_id)
 and (m.committee_id is not distinct from p_committee_id)
 and (p_before is null or m.created_at<p_before)
 order by m.created_at desc,m.id desc limit 24;
$$;

create or replace function public.post_committee_meme(p_conference_id uuid,p_committee_id uuid,p_image_path text,p_caption text default '') returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
 if not public.has_current_attendee_access(p_conference_id) then raise exception 'Current participant access required'; end if;
 if p_committee_id is not null and not exists(select 1 from public.committees c join public.conferences f on f.id=c.conference_id where c.id=p_committee_id and c.conference_id=p_conference_id and c.published and f.published) then raise exception 'Committee unavailable'; end if;
 if split_part(p_image_path,'/',1)<>auth.uid()::text or split_part(p_image_path,'/',2)<>p_conference_id::text or not exists(select 1 from storage.objects where bucket_id='committee-memes' and name=p_image_path and owner_id=auth.uid()::text) then raise exception 'Upload a photo first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,51));
 if (select count(*) from public.committee_memes where author_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'You have posted ten memes this hour. Try again later.'; end if;
 insert into public.committee_memes(conference_id,committee_id,author_id,image_path,caption) values(p_conference_id,p_committee_id,auth.uid(),p_image_path,trim(coalesce(p_caption,''))) returning id into result;
 return result;
end; $$;

commit;
