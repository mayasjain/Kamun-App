begin;

-- The shared delegate code must not remain a parallel login after ECG cutover.
update public.attendee_access_codes
set active = false
where conference_id = '10000000-0000-4000-8000-000000000001'
  and access_type = 'member';

delete from public.attendee_memberships
where conference_id = '10000000-0000-4000-8000-000000000001'
  and identity_source = 'legacy_code' and access_type = 'member';

alter table public.attendee_memberships
  add constraint no_legacy_kamun_delegate_login
  check (conference_id <> '10000000-0000-4000-8000-000000000001'
    or identity_source <> 'legacy_code' or access_type <> 'member');

-- Old chair codes continue until ECG chair codes have been distributed.
create function public.my_current_attendee_profile(p_conference_id uuid)
returns table (
  conference_id uuid, conference_slug text, access_type text, access_label text,
  committee_id uuid, committee_name text, committee_abbreviation text,
  seat_label text, identity_source text
)
language sql stable security definer set search_path = public as $$
  select m.conference_id, conf.slug, m.access_type,
    case when m.identity_source = 'ecg' and m.access_type = 'member'
      then b.seat_label
      when m.access_type = 'chair' then 'Chair'
      else coalesce(c.label, 'Delegate') end,
    m.committee_id, committee.name, committee.abbreviation,
    case when m.identity_source = 'ecg' then b.seat_label else null end,
    m.identity_source
  from public.attendee_memberships m
  join public.conferences conf on conf.id = m.conference_id
  left join public.committees committee on committee.id = m.committee_id
  left join public.attendee_access_codes c on c.id = m.access_code_id
  left join public.ecg_participant_bindings b
    on b.conference_id = m.conference_id and b.user_id = m.user_id
  where m.conference_id = p_conference_id and m.user_id = auth.uid()
    and public.has_current_attendee_access(m.conference_id, m.access_type, m.committee_id)
  limit 1;
$$;
revoke all on function public.my_current_attendee_profile(uuid) from public, anon;
grant execute on function public.my_current_attendee_profile(uuid) to authenticated;

commit;
