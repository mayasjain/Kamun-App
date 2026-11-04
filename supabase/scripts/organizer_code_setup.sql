-- Run in Supabase SQL Editor AFTER 202610210004_organizer_message_codes.sql.
-- The result shows a one-time organiser code like ORGA-7K3P9Q2M.
-- Run 202610210007_short_organizer_codes.sql first so this shorter code can be claimed.
-- Store it privately. Re-running
-- this statement rotates the code and revokes all earlier code-based access.
with deactivated as (
  update public.organizer_message_codes
  set active = false
  where conference_id = '10000000-0000-4000-8000-000000000001'
    and active
  returning id
), random_bytes as materialized (
  select gen_random_bytes(8) as bytes
), fresh_code as materialized (
  select 'ORGA-' || (
    select string_agg(
      substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', get_byte(random_bytes.bytes, byte_index) % 32 + 1, 1),
      '' order by byte_index
    )
    from generate_series(0, 7) as byte_index
  ) as code
  from random_bytes
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
