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
