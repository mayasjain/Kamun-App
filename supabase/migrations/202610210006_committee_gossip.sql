-- Private committee gossip inboxes. Run before chair_code_setup.sql.
-- Existing generic chair codes are retired when the new codes are generated.
begin;

create table public.committee_gossip (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null,
  committee_id uuid not null,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 3 and 500),
  status text not null default 'new' check (status in ('new', 'read', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint gossip_committee_matches_conference foreign key (conference_id, committee_id)
    references public.committees (conference_id, id) on delete cascade
);

create index committee_gossip_inbox_idx
  on public.committee_gossip (conference_id, committee_id, created_at desc);
create index committee_gossip_sender_time_idx
  on public.committee_gossip (sender_user_id, created_at desc);

alter table public.committee_gossip enable row level security;
revoke all on public.committee_gossip from public, anon, authenticated;

-- No table read policy: even chairs receive only the message fields through an RPC.
-- Sender IDs are retained for rate limiting but never returned to chairs.
create function public.submit_committee_gossip(
  p_conference_id uuid, p_committee_id uuid, p_message text
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
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
  if not exists (
    select 1 from public.attendee_memberships as membership
    join public.attendee_access_codes as code on code.id = membership.access_code_id
    where membership.user_id = v_user_id
      and membership.conference_id = p_conference_id
      and membership.access_type = 'member'
      and code.conference_id = membership.conference_id
      and code.access_type = 'member'
      and code.active
      and (code.expires_at is null or code.expires_at > now())
  ) then
    raise exception 'Delegate access is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.committees as committee
    join public.conferences as conference on conference.id = committee.conference_id
    where committee.id = p_committee_id
      and committee.conference_id = p_conference_id
      and committee.published and conference.published
  ) then
    raise exception 'This committee is unavailable' using errcode = '22023';
  end if;

  -- Serialize submissions from one account so parallel requests cannot bypass limits.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  if (select count(*) from public.committee_gossip
      where sender_user_id = v_user_id and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from public.committee_gossip
      where sender_user_id = v_user_id and created_at > now() - interval '1 day') >= 30 then
    raise exception 'Submission limit reached. Please try again later' using errcode = '22023';
  end if;

  insert into public.committee_gossip (conference_id, committee_id, sender_user_id, message)
  values (p_conference_id, p_committee_id, v_user_id, v_message)
  returning id into v_id;
  return v_id;
end;
$$;

create function public.my_chair_gossip()
returns table (id uuid, committee_id uuid, message text, status text, created_at timestamptz)
language sql stable security definer
set search_path = public
as $$
  select gossip.id, gossip.committee_id, gossip.message, gossip.status, gossip.created_at
  from public.attendee_memberships as membership
  join public.attendee_access_codes as code on code.id = membership.access_code_id
  join public.committee_gossip as gossip
    on gossip.conference_id = membership.conference_id
   and gossip.committee_id = membership.committee_id
  where membership.user_id = auth.uid()
    and membership.access_type = 'chair'
    and membership.committee_id is not null
    and code.active
    and code.conference_id = membership.conference_id
    and code.access_type = 'chair'
    and code.committee_id = membership.committee_id
    and (code.expires_at is null or code.expires_at > now())
  order by gossip.created_at desc
  limit 100;
$$;

create function public.set_chair_gossip_status(p_gossip_id uuid, p_status text)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_updated boolean := false;
begin
  if p_status not in ('new', 'read', 'dismissed') then
    raise exception 'Invalid gossip status' using errcode = '22023';
  end if;
  update public.committee_gossip as gossip
  set status = p_status,
      reviewed_at = case when p_status = 'new' then null else now() end
  where gossip.id = p_gossip_id
    and exists (
      select 1 from public.attendee_memberships as membership
      join public.attendee_access_codes as code on code.id = membership.access_code_id
      where membership.user_id = auth.uid()
        and membership.access_type = 'chair'
        and membership.conference_id = gossip.conference_id
        and membership.committee_id = gossip.committee_id
        and code.active
        and code.conference_id = membership.conference_id
        and code.access_type = 'chair'
        and code.committee_id = membership.committee_id
        and (code.expires_at is null or code.expires_at > now())
    )
  returning true into v_updated;
  return coalesce(v_updated, false);
end;
$$;

revoke all on function public.submit_committee_gossip(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.my_chair_gossip() from public, anon, authenticated;
revoke all on function public.set_chair_gossip_status(uuid, text) from public, anon, authenticated;
grant execute on function public.submit_committee_gossip(uuid, uuid, text) to authenticated;
grant execute on function public.my_chair_gossip() to authenticated;
grant execute on function public.set_chair_gossip_status(uuid, text) to authenticated;

commit;
