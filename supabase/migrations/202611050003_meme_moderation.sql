-- Only committee chairs and organiser/admin accounts may remove memes.
begin;
create or replace function public.can_moderate_meme_gallery(p_conference_id uuid,p_committee_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select public.is_kamun_admin() or (
  p_committee_id is not null
  and public.has_current_attendee_access(p_conference_id,'chair',p_committee_id)
 );
$$;
revoke all on function public.can_moderate_meme_gallery(uuid,uuid) from public,anon;
grant execute on function public.can_moderate_meme_gallery(uuid,uuid) to authenticated;

create or replace function public.remove_committee_meme(p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 update public.committee_memes set removed_at=now()
 where id=p_id and removed_at is null
 and public.can_moderate_meme_gallery(conference_id,committee_id);
 return found;
end;
$$;
-- Disable reporting for older app versions as well. Existing reports are retained.
revoke all on function public.report_committee_meme(uuid,text) from public,anon,authenticated;
commit;
