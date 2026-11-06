-- Add the SG contacts supplied by the organiser alongside the existing safety team.
-- Personal contact details retain the existing attendee-only read policy.
begin;

insert into public.emergency_contacts (
  id, conference_id, label, person_name, role, phone, is_emergency, sort_order, published
) values
  ('e0000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Lena Wanner', 'Lena Wanner', 'Secretary General', '+49 1520 4434395', true, 50, true),
  ('e0000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'Mani', 'Mani', 'Secretary General', '+49 176 75057667', true, 60, true),
  ('e0000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'Mahima', 'Mahima', 'Secretary General', '+49 176 22806098', true, 70, true)
on conflict (id) do update set
  label = excluded.label,
  person_name = excluded.person_name,
  role = excluded.role,
  phone = excluded.phone,
  is_emergency = excluded.is_emergency,
  sort_order = excluded.sort_order,
  published = excluded.published
where emergency_contacts.conference_id = excluded.conference_id;

commit;
