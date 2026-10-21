alter table public.committees
  add constraint committees_conference_id_id_key unique (conference_id, id);

create table public.attendee_access_codes (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  label text not null,
  access_type text not null check (access_type in ('chair', 'member')),
  committee_id uuid references public.committees(id) on delete cascade,
  code_hash text not null,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conference_id, code_hash),
  constraint attendee_code_committee_matches_conference
    foreign key (conference_id, committee_id)
    references public.committees (conference_id, id)
);

create table public.attendee_memberships (
  conference_id uuid not null references public.conferences(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_code_id uuid not null references public.attendee_access_codes(id) on delete restrict,
  access_type text not null check (access_type in ('chair', 'member')),
  committee_id uuid references public.committees(id) on delete set null,
  claimed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (conference_id, user_id),
  constraint attendee_membership_committee_matches_conference
    foreign key (conference_id, committee_id)
    references public.committees (conference_id, id)
);

create index attendee_access_codes_lookup_idx
  on public.attendee_access_codes (conference_id, code_hash)
  where active;
create index attendee_memberships_user_idx on public.attendee_memberships (user_id);
create index attendee_memberships_committee_idx on public.attendee_memberships (committee_id);

create trigger attendee_access_codes_set_updated_at
before update on public.attendee_access_codes
for each row execute function public.set_updated_at();

create trigger attendee_memberships_set_updated_at
before update on public.attendee_memberships
for each row execute function public.set_updated_at();

alter table public.attendee_access_codes enable row level security;
alter table public.attendee_memberships enable row level security;

create policy "admins manage attendee access codes"
on public.attendee_access_codes for all to authenticated
using (public.is_kamun_admin())
with check (public.is_kamun_admin());

create policy "attendees read their own membership"
on public.attendee_memberships for select to authenticated
using (user_id = auth.uid());

create policy "admins manage attendee memberships"
on public.attendee_memberships for all to authenticated
using (public.is_kamun_admin())
with check (public.is_kamun_admin());

grant select, insert, update, delete on public.attendee_access_codes to authenticated;
grant select, insert, update, delete on public.attendee_memberships to authenticated;

create or replace function public.claim_attendee_access_code(p_code text)
returns table (
  conference_id uuid,
  conference_slug text,
  access_type text,
  access_label text,
  committee_id uuid,
  committee_name text,
  committee_abbreviation text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_code public.attendee_access_codes%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  if p_code is null or length(trim(p_code)) < 4 then
    raise exception 'Invalid access code' using errcode = '22023';
  end if;

  select access_codes.*
  into v_code
  from public.attendee_access_codes as access_codes
  join public.conferences as conference on conference.id = access_codes.conference_id
  where access_codes.code_hash = encode(digest(upper(trim(p_code)), 'sha256'), 'hex')
    and access_codes.active
    and (access_codes.expires_at is null or access_codes.expires_at > now())
    and conference.published
  limit 1;

  if v_code.id is null then
    raise exception 'Invalid or expired access code' using errcode = '22023';
  end if;

  insert into public.attendee_memberships as memberships (
    conference_id,
    user_id,
    access_code_id,
    access_type,
    committee_id
  ) values (
    v_code.conference_id,
    v_user_id,
    v_code.id,
    v_code.access_type,
    v_code.committee_id
  )
  on conflict on constraint attendee_memberships_pkey do update set
    access_code_id = excluded.access_code_id,
    access_type = excluded.access_type,
    committee_id = excluded.committee_id,
    updated_at = now();

  return query
  select
    v_code.conference_id,
    conference.slug,
    v_code.access_type,
    v_code.label,
    committee.id,
    committee.name,
    committee.abbreviation
  from public.conferences as conference
  left join public.committees as committee on committee.id = v_code.committee_id
  where conference.id = v_code.conference_id;
end;
$$;

revoke all on function public.claim_attendee_access_code(text) from public;
grant execute on function public.claim_attendee_access_code(text) to authenticated;

comment on table public.attendee_access_codes is
  'Hashed shared attendee codes. Plaintext codes are never stored in this table.';
comment on function public.claim_attendee_access_code(text) is
  'Validates a shared code for the current anonymous/authenticated user and records their conference access.';
