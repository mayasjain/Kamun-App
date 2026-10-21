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
