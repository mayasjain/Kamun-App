-- Limit emergency contact details to signed-in attendees.
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

commit;
