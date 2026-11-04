-- Run in Supabase SQL Editor AFTER 202610210006_committee_gossip.sql.
-- Returns one private chair code per published KAMUN committee, e.g. WHO-8K3P7Q2M.
-- Copy all rows
-- somewhere private before leaving the results page. Never commit the results.
-- Re-running rotates every chair code and immediately revokes older codes.
with deactivated as (
  update public.attendee_access_codes
  set active = false
  where conference_id = '10000000-0000-4000-8000-000000000001'
    and access_type = 'chair' and active
  returning id
), random_bytes as materialized (
  select committee.id as committee_id, committee.abbreviation,
    gen_random_bytes(8) as bytes
  from public.committees as committee
  where committee.conference_id = '10000000-0000-4000-8000-000000000001'
    and committee.published
), fresh_codes as materialized (
  select random_bytes.committee_id, random_bytes.abbreviation,
    random_bytes.abbreviation || '-' || (
      select string_agg(
        substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', get_byte(random_bytes.bytes, byte_index) % 32 + 1, 1),
        '' order by byte_index
      )
      from generate_series(0, 7) as byte_index
    ) as code
  from random_bytes
), created as (
  insert into public.attendee_access_codes
    (conference_id, committee_id, label, access_type, code_hash, active, expires_at)
  select '10000000-0000-4000-8000-000000000001', fresh_codes.committee_id,
    fresh_codes.abbreviation || ' chair', 'chair',
    encode(digest(fresh_codes.code, 'sha256'), 'hex'), true,
    '2026-11-16 23:59:59+01'
  from fresh_codes
  cross join (select count(*) as retired_count from deactivated) as rotation
  returning committee_id
)
select fresh_codes.abbreviation as committee, fresh_codes.code as chair_code
from fresh_codes join created using (committee_id)
order by fresh_codes.abbreviation;
