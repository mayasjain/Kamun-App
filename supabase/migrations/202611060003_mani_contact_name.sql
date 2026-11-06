-- Correct the SG's full name without changing his contact details.
update public.emergency_contacts
set label = 'Mani Kondapavuluri', person_name = 'Mani Kondapavuluri'
where id = 'e0000000-0000-4000-8000-000000000006'
  and conference_id = '10000000-0000-4000-8000-000000000001';
