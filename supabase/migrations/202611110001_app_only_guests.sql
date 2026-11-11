begin;
-- Guests have app access without committee, coffee, chair or administrator privileges.
alter table public.ecg_participant_bindings alter column committee_id drop not null;
alter table public.ecg_participant_bindings drop constraint ecg_participant_bindings_access_type_check;
alter table public.ecg_participant_bindings add constraint ecg_participant_bindings_access_type_check
 check(access_type in ('member','chair','faculty_adviser','observer'));
alter table public.ecg_participant_bindings add constraint ecg_guest_scope
 check(case when access_type in ('faculty_adviser','observer') then committee_id is null and seat_label is null else committee_id is not null end);
alter table public.attendee_memberships drop constraint attendee_memberships_access_type_check;
alter table public.attendee_memberships add constraint attendee_memberships_access_type_check
 check(access_type in ('member','chair','faculty_adviser','observer'));
alter table public.attendee_memberships add constraint attendee_guest_scope
 check(access_type not in ('faculty_adviser','observer') or (identity_source='ecg' and committee_id is null));
create or replace function public.ecg_bind_verified_identity(
  p_conference_id uuid, p_user_id uuid, p_ecg_person_id bigint,
  p_kind text, p_committee_abbreviation text, p_seat_label text,
  p_credential_revision text
)
returns table (conference_id uuid, conference_slug text, access_type text,
  access_label text, committee_id uuid, committee_name text,
  committee_abbreviation text, seat_label text)
language plpgsql security definer set search_path = public as $$
declare
  v_committee public.committees%rowtype;
  v_type text;
begin
  if auth.role() <> 'service_role' then raise exception 'Forbidden' using errcode = '42501'; end if;
  if p_kind is null or p_kind not in ('delegate', 'chair', 'faculty_adviser', 'observer') or p_ecg_person_id < 1
    or p_credential_revision is null or p_credential_revision !~ '^[0-9a-f]{64}$'
    or (p_kind = 'delegate' and (p_seat_label is null or length(btrim(p_seat_label)) not between 1 and 100))
    or (p_kind <> 'delegate' and p_seat_label is not null)
    or (p_kind in ('faculty_adviser','observer') and p_committee_abbreviation is not null) then
    raise exception 'Invalid ECG identity' using errcode = '22023';
  end if;
  if p_kind in ('faculty_adviser','observer') then
    if not exists(select 1 from public.conferences where id=p_conference_id and published) then raise exception 'Conference unavailable'; end if;
  else
  select c.* into v_committee from public.committees c
    join public.conferences conf on conf.id = c.conference_id
    where c.conference_id = p_conference_id and c.abbreviation = p_committee_abbreviation
      and c.published and conf.published;
  if v_committee.id is null then raise exception 'Unknown ECG committee' using errcode = '22023'; end if;
  end if;
  v_type := case when p_kind = 'delegate' then 'member' else p_kind end;

  insert into public.ecg_participant_bindings as b
    (conference_id,user_id,ecg_person_id,access_type,committee_id,seat_label,
      credential_revision,verified_at,valid_until,revoked_at)
  values (p_conference_id,p_user_id,p_ecg_person_id,v_type,v_committee.id,
    case when v_type = 'member' then btrim(p_seat_label) else null end,
    p_credential_revision,now(),now() + interval '5 minutes',null)
  on conflict on constraint ecg_participant_bindings_pkey do update set
    ecg_person_id=excluded.ecg_person_id, access_type=excluded.access_type,
    committee_id=excluded.committee_id, seat_label=excluded.seat_label,
    credential_revision=excluded.credential_revision,verified_at=excluded.verified_at,
    valid_until=excluded.valid_until,revoked_at=null;

  insert into public.attendee_memberships as m
    (conference_id,user_id,access_code_id,access_type,committee_id,identity_source)
  values (p_conference_id,p_user_id,null,v_type,v_committee.id,'ecg')
  on conflict on constraint attendee_memberships_pkey do update set
    access_code_id=null, access_type=excluded.access_type,
    committee_id=excluded.committee_id,identity_source='ecg',updated_at=now();

  return query select p_conference_id, conf.slug, v_type,
    case v_type when 'member' then btrim(p_seat_label) when 'chair' then 'Chair' when 'faculty_adviser' then 'Faculty adviser' else 'Observer' end,
    v_committee.id, v_committee.name, v_committee.abbreviation,
    case when v_type = 'member' then btrim(p_seat_label) else null end
  from public.conferences conf where conf.id=p_conference_id;
end;
$$;

create or replace function public.has_current_attendee_access(
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
          and b.access_type = m.access_type and b.committee_id is not distinct from m.committee_id)
      )
  );
$$;
revoke all on function public.has_current_attendee_access(uuid,text,uuid) from public,anon;
grant execute on function public.has_current_attendee_access(uuid,text,uuid) to authenticated;

create or replace function public.my_current_attendee_profile(p_conference_id uuid)
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
      when m.access_type = 'faculty_adviser' then 'Faculty adviser'
      when m.access_type = 'observer' then 'Observer'
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

alter table public.web_push_subscriptions drop constraint web_push_subscriptions_kind_check;
alter table public.web_push_subscriptions add constraint web_push_subscriptions_kind_check check(kind in ('delegate','chair','kamun_admin','faculty_adviser','observer'));
create or replace function public.web_push_identity(p_user uuid,p_conference uuid)
returns table(person_id bigint,revision text,kind text,committee text,seat text,valid_until timestamptz)
language sql stable security definer set search_path=public as $$
 select b.ecg_person_id,b.credential_revision,'kamun_admin'::text,null::text,null::text,b.valid_until
 from public.ecg_admin_bindings b where b.user_id=p_user and b.conference_id=p_conference and b.revoked_at is null
 union all
 select b.ecg_person_id,b.credential_revision,case b.access_type when 'member' then 'delegate' else b.access_type end,c.abbreviation,b.seat_label,b.valid_until
 from public.ecg_participant_bindings b left join public.committees c on c.id=b.committee_id
 join public.attendee_memberships m on m.user_id=b.user_id and m.conference_id=b.conference_id and m.identity_source='ecg'
 where b.user_id=p_user and b.conference_id=p_conference and b.revoked_at is null;
$$;

update public.attendee_access_codes set active=false where conference_id='10000000-0000-4000-8000-000000000001';
delete from public.attendee_memberships where conference_id='10000000-0000-4000-8000-000000000001' and identity_source='legacy_code';
commit;
