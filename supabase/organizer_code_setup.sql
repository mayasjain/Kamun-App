-- Run in Supabase SQL Editor AFTER 202610210004_organizer_message_codes.sql.
-- The result shows the one-time organiser code. Store it privately. Re-running
-- this statement rotates the code and revokes all earlier code-based access.
with deactivated as (
  update public.organizer_message_codes
  set active = false
  where conference_id = '10000000-0000-4000-8000-000000000001'
    and active
  returning id
), fresh_code as (
  select upper(encode(gen_random_bytes(24), 'hex')) as code
), created as (
  insert into public.organizer_message_codes (conference_id, code_hash, active)
  select
    '10000000-0000-4000-8000-000000000001',
    encode(digest(fresh_code.code, 'sha256'), 'hex'),
    true
  from fresh_code
  cross join (select count(*) as previous_codes from deactivated) as rotation
  returning id
)
select fresh_code.code as organizer_code
from fresh_code
cross join created;
