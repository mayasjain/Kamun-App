alter table public.committees
  add column if not exists experience_level text,
  add column if not exists participant_group text,
  add column if not exists display_order integer not null default 0;

create table public.committee_chairs (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (committee_id, name)
);

create index committee_chairs_committee_order_idx
  on public.committee_chairs (committee_id, sort_order);

create trigger committee_chairs_set_updated_at
before update on public.committee_chairs
for each row execute function public.set_updated_at();

alter table public.committee_chairs enable row level security;

create policy "published committee chairs are public"
on public.committee_chairs for select to anon, authenticated
using (published);

create policy "admins manage committee chairs"
on public.committee_chairs for all to authenticated
using (public.is_kamun_admin())
with check (public.is_kamun_admin());

grant select on public.committee_chairs to anon, authenticated;
grant insert, update, delete on public.committee_chairs to authenticated;

update public.committees set experience_level = 'Beginner', participant_group = 'High school', display_order = 1 where abbreviation = 'ILO';
update public.committees set experience_level = 'Beginner', participant_group = null, display_order = 2 where abbreviation = 'COPUOS';
update public.committees set experience_level = 'Beginner', participant_group = null, display_order = 3 where abbreviation = 'EP';
update public.committees set experience_level = 'Intermediate', participant_group = 'High school', display_order = 4 where abbreviation = 'IAEA';
update public.committees set experience_level = 'Intermediate', participant_group = null, display_order = 5 where abbreviation = 'PIF';
update public.committees set experience_level = 'Intermediate', participant_group = null, display_order = 6 where abbreviation = 'WHO';
update public.committees set experience_level = 'Expert', participant_group = null, display_order = 7 where abbreviation = 'USCC';
update public.committees set experience_level = 'Expert', participant_group = null, display_order = 8 where abbreviation = 'UNSC';
update public.committees set experience_level = 'Open', participant_group = null, display_order = 9 where abbreviation = 'IPC';

insert into public.committee_chairs (committee_id, name, sort_order)
select committee.id, chair.name, chair.sort_order
from public.committees as committee
join (values
  ('ILO', 'Joshua Lane', 1), ('ILO', 'Marlene Lack', 2), ('ILO', 'Sophia Hummel', 3),
  ('COPUOS', 'Leonard Hohnschild', 1), ('COPUOS', 'Victoria Hirsekorn', 2),
  ('EP', 'Jan Gehrmann', 1), ('EP', 'Bobby Yu', 2),
  ('IAEA', 'Julia Regis Walsh Rangel', 1), ('IAEA', 'Carlos Kuban', 2),
  ('PIF', 'Alexandra Scherrer', 1), ('PIF', 'Noah Ries', 2),
  ('WHO', 'Eliane Schatz', 1), ('WHO', 'Florian Alexander Grether', 2), ('WHO', 'Nik Protzen', 3),
  ('USCC', 'Camille Imbert', 1), ('USCC', 'Nico Stein', 2), ('USCC', 'Mihnea Pînzaru', 3),
  ('UNSC', 'Kesav Menon', 1), ('UNSC', 'Nicolas Drew', 2), ('UNSC', 'Cassandra Rohleder', 3),
  ('IPC', 'Jacqueline Kess', 1), ('IPC', 'Tim Bayer', 2), ('IPC', 'Karoline Martinussen', 3)
) as chair(abbreviation, name, sort_order)
  on chair.abbreviation = committee.abbreviation
where committee.conference_id = '10000000-0000-4000-8000-000000000001'
on conflict (committee_id, name) do update set
  sort_order = excluded.sort_order,
  published = true;
