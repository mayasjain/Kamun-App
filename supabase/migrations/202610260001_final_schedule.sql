-- KAMUN 2026 final public programme supplied as three day-by-day images.
-- All timestamps are Europe/Berlin (CET, UTC+01:00).
-- This replaces the provisional values imported on 2026-10-21.
-- Friday's 13:30/13:45 Session I start and high-school/university social
-- timings are shown together in one general entry, as requested.
-- DISEC is named for the How to MUN workshop but is not in the current
-- committee catalog; keep it in the description rather than invent a row.

begin;

insert into public.schedule_events (
  id, conference_id, committee_id, title, description, event_type,
  room_name, starts_at, ends_at, published
) values
  ('aa9dca87-0cbd-5621-a070-836b999f8445', '10000000-0000-4000-8000-000000000001', null,
   'Registration', null, 'other', 'Entrance Hall, Karlshochschule',
   '2026-11-13 10:30:00+01', '2026-11-13 11:30:00+01', true),
  ('a0751eb3-8b3b-54ff-ae43-0bbfa1f3f097', '10000000-0000-4000-8000-000000000001', null,
   'Opening Ceremony', null, 'ceremony', 'Play Space, Karlshochschule',
   '2026-11-13 11:30:00+01', '2026-11-13 12:30:00+01', true),
  ('904677c4-b4cb-5d1e-adc3-7350a7d11670', '10000000-0000-4000-8000-000000000001', null,
   'How to MUN Workshop', 'For ILO, COPUOS, EP and DISEC.', 'other', 'Play Space, Karlshochschule',
   '2026-11-13 12:30:00+01', '2026-11-13 13:30:00+01', true),
  ('bd5f7849-0a74-5935-8d97-7eda678738c5', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',
   'WHO Committee Workshop', null, 'other', 'Committee rooms',
   '2026-11-13 12:45:00+01', '2026-11-13 13:15:00+01', true),
  ('0d210dff-c21e-5af6-87d3-7ec49e2e613c', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000008',
   'UNSC Committee Workshop', null, 'other', 'Committee rooms',
   '2026-11-13 12:45:00+01', '2026-11-13 13:15:00+01', true),
  ('06f32651-e476-591c-a234-54c781dd5d07', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000007',
   'USCC Committee Workshop', null, 'other', 'Committee rooms',
   '2026-11-13 12:45:00+01', '2026-11-13 13:15:00+01', true),
  ('0497826a-754b-517b-93e9-80d9cac7485c', '10000000-0000-4000-8000-000000000001', null,
   'Committee Session I', 'The programme shows a 13:30 or 13:45 start depending on committee; confirm with your chair.', 'session', 'Committee rooms',
   '2026-11-13 13:30:00+01', '2026-11-13 16:00:00+01', true),
  ('fc55765a-4b11-516c-b11d-cb0cbf872aa0', '10000000-0000-4000-8000-000000000001', null,
   'Take Out Dinner', null, 'break', 'Committee rooms',
   '2026-11-13 16:00:00+01', '2026-11-13 16:30:00+01', true),
  ('ce4542c7-aeae-53c9-9bfc-2a3df72004c5', '10000000-0000-4000-8000-000000000001', null,
   'Social 1', 'High school: 18:00–22:00. University: 18:30–22:30.', 'social', 'Europabad',
   '2026-11-13 18:00:00+01', '2026-11-13 22:30:00+01', true),
  ('a893d4e6-3ad1-5858-8bac-f2b92d1389e9', '10000000-0000-4000-8000-000000000001', null,
   'After Social (University)', 'Location to be announced.', 'social', null,
   '2026-11-13 22:30:00+01', '2026-11-14 01:30:00+01', true),

  ('056075a5-d98c-5d12-8ec8-d276d38ae0a7', '10000000-0000-4000-8000-000000000001', null,
   'Breakfast', null, 'break', '20.30 Mathematik, Foyer Mathebau',
   '2026-11-14 08:30:00+01', '2026-11-14 09:00:00+01', true),
  ('797e6389-f11b-54b5-8a63-caf97fbc59b4', '10000000-0000-4000-8000-000000000001', null,
   'Committee Session II', null, 'session', 'Committee rooms',
   '2026-11-14 09:00:00+01', '2026-11-14 10:30:00+01', true),
  ('21a99e8c-c248-5b7c-82eb-47c890adabeb', '10000000-0000-4000-8000-000000000001', null,
   'Break', null, 'break', null,
   '2026-11-14 10:30:00+01', '2026-11-14 11:00:00+01', true),
  ('2d27407c-cc12-55c2-a54a-f693b1438618', '10000000-0000-4000-8000-000000000001', null,
   'Committee Session III', null, 'session', 'Committee rooms',
   '2026-11-14 11:00:00+01', '2026-11-14 12:45:00+01', true),
  ('eef16e3a-1b4b-513a-ab22-a48cd3f24a67', '10000000-0000-4000-8000-000000000001', null,
   'Lunch', null, 'break', '20.30 Mathematik, Foyer Mathebau',
   '2026-11-14 12:45:00+01', '2026-11-14 14:00:00+01', true),
  ('f2b2c03a-7a53-5d10-b852-675bb03983af', '10000000-0000-4000-8000-000000000001', null,
   'Committee Session IV', null, 'session', 'Committee rooms',
   '2026-11-14 14:00:00+01', '2026-11-14 15:30:00+01', true),
  ('6ec8f863-a74d-5344-a0f3-b3e932029eec', '10000000-0000-4000-8000-000000000001', null,
   'Break', null, 'break', null,
   '2026-11-14 15:30:00+01', '2026-11-14 16:00:00+01', true),
  ('561b3db9-0228-5862-a905-7b273f0b9db2', '10000000-0000-4000-8000-000000000001', null,
   'Committee Session V', null, 'session', 'Committee rooms',
   '2026-11-14 16:00:00+01', '2026-11-14 18:00:00+01', true),
  ('7930e643-081c-5700-bd2c-f07383460419', '10000000-0000-4000-8000-000000000001', null,
   'Take Out Dinner', null, 'break', '20.30 Mathematik, Foyer Mathebau',
   '2026-11-14 18:00:00+01', '2026-11-14 18:30:00+01', true),
  ('e8aa7758-6238-56d2-9a77-a8ac46f58810', '10000000-0000-4000-8000-000000000001', null,
   'Social 2', null, 'social', 'Begegnungsstätte Grötzingen',
   '2026-11-14 20:00:00+01', '2026-11-15 02:30:00+01', true),

  ('a254ae7b-be9a-5f20-bb89-53183e9029ce', '10000000-0000-4000-8000-000000000001', null,
   'Breakfast', null, 'break', '20.30 Mathematik, Foyer Mathebau',
   '2026-11-15 09:30:00+01', '2026-11-15 10:00:00+01', true),
  ('bea99e6a-8843-5fac-a5cf-076787c4f597', '10000000-0000-4000-8000-000000000001', null,
   'Committee Session VI', null, 'session', 'Committee rooms',
   '2026-11-15 10:00:00+01', '2026-11-15 12:00:00+01', true),
  ('35ef9bd9-f8ca-57c0-a3a7-9be49520b240', '10000000-0000-4000-8000-000000000001', null,
   'Lunch', null, 'break', '20.30 Mathematik, Foyer Mathebau',
   '2026-11-15 12:00:00+01', '2026-11-15 13:15:00+01', true),
  ('204933f4-6ab2-5d80-ba0d-509e4e2ed87b', '10000000-0000-4000-8000-000000000001', null,
   'Committee Session VII', null, 'session', 'Committee rooms',
   '2026-11-15 13:15:00+01', '2026-11-15 15:30:00+01', true),
  ('98b3018c-ec4e-540e-899d-d0ce68622f41', '10000000-0000-4000-8000-000000000001', null,
   'Closing Ceremony', null, 'ceremony', '11.40 Johann-Gottfried-Tulla Hörsaal, Kollegiengebäude am Ehrenhof',
   '2026-11-15 15:45:00+01', '2026-11-15 17:00:00+01', true)
on conflict (id) do update set
  committee_id = excluded.committee_id,
  title = excluded.title,
  description = excluded.description,
  event_type = excluded.event_type,
  room_name = excluded.room_name,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  published = excluded.published;

-- IPC's provisional Friday workshop does not appear in the final images.
update public.schedule_events
set published = false
where id = '66d64127-4ef4-58e1-bc2f-4764b663d0e1'
  and conference_id = '10000000-0000-4000-8000-000000000001';

commit;
