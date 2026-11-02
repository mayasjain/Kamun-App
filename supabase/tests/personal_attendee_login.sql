-- Run after 202610270003_personal_attendee_login.sql on staging.
begin;

do $$ begin
  if exists (select 1 from public.attendee_access_codes
      where conference_id = '10000000-0000-4000-8000-000000000001'
        and access_type = 'member' and active) then
    raise exception 'A shared KAMUN delegate code is still active';
  end if;
  if exists (select 1 from public.attendee_memberships
      where conference_id = '10000000-0000-4000-8000-000000000001'
        and access_type = 'member' and identity_source = 'legacy_code') then
    raise exception 'A legacy delegate membership survived cutover';
  end if;
end $$;

-- A shared delegate membership cannot be re-created, even by the old claim RPC.
insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values ('80000000-0000-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'ecg-phase3@example.invalid', now(), now());

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select * from public.ecg_bind_verified_identity(
  '10000000-0000-4000-8000-000000000001',
  '80000000-0000-4000-8000-000000000003',
  900003, 'delegate', 'ILO', 'France', repeat('a', 64));

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000003', true);
do $$ begin
  if (select seat_label from public.my_current_attendee_profile(
      '10000000-0000-4000-8000-000000000001')) <> 'France' then
    raise exception 'Verified seat not restored';
  end if;
end $$;

select 'ECG Phase 3 staging identity check passed' as result;

rollback;
