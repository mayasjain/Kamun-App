begin;
-- Authors can remove their posts from galleries they can currently access.
-- Existing chair/admin moderation scope is preserved.
create or replace function public.remove_committee_meme(p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 update public.committee_memes m set removed_at=now()
 where m.id=p_id and m.removed_at is null
 and (
  (m.author_id=auth.uid() and public.can_access_meme_gallery(m.conference_id,m.chairs_only))
  or public.can_moderate_meme_gallery(m.conference_id,m.committee_id)
 );
 return found;
end;
$$;
commit;
