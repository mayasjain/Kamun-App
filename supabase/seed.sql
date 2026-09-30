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
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'United Nations Educational, Scientific and Cultural Organization', 'UNESCO', 'Preserving World Heritage in Conflict Zones', '#0B6E69', 'Room TBD', true),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'World Health Organization', 'WHO', 'Global Response to Future Pandemics', '#2F6B9A', 'Room TBD', true),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Committee on the Peaceful Uses of Outer Space', 'COPUOS', 'International Cooperation in Space Exploration', '#7A5195', 'Room TBD', true)
on conflict (id) do nothing;

insert into public.schedule_events (
  conference_id, title, event_type, room_name, starts_at, ends_at, published
) values
  ('10000000-0000-4000-8000-000000000001', 'Opening ceremony', 'ceremony', 'Main hall', '2026-11-13 09:00:00+01', '2026-11-13 10:00:00+01', true),
  ('10000000-0000-4000-8000-000000000001', 'Committee session I', 'session', 'Committee room', '2026-11-13 10:15:00+01', '2026-11-13 12:30:00+01', true),
  ('10000000-0000-4000-8000-000000000001', 'Lunch break', 'break', 'Conference area', '2026-11-13 12:30:00+01', '2026-11-13 13:30:00+01', true),
  ('10000000-0000-4000-8000-000000000001', 'Committee session II', 'session', 'Committee room', '2026-11-13 13:30:00+01', '2026-11-13 16:00:00+01', true);

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

-- Development codes only. Replace these before production and distribute them privately.
insert into public.attendee_access_codes (
  conference_id, label, access_type, code_hash, active, expires_at
) values
  (
    '10000000-0000-4000-8000-000000000001',
    'Chair',
    'chair',
    encode(digest('KAMUN-CHAIR', 'sha256'), 'hex'),
    true,
    '2026-11-16 23:59:59+01'
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    'Committee member',
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
