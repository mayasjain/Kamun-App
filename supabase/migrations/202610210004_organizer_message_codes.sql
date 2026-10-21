-- A private, revocable code grants only permission to read and publish KAMUN
-- announcements. It does not grant the broader admin_profiles privileges.
begin;

create table public.organizer_message_codes (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  code_hash text not null unique,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.organizer_message_permissions (
  conference_id uuid not null references public.conferences(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  code_id uuid not null references public.organizer_message_codes(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  primary key (conference_id, user_id)
);

create index organizer_message_permissions_user_idx
  on public.organizer_message_permissions (user_id);

alter table public.organizer_message_codes enable row level security;
alter table public.organizer_message_permissions enable row level security;
revoke all on public.organizer_message_codes, public.organizer_message_permissions from public, anon, authenticated;

create function public.my_organizer_message_conference()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select permission.conference_id
  from public.organizer_message_permissions as permission
  join public.organizer_message_codes as code on code.id = permission.code_id
    and code.conference_id = permission.conference_id
  where permission.user_id = auth.uid()
    and code.active
    and (code.expires_at is null or code.expires_at > now())
  limit 1;
$$;

create function public.can_publish_organizer_message(p_conference_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizer_message_permissions as permission
    join public.organizer_message_codes as code on code.id = permission.code_id
      and code.conference_id = permission.conference_id
    where permission.user_id = auth.uid()
      and permission.conference_id = p_conference_id
      and code.active
      and (code.expires_at is null or code.expires_at > now())
  );
$$;

create function public.claim_organizer_message_code(p_code text)
returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_code public.organizer_message_codes%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  if p_code is null or length(trim(p_code)) < 20 then
    raise exception 'Invalid organiser code' using errcode = '22023';
  end if;

  select code.* into v_code
  from public.organizer_message_codes as code
  join public.conferences as conference on conference.id = code.conference_id
  where code.code_hash = encode(digest(upper(trim(p_code)), 'sha256'), 'hex')
    and code.active
    and (code.expires_at is null or code.expires_at > now())
    and conference.published
  limit 1;

  if v_code.id is null then
    raise exception 'Invalid organiser code' using errcode = '22023';
  end if;

  insert into public.organizer_message_permissions as permission
    (conference_id, user_id, code_id)
  values (v_code.conference_id, v_user_id, v_code.id)
  on conflict (conference_id, user_id) do update set
    code_id = excluded.code_id,
    claimed_at = now();

  return v_code.conference_id;
end;
$$;

revoke all on function public.my_organizer_message_conference() from public, anon, authenticated;
revoke all on function public.can_publish_organizer_message(uuid) from public, anon, authenticated;
revoke all on function public.claim_organizer_message_code(text) from public, anon, authenticated;
grant execute on function public.my_organizer_message_conference() to authenticated;
grant execute on function public.can_publish_organizer_message(uuid) to authenticated;
grant execute on function public.claim_organizer_message_code(text) to authenticated;

create policy "organizer code can read conference announcements"
on public.announcements for select to authenticated
using (public.can_publish_organizer_message(conference_id));

create policy "organizer code can publish conference announcements"
on public.announcements for insert to authenticated
with check (
  public.can_publish_organizer_message(conference_id)
  and committee_id is null
  and published
  and published_at is not null
  and published_at <= now() + interval '5 minutes'
);

commit;
