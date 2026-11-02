-- Run against a disposable Supabase database after all migrations and seed data.
-- The transaction rolls back its fake users and bindings, even on success.
begin;

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('80000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'ecg-test-1@example.invalid', now(), now()),
  ('80000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'ecg-test-2@example.invalid', now(), now());

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);

do $$ declare i integer; begin
  for i in 1..10 loop
    if not public.ecg_acquire_claim_attempt('80000000-0000-4000-8000-000000000001') then
      raise exception 'Claim limiter denied an allowed attempt';
    end if;
  end loop;
  if public.ecg_acquire_claim_attempt('80000000-0000-4000-8000-000000000001') then
    raise exception 'Claim limiter allowed an eleventh attempt';
  end if;
end $$;

-- One ECG code can be used on two devices (distinct Supabase users).
select * from public.ecg_bind_verified_identity(
  '10000000-0000-4000-8000-000000000001',
  '80000000-0000-4000-8000-000000000001',
  900001, 'delegate', 'ILO', 'France', repeat('a',64));
select * from public.ecg_bind_verified_identity(
  '10000000-0000-4000-8000-000000000001',
  '80000000-0000-4000-8000-000000000002',
  900001, 'delegate', 'ILO', 'France', repeat('a',64));

do $$ begin
  if (select count(*) from public.ecg_participant_bindings
      where ecg_person_id=900001 and user_id in (
        '80000000-0000-4000-8000-000000000001',
        '80000000-0000-4000-8000-000000000002')) <> 2 then
    raise exception 'Two-device binding failed';
  end if;
  if (select count(*) from public.attendee_memberships
      where identity_source='ecg' and access_code_id is null and access_type='member'
        and user_id in ('80000000-0000-4000-8000-000000000001',
          '80000000-0000-4000-8000-000000000002')
        and committee_id='20000000-0000-4000-8000-000000000001') <> 2 then
    raise exception 'Membership binding is inconsistent';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000001', true);

do $$ begin
  begin
    perform public.ecg_bind_verified_identity(
      '10000000-0000-4000-8000-000000000001',
      '80000000-0000-4000-8000-000000000001',
      900002, 'delegate', 'ILO', 'Germany', repeat('b',64));
    raise exception 'Authenticated user could call the trusted binding RPC';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$ begin
  if not public.has_current_attendee_access(
      '10000000-0000-4000-8000-000000000001','member',
      '20000000-0000-4000-8000-000000000001') then
    raise exception 'Delegate access was not granted';
  end if;
  if public.has_current_attendee_access(
      '10000000-0000-4000-8000-000000000001','chair',null) then
    raise exception 'Delegate was given chair rights';
  end if;
  if (select count(*) from public.ecg_participant_bindings where ecg_person_id=900001) <> 1 then
    raise exception 'Binding RLS exposed another account';
  end if;
end $$;

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
update public.ecg_participant_bindings
  set verified_at=now()-interval '10 minutes', valid_until=now()-interval '5 minutes'
  where user_id='80000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
do $$ begin
  if public.has_current_attendee_access(
      '10000000-0000-4000-8000-000000000001','member',null) then
    raise exception 'Expired binding retained delegate rights';
  end if;
end $$;
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
do $$ begin
  if not public.ecg_refresh_verified_identity(
      '10000000-0000-4000-8000-000000000001',
      '80000000-0000-4000-8000-000000000001',900001,repeat('a',64)) then
    raise exception 'Valid identity did not refresh';
  end if;
end $$;

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
do $$ begin
  if public.ecg_revoke_verified_identity_all(900001,repeat('b',64)) <> 0 then
    raise exception 'Wrong revision revoked a binding';
  end if;
  if public.ecg_revoke_verified_identity_all(900001,repeat('a',64)) <> 2 then
    raise exception 'Matching revision did not revoke both devices';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
do $$ begin
  if public.has_current_attendee_access(
      '10000000-0000-4000-8000-000000000001','member',null) then
    raise exception 'Revoked binding retained delegate rights';
  end if;
end $$;

rollback;
