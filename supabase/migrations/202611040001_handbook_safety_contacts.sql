-- Replace the temporary role-based contacts with the Safety and Awareness team
-- from page 21 of delegate-handbook-ee04582c2ba8.pdf (KAMUN 2026).
-- Keep the existing attendee-only read policy for personal contact details.
begin;

insert into public.emergency_contacts (
  id, conference_id, label, person_name, role, phone, is_emergency, sort_order, published
) values
  ('e0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Varshitha Ramakumar', 'Varshitha Ramakumar', 'Safety and Awareness', '+49 175 6222705', true, 10, true),
  ('e0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Akshat Bhalekar', 'Akshat Bhalekar', 'Safety and Awareness', '+49 1520 3842859', true, 20, true),
  ('e0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Hridey Batra', 'Hridey Batra', 'Safety and Awareness', '+49 176 32298670', true, 30, true),
  ('e0000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Jacqueline Zweers', 'Jacqueline Zweers', 'Safety and Awareness', '+352 621 594 431', true, 40, true)
on conflict (id) do update set
  label = excluded.label,
  person_name = excluded.person_name,
  role = excluded.role,
  phone = excluded.phone,
  email = null,
  is_emergency = excluded.is_emergency,
  sort_order = excluded.sort_order,
  published = excluded.published
where emergency_contacts.conference_id = excluded.conference_id;

commit;
