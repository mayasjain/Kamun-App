-- Participants may browse every gallery, but post only to General or their own committee.
begin;
create or replace function public.post_committee_meme(p_conference_id uuid,p_committee_id uuid,p_image_path text,p_caption text default '') returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
 if not public.has_current_attendee_access(p_conference_id) then raise exception 'Current participant access required'; end if;
 if p_committee_id is not null and not public.has_current_attendee_access(p_conference_id,null,p_committee_id) then
  raise exception 'You can post only to General or your own committee' using errcode='42501';
 end if;
 if p_committee_id is not null and not exists(select 1 from public.committees c join public.conferences f on f.id=c.conference_id where c.id=p_committee_id and c.conference_id=p_conference_id and c.published and f.published) then raise exception 'Committee unavailable'; end if;
 if split_part(p_image_path,'/',1)<>auth.uid()::text or split_part(p_image_path,'/',2)<>p_conference_id::text or not exists(select 1 from storage.objects where bucket_id='committee-memes' and name=p_image_path and owner_id=auth.uid()::text) then raise exception 'Upload a photo first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,51));
 if (select count(*) from public.committee_memes where author_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'You have posted ten memes this hour. Try again later.'; end if;
 insert into public.committee_memes(conference_id,committee_id,author_id,image_path,caption) values(p_conference_id,p_committee_id,auth.uid(),p_image_path,trim(coalesce(p_caption,''))) returning id into result;
 return result;
end; $$;

commit;
