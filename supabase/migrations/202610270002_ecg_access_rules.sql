begin;

-- All attendee-only reads and writes use the backing credential, not a cached profile.
create function public.has_current_attendee_access(
  p_conference_id uuid, p_access_type text default null, p_committee_id uuid default null
)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.attendee_memberships m
    left join public.attendee_access_codes c on c.id = m.access_code_id
    left join public.ecg_participant_bindings b
      on b.conference_id = m.conference_id and b.user_id = m.user_id
    where m.conference_id = p_conference_id and m.user_id = auth.uid()
      and (p_access_type is null or m.access_type = p_access_type)
      and (p_committee_id is null or m.committee_id = p_committee_id)
      and (
        (m.identity_source = 'legacy_code' and c.active
          and c.conference_id = m.conference_id and c.access_type = m.access_type
          and (c.committee_id is null or c.committee_id = m.committee_id)
          and (c.expires_at is null or c.expires_at > now()))
        or
        (m.identity_source = 'ecg' and b.revoked_at is null and b.valid_until > now()
          and b.access_type = m.access_type and b.committee_id = m.committee_id)
      )
  );
$$;
revoke all on function public.has_current_attendee_access(uuid,text,uuid) from public,anon;
grant execute on function public.has_current_attendee_access(uuid,text,uuid) to authenticated;

create or replace function public.can_read_announcement(p_conference_id uuid, p_audience text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_audience = 'all' or public.has_current_attendee_access(p_conference_id,p_audience,null);
$$;

drop policy "attendees can read published emergency contacts" on public.emergency_contacts;
create policy "attendees can read published emergency contacts"
on public.emergency_contacts for select to authenticated
using (published and public.has_current_attendee_access(conference_id,null,null));

create or replace function public.submit_committee_gossip(
  p_conference_id uuid, p_committee_id uuid, p_message text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_message text := trim(p_message);
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in with a delegate code first' using errcode = '28000';
  end if;
  if v_message is null or char_length(v_message) not between 3 and 500 then
    raise exception 'Message must be between 3 and 500 characters' using errcode = '22023';
  end if;
  if not public.has_current_attendee_access(p_conference_id,'member',null) then
    raise exception 'Delegate access is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.committees c join public.conferences conf on conf.id=c.conference_id
    where c.id=p_committee_id and c.conference_id=p_conference_id
      and c.published and conf.published
  ) then raise exception 'This committee is unavailable' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  if (select count(*) from public.committee_gossip
      where sender_user_id=v_user_id and created_at>now()-interval '10 minutes') >= 3
    or (select count(*) from public.committee_gossip
      where sender_user_id=v_user_id and created_at>now()-interval '1 day') >= 30 then
    raise exception 'Submission limit reached. Please try again later' using errcode='22023';
  end if;
  insert into public.committee_gossip (conference_id,committee_id,sender_user_id,message)
    values (p_conference_id,p_committee_id,v_user_id,v_message) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.my_chair_gossip()
returns table (id uuid, committee_id uuid, message text, status text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select g.id,g.committee_id,g.message,g.status,g.created_at
  from public.attendee_memberships m
  join public.committee_gossip g on g.conference_id=m.conference_id and g.committee_id=m.committee_id
  where m.user_id=auth.uid() and m.access_type='chair'
    and public.has_current_attendee_access(m.conference_id,'chair',m.committee_id)
  order by g.created_at desc limit 100;
$$;

create or replace function public.set_chair_gossip_status(p_gossip_id uuid,p_status text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_updated boolean := false;
begin
  if p_status not in ('new','read','dismissed') then
    raise exception 'Invalid gossip status' using errcode='22023';
  end if;
  update public.committee_gossip g
    set status=p_status,reviewed_at=case when p_status='new' then null else now() end
    where g.id=p_gossip_id and public.has_current_attendee_access(g.conference_id,'chair',g.committee_id)
    returning true into v_updated;
  return coalesce(v_updated,false);
end;
$$;

commit;
