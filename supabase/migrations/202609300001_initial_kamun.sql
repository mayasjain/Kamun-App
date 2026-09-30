create extension if not exists pgcrypto;

create table public.conferences (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  theme text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/Berlin',
  venue_name text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conferences_dates_valid check (ends_at > starts_at)
);

create table public.committees (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  name text not null,
  abbreviation text not null,
  topic text,
  colour text,
  room_name text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conference_id, abbreviation)
);

create table public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  committee_id uuid references public.committees(id) on delete cascade,
  title text not null,
  description text,
  event_type text not null default 'session',
  room_name text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_events_dates_valid check (ends_at > starts_at)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  committee_id uuid references public.committees(id) on delete cascade,
  title text not null,
  body text not null,
  priority text not null default 'normal' check (priority in ('normal', 'important', 'urgent')),
  published_at timestamptz,
  expires_at timestamptz,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  committee_id uuid references public.committees(id) on delete cascade,
  title text not null,
  kind text not null default 'general',
  url text not null,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  name text not null,
  category text not null default 'conference',
  address text,
  description text,
  latitude double precision,
  longitude double precision,
  external_maps_url text,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  label text not null,
  person_name text,
  role text,
  phone text,
  email text,
  is_emergency boolean not null default false,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint emergency_contact_has_method check (phone is not null or email is not null)
);

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('editor', 'admin')),
  created_at timestamptz not null default now()
);

create index schedule_events_conference_time_idx on public.schedule_events (conference_id, starts_at);
create index schedule_events_committee_time_idx on public.schedule_events (committee_id, starts_at);
create index announcements_conference_published_idx on public.announcements (conference_id, published_at desc);
create index resources_conference_committee_idx on public.resources (conference_id, committee_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger conferences_set_updated_at before update on public.conferences
for each row execute function public.set_updated_at();
create trigger committees_set_updated_at before update on public.committees
for each row execute function public.set_updated_at();
create trigger schedule_events_set_updated_at before update on public.schedule_events
for each row execute function public.set_updated_at();
create trigger announcements_set_updated_at before update on public.announcements
for each row execute function public.set_updated_at();
create trigger resources_set_updated_at before update on public.resources
for each row execute function public.set_updated_at();
create trigger locations_set_updated_at before update on public.locations
for each row execute function public.set_updated_at();
create trigger emergency_contacts_set_updated_at before update on public.emergency_contacts
for each row execute function public.set_updated_at();

create or replace function public.is_kamun_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles where user_id = auth.uid()
  );
$$;

revoke all on function public.is_kamun_admin() from public;
grant execute on function public.is_kamun_admin() to authenticated;

alter table public.conferences enable row level security;
alter table public.committees enable row level security;
alter table public.schedule_events enable row level security;
alter table public.announcements enable row level security;
alter table public.resources enable row level security;
alter table public.locations enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.admin_profiles enable row level security;

create policy "published conferences are public" on public.conferences
for select to anon, authenticated using (published);
create policy "published committees are public" on public.committees
for select to anon, authenticated using (published);
create policy "published schedule is public" on public.schedule_events
for select to anon, authenticated using (published);
create policy "published announcements are public" on public.announcements
for select to anon, authenticated using (
  published and published_at <= now() and (expires_at is null or expires_at > now())
);
create policy "published resources are public" on public.resources
for select to anon, authenticated using (published);
create policy "published locations are public" on public.locations
for select to anon, authenticated using (published);
create policy "published emergency contacts are public" on public.emergency_contacts
for select to anon, authenticated using (published);

create policy "admins manage conferences" on public.conferences for all to authenticated
using (public.is_kamun_admin()) with check (public.is_kamun_admin());
create policy "admins manage committees" on public.committees for all to authenticated
using (public.is_kamun_admin()) with check (public.is_kamun_admin());
create policy "admins manage schedule" on public.schedule_events for all to authenticated
using (public.is_kamun_admin()) with check (public.is_kamun_admin());
create policy "admins manage announcements" on public.announcements for all to authenticated
using (public.is_kamun_admin()) with check (public.is_kamun_admin());
create policy "admins manage resources" on public.resources for all to authenticated
using (public.is_kamun_admin()) with check (public.is_kamun_admin());
create policy "admins manage locations" on public.locations for all to authenticated
using (public.is_kamun_admin()) with check (public.is_kamun_admin());
create policy "admins manage emergency contacts" on public.emergency_contacts for all to authenticated
using (public.is_kamun_admin()) with check (public.is_kamun_admin());
create policy "admins can view admin profiles" on public.admin_profiles for select to authenticated
using (public.is_kamun_admin());

grant select on public.conferences, public.committees, public.schedule_events,
  public.announcements, public.resources, public.locations, public.emergency_contacts
to anon, authenticated;
grant insert, update, delete on public.conferences, public.committees, public.schedule_events,
  public.announcements, public.resources, public.locations, public.emergency_contacts
to authenticated;
grant select on public.admin_profiles to authenticated;
