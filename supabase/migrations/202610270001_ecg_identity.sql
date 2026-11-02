-- ECG remains the code authority. These rows contain identity metadata, never codes or peppers.
begin;

alter table public.attendee_memberships
  alter column access_code_id drop not null,
  add column identity_source text not null default 'legacy_code'
    check (identity_source in ('legacy_code', 'ecg')),
  add constraint attendee_membership_identity_source_valid
    check ((identity_source = 'legacy_code') = (access_code_id is not null));

-- The legacy claim RPC can still replace a membership until the Phase 3 cutover.
-- Keep its backing source consistent during the transition.
create function public.sync_attendee_identity_source()
returns trigger language plpgsql set search_path = public as $$
begin
  new.identity_source := case when new.access_code_id is null then 'ecg' else 'legacy_code' end;
  return new;
end;
$$;
create trigger attendee_membership_sync_identity_source
  before insert or update of access_code_id on public.attendee_memberships
  for each row execute function public.sync_attendee_identity_source();

create table public.ecg_participant_bindings (
  conference_id uuid not null references public.conferences(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ecg_person_id bigint not null check (ecg_person_id > 0),
  access_type text not null check (access_type in ('member', 'chair')),
  committee_id uuid not null,
  seat_label text,
  credential_revision text not null check (credential_revision ~ '^[0-9a-f]{64}$'),
  verified_at timestamptz not null,
  valid_until timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (conference_id, user_id),
  foreign key (conference_id, committee_id) references public.committees(conference_id, id),
  check (seat_label is null or (seat_label = btrim(seat_label) and length(seat_label) between 1 and 100)),
  check ((access_type = 'member') = (seat_label is not null)),
  check (valid_until > verified_at and valid_until <= verified_at + interval '5 minutes')
);

create index ecg_bindings_person_idx on public.ecg_participant_bindings
  (conference_id, ecg_person_id);
create index ecg_bindings_expiry_idx on public.ecg_participant_bindings (valid_until)
  where revoked_at is null;
create trigger ecg_bindings_set_updated_at before update on public.ecg_participant_bindings
  for each row execute function public.set_updated_at();

alter table public.ecg_participant_bindings enable row level security;
revoke all on public.ecg_participant_bindings from public, anon, authenticated;
grant select on public.ecg_participant_bindings to authenticated;
create policy "participants read their own ECG binding" on public.ecg_participant_bindings
  for select to authenticated using (user_id = auth.uid());
create policy "admins read ECG binding metadata" on public.ecg_participant_bindings
  for select to authenticated using (public.is_kamun_admin());

create table public.ecg_claim_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0)
);
alter table public.ecg_claim_attempts enable row level security;
revoke all on public.ecg_claim_attempts from public, anon, authenticated;

create function public.ecg_acquire_claim_attempt(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_attempts integer;
begin
  if auth.role() <> 'service_role' then raise exception 'Forbidden' using errcode = '42501'; end if;
  insert into public.ecg_claim_attempts (user_id, window_started_at, attempts)
  values (p_user_id, now(), 1)
  on conflict (user_id) do update set
    window_started_at = case when ecg_claim_attempts.window_started_at < now() - interval '15 minutes'
      then now() else ecg_claim_attempts.window_started_at end,
    attempts = case when ecg_claim_attempts.window_started_at < now() - interval '15 minutes'
      then 1 else ecg_claim_attempts.attempts + 1 end
  returning attempts into v_attempts;
  return v_attempts <= 10;
end;
$$;

create function public.ecg_bind_verified_identity(
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
  if p_kind not in ('delegate', 'chair') or p_ecg_person_id < 1
    or p_credential_revision is null or p_credential_revision !~ '^[0-9a-f]{64}$'
    or (p_kind = 'delegate' and (p_seat_label is null or length(btrim(p_seat_label)) not between 1 and 100))
    or (p_kind = 'chair' and p_seat_label is not null) then
    raise exception 'Invalid ECG identity' using errcode = '22023';
  end if;
  select c.* into v_committee from public.committees c
    join public.conferences conf on conf.id = c.conference_id
    where c.conference_id = p_conference_id and c.abbreviation = p_committee_abbreviation
      and c.published and conf.published;
  if v_committee.id is null then raise exception 'Unknown ECG committee' using errcode = '22023'; end if;
  v_type := case when p_kind = 'delegate' then 'member' else 'chair' end;

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
    case when v_type = 'member' then btrim(p_seat_label) else 'Chair' end,
    v_committee.id, v_committee.name, v_committee.abbreviation,
    case when v_type = 'member' then btrim(p_seat_label) else null end
  from public.conferences conf where conf.id=p_conference_id;
end;
$$;

create function public.ecg_refresh_verified_identity(
  p_conference_id uuid, p_user_id uuid, p_ecg_person_id bigint,
  p_credential_revision text
)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_updated boolean;
begin
  if auth.role() <> 'service_role' then raise exception 'Forbidden' using errcode = '42501'; end if;
  update public.ecg_participant_bindings
    set verified_at=now(), valid_until=now()+interval '5 minutes'
    where conference_id=p_conference_id and user_id=p_user_id
      and ecg_person_id=p_ecg_person_id and credential_revision=p_credential_revision
      and revoked_at is null returning true into v_updated;
  return coalesce(v_updated,false);
end;
$$;

create function public.ecg_revoke_verified_identity(
  p_conference_id uuid, p_ecg_person_id bigint, p_credential_revision text
)
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if auth.role() <> 'service_role' then raise exception 'Forbidden' using errcode = '42501'; end if;
  update public.ecg_participant_bindings
    set revoked_at=now()
    where conference_id=p_conference_id and ecg_person_id=p_ecg_person_id
      and credential_revision=p_credential_revision and revoked_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function public.ecg_revoke_verified_identity_all(
  p_ecg_person_id bigint, p_credential_revision text
)
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if auth.role() <> 'service_role' then raise exception 'Forbidden' using errcode = '42501'; end if;
  update public.ecg_participant_bindings
    set revoked_at=now()
    where ecg_person_id=p_ecg_person_id and credential_revision=p_credential_revision
      and revoked_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function public.has_current_ecg_binding(p_conference_id uuid, p_access_type text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ecg_participant_bindings b
    where b.conference_id=p_conference_id and b.user_id=auth.uid()
      and b.access_type=p_access_type and b.revoked_at is null and b.valid_until>now());
$$;

revoke all on function public.ecg_acquire_claim_attempt(uuid) from public,anon,authenticated;
revoke all on function public.ecg_bind_verified_identity(uuid,uuid,bigint,text,text,text,text)
  from public,anon,authenticated;
revoke all on function public.ecg_refresh_verified_identity(uuid,uuid,bigint,text)
  from public,anon,authenticated;
revoke all on function public.ecg_revoke_verified_identity(uuid,bigint,text)
  from public,anon,authenticated;
revoke all on function public.ecg_revoke_verified_identity_all(bigint,text)
  from public,anon,authenticated;
revoke all on function public.has_current_ecg_binding(uuid,text) from public,anon;
grant execute on function public.ecg_acquire_claim_attempt(uuid) to service_role;
grant execute on function public.ecg_bind_verified_identity(uuid,uuid,bigint,text,text,text,text)
  to service_role;
grant execute on function public.ecg_refresh_verified_identity(uuid,uuid,bigint,text) to service_role;
grant execute on function public.ecg_revoke_verified_identity(uuid,bigint,text) to service_role;
grant execute on function public.ecg_revoke_verified_identity_all(bigint,text) to service_role;
grant execute on function public.has_current_ecg_binding(uuid,text) to authenticated;

commit;
