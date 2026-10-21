-- Source: OLD Conference Schedule KAMUN 2026.xlsx, sheet "Group 1".
-- Draft import: weekday headings have no calendar dates. 13–15 November uses
-- the existing conference dates and needs confirmation before publishing.
-- Ends are interpreted from the next block / coloured cells, not explicit end labels.
-- Review: B18 takeaway end is unknown; 18:30 is the next main-column event.
-- B23 Europabad starts 18:30, but alternative C22 starts 18:00.
-- B33 after-party ends at the B39 02:30 pack-up note (following calendar day).
-- D26 ball ends at the D40 03:00 cleanup note (following calendar day).
-- F17 closing ends at the F20 17:00 blank boundary; confirm this interpretation.
-- C13:C14 workshops overlap session I; J18 suggests 30 minutes, but I16:K18
-- also says workshops happen before the conference. Review all four drafts.
-- Untimed organiser notes I5:K21 (ceremony breakdown, photos) are not events.
-- No published rows are changed. Stable IDs prevent duplicates on rerun and
-- DO NOTHING preserves subsequent organiser edits/publication.

begin;

insert into public.schedule_events (
  id, conference_id, committee_id, title, event_type, room_name,
  starts_at, ends_at, published
) values
  -- B7:B8
  ('aa9dca87-0cbd-5621-a070-836b999f8445', '10000000-0000-4000-8000-000000000001', null, 'Registration', 'other', 'Karlshochschule', '2026-11-13 10:30:00+01', '2026-11-13 11:30:00+01', false),
  -- B9:B10
  ('a0751eb3-8b3b-54ff-ae43-0bbfa1f3f097', '10000000-0000-4000-8000-000000000001', null, 'Opening ceremony', 'ceremony', 'Karlshochschule', '2026-11-13 11:30:00+01', '2026-11-13 12:30:00+01', false),
  -- B11:B12
  ('904677c4-b4cb-5d1e-adc3-7350a7d11670', '10000000-0000-4000-8000-000000000001', null, 'How to MUN workshop and break', 'other', null, '2026-11-13 12:30:00+01', '2026-11-13 13:30:00+01', false),
  -- B13:B17
  ('0497826a-754b-517b-93e9-80d9cac7485c', '10000000-0000-4000-8000-000000000001', null, 'Committee session I', 'session', null, '2026-11-13 13:30:00+01', '2026-11-13 16:00:00+01', false),
  -- B18
  ('fc55765a-4b11-516c-b11d-cb0cbf872aa0', '10000000-0000-4000-8000-000000000001', null, 'Katik takeaway', 'break', null, '2026-11-13 16:00:00+01', '2026-11-13 18:30:00+01', false),
  -- B23:B32
  ('ce4542c7-aeae-53c9-9bfc-2a3df72004c5', '10000000-0000-4000-8000-000000000001', null, 'Social 1: Europabad', 'social', 'Europabad', '2026-11-13 18:30:00+01', '2026-11-13 23:30:00+01', false),
  -- B33:B38
  ('a893d4e6-3ad1-5858-8bac-f2b92d1389e9', '10000000-0000-4000-8000-000000000001', null, 'After-party and food', 'social', null, '2026-11-13 23:30:00+01', '2026-11-14 02:30:00+01', false),
  -- D3
  ('056075a5-d98c-5d12-8ec8-d276d38ae0a7', '10000000-0000-4000-8000-000000000001', null, 'Breakfast', 'break', null, '2026-11-14 08:30:00+01', '2026-11-14 09:00:00+01', false),
  -- D4:D6
  ('797e6389-f11b-54b5-8a63-caf97fbc59b4', '10000000-0000-4000-8000-000000000001', null, 'Committee session II', 'session', 'KIT', '2026-11-14 09:00:00+01', '2026-11-14 10:30:00+01', false),
  -- D7
  ('21a99e8c-c248-5b7c-82eb-47c890adabeb', '10000000-0000-4000-8000-000000000001', null, 'Break', 'break', null, '2026-11-14 10:30:00+01', '2026-11-14 11:00:00+01', false),
  -- D8:D11
  ('2d27407c-cc12-55c2-a54a-f693b1438618', '10000000-0000-4000-8000-000000000001', null, 'Committee session III', 'session', 'KIT', '2026-11-14 11:00:00+01', '2026-11-14 13:00:00+01', false),
  -- D12:D13
  ('eef16e3a-1b4b-513a-ab22-a48cd3f24a67', '10000000-0000-4000-8000-000000000001', null, 'Lunch break', 'break', null, '2026-11-14 13:00:00+01', '2026-11-14 14:00:00+01', false),
  -- D14:D16
  ('f2b2c03a-7a53-5d10-b852-675bb03983af', '10000000-0000-4000-8000-000000000001', null, 'Committee session IV', 'session', 'KIT', '2026-11-14 14:00:00+01', '2026-11-14 15:30:00+01', false),
  -- D17
  ('6ec8f863-a74d-5344-a0f3-b3e932029eec', '10000000-0000-4000-8000-000000000001', null, 'Break', 'break', null, '2026-11-14 15:30:00+01', '2026-11-14 16:00:00+01', false),
  -- D18:D21
  ('561b3db9-0228-5862-a905-7b273f0b9db2', '10000000-0000-4000-8000-000000000001', null, 'Committee session V', 'session', 'KIT', '2026-11-14 16:00:00+01', '2026-11-14 18:00:00+01', false),
  -- D22:D25
  ('7930e643-081c-5700-bd2c-f07383460419', '10000000-0000-4000-8000-000000000001', null, 'Dinner', 'break', null, '2026-11-14 18:00:00+01', '2026-11-14 20:00:00+01', false),
  -- D26:D39
  ('e8aa7758-6238-56d2-9a77-a8ac46f58810', '10000000-0000-4000-8000-000000000001', null, 'Social 2: Masquerade ball', 'social', 'Grötzingen Halle', '2026-11-14 20:00:00+01', '2026-11-15 03:00:00+01', false),
  -- F5
  ('a254ae7b-be9a-5f20-bb89-53183e9029ce', '10000000-0000-4000-8000-000000000001', null, 'Breakfast', 'break', null, '2026-11-15 09:30:00+01', '2026-11-15 10:00:00+01', false),
  -- F6:F9
  ('bea99e6a-8843-5fac-a5cf-076787c4f597', '10000000-0000-4000-8000-000000000001', null, 'Committee session VI', 'session', 'KIT', '2026-11-15 10:00:00+01', '2026-11-15 12:00:00+01', false),
  -- F10:F11
  ('35ef9bd9-f8ca-57c0-a3a7-9be49520b240', '10000000-0000-4000-8000-000000000001', null, 'Lunch break', 'break', null, '2026-11-15 12:00:00+01', '2026-11-15 13:00:00+01', false),
  -- F12:F16
  ('204933f4-6ab2-5d80-ba0d-509e4e2ed87b', '10000000-0000-4000-8000-000000000001', null, 'Committee session VII', 'session', 'KIT', '2026-11-15 13:00:00+01', '2026-11-15 15:30:00+01', false),
  -- F17:F19
  ('98b3018c-ec4e-540e-899d-d0ce68622f41', '10000000-0000-4000-8000-000000000001', null, 'Closing ceremony', 'ceremony', null, '2026-11-15 15:30:00+01', '2026-11-15 17:00:00+01', false),
  -- C13:C14 / J18; provisional timing
  ('66d64127-4ef4-58e1-bc2f-4764b663d0e1', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000009', 'IPC workshop', 'other', null, '2026-11-13 13:30:00+01', '2026-11-13 14:00:00+01', false),
  -- C13:C14 / J18; provisional timing
  ('0d210dff-c21e-5af6-87d3-7ec49e2e613c', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000008', 'UNSC workshop', 'other', null, '2026-11-13 13:30:00+01', '2026-11-13 14:00:00+01', false),
  -- C13:C14 / J18; provisional timing
  ('06f32651-e476-591c-a234-54c781dd5d07', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000007', 'USCC workshop', 'other', null, '2026-11-13 13:30:00+01', '2026-11-13 14:00:00+01', false),
  -- C13:C14 / J18; provisional timing
  ('bd5f7849-0a74-5935-8d97-7eda678738c5', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'WHO workshop', 'other', null, '2026-11-13 13:30:00+01', '2026-11-13 14:00:00+01', false)
on conflict (id) do nothing;

commit;
