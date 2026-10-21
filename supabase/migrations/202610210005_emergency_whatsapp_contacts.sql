-- Temporary KAMUN WhatsApp contact: the organiser asked to use the same number
-- for all three roles until their individual numbers are confirmed.
-- Published contacts are limited to people who claimed a KAMUN attendee code.
begin;

drop policy "published emergency contacts are public" on public.emergency_contacts;

create policy "attendees can read published emergency contacts"
on public.emergency_contacts for select to authenticated
using (
  published
  and exists (
    select 1 from public.attendee_memberships as membership
    where membership.conference_id = emergency_contacts.conference_id
      and membership.user_id = auth.uid()
  )
);

insert into public.emergency_contacts (
  id, conference_id, label, role, phone, is_emergency, sort_order, published
) values
  ('e0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Secretary General', 'Secretary General', '+49 1771842065', true, 10, true),
  ('e0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Deputy Secretary General', 'Deputy Secretary General', '+49 1771842065', true, 20, true),
  ('e0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'USG Safety and Security', 'USG Safety and Security', '+49 1771842065', true, 30, true)
on conflict (id) do nothing;

commit;
