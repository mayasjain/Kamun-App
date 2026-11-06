-- Correct the SG's full name without changing her contact details.
update public.emergency_contacts
set label = 'Mahima Rajpal', person_name = 'Mahima Rajpal'
where id = 'e0000000-0000-4000-8000-000000000007'
  and conference_id = '10000000-0000-4000-8000-000000000001';
