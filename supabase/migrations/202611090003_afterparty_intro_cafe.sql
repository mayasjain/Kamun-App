-- Confirm the afterparty venue supplied by the organiser.
update public.schedule_events
set room_name = 'Intro Café',
    description = case when description = 'Location to be announced.' then null else description end
where id = 'a893d4e6-3ad1-5858-8bac-f2b92d1389e9'
  and conference_id = '10000000-0000-4000-8000-000000000001';
