insert into public.conferences (
  id, slug, name, theme, starts_at, ends_at, timezone, venue_name, published
) values (
  '10000000-0000-4000-8000-000000000001',
  'kamun-2026',
  'KAMUN 2026',
  'From the Black Forest to the Global Stage',
  '2026-11-13 08:00:00+01',
  '2026-11-15 18:00:00+01',
  'Europe/Berlin',
  'Karlsruhe Institute of Technology',
  true
) on conflict (id) do nothing;

insert into public.committees (
  id, conference_id, name, abbreviation, topic, colour, room_name, published
) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'International Labour Organization', 'ILO', 'Protecting Labour Rights in the Modern Gig Economy', '#C69000', 'Room TBD', true),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'World Health Organization', 'WHO', 'Cholera Crisis (1947)', '#2F6B9A', 'Room TBD', true),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Committee on the Peaceful Uses of Outer Space', 'COPUOS', 'Developing an International Framework for Space Traffic Management', '#7A5195', 'Room TBD', true),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'European Parliament', 'EP', 'Building Europe’s Technological Independence', '#1F5AA6', 'Room TBD', true),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'International Atomic Energy Agency', 'IAEA', 'Regulating and Safeguarding Small Modular Reactors (SMRs)', '#6B7280', 'Room TBD', true),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'Pacific Islands Forum', 'PIF', 'Security Challenges in the Pacific', '#008C95', 'Room TBD', true),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'US Constitutional Convention of 1787', 'USCC', 'E Pluribus Unum: Forging the Framework for a More Perfect Union', '#9B3A32', 'Room TBD', true),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', 'United Nations Security Council', 'UNSC', 'Reevaluating the Need for UN Peacekeeping Operations Worldwide', '#1D4E89', 'Room TBD', true),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', 'International Press Corps', 'IPC', 'Reporting on the Committee Proceedings', '#4B5563', 'Room TBD', true)
on conflict (id) do update set
  name = excluded.name,
  abbreviation = excluded.abbreviation,
  topic = excluded.topic,
  colour = excluded.colour,
  room_name = excluded.room_name,
  published = excluded.published;

-- Programme drafts are imported by 202610210001_import_schedule_drafts.sql.
-- Do not recreate the superseded placeholder schedule here.

insert into public.announcements (
  conference_id, title, body, priority, published_at, published
) values (
  '10000000-0000-4000-8000-000000000001',
  'Welcome to KAMUN 2026',
  'The attendee app foundation is connected. Final operational information will be published by the Secretariat.',
  'normal',
  now(),
  true
);

insert into public.locations (
  conference_id, name, category, address, description, published
) values (
  '10000000-0000-4000-8000-000000000001',
  'Karlsruhe Institute of Technology',
  'conference',
  'Karlsruhe, Germany',
  'Primary KAMUN 2026 venue. Exact building and room information must be approved before release.',
  true
);

-- Development delegate code only. Generate private committee-specific chair
-- codes with chair_code_setup.sql after the gossip migration is applied.
insert into public.attendee_access_codes (
  conference_id, label, access_type, code_hash, active, expires_at
) values (
    '10000000-0000-4000-8000-000000000001',
    'Delegate',
    'member',
    encode(digest('KAMUN-MEMBER', 'sha256'), 'hex'),
    true,
    '2026-11-16 23:59:59+01'
  )
on conflict (conference_id, code_hash) do update set
  label = excluded.label,
  access_type = excluded.access_type,
  active = excluded.active,
  expires_at = excluded.expires_at;
