-- Existing announcements remain visible to everyone. Organisers can now choose
-- whether a new update is for everyone, chairs, or delegates.
alter table public.announcements
  add column audience text not null default 'all'
  constraint announcements_audience_valid check (audience in ('all', 'chair', 'member'));

drop policy "published announcements are public" on public.announcements;

create function public.can_read_announcement(p_conference_id uuid, p_audience text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_audience = 'all' or exists (
    select 1
    from public.attendee_memberships as membership
    where membership.conference_id = p_conference_id
      and membership.user_id = auth.uid()
      and membership.access_type = p_audience
  );
$$;

revoke all on function public.can_read_announcement(uuid, text) from public;
grant execute on function public.can_read_announcement(uuid, text) to anon, authenticated;

create policy "published announcements reach their audience"
on public.announcements for select to anon, authenticated
using (
  published
  and published_at <= now()
  and (expires_at is null or expires_at > now())
  and public.can_read_announcement(conference_id, audience)
);

create index announcements_audience_idx
  on public.announcements (conference_id, audience, published_at desc)
  where published;

-- The existing shared member code is shown as "Delegate" in the app.
update public.attendee_access_codes
set label = 'Delegate'
where conference_id = '10000000-0000-4000-8000-000000000001'
  and access_type = 'member'
  and label = 'Committee member';
