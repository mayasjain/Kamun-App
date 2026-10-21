-- Manual smoke test for a disposable/staging Supabase project after migration 008.
-- Run the WHOLE file as postgres in SQL Editor. Every fixture is rolled back.
-- Any unexpected result raises an exception; issue ROLLBACK if your editor stops.
-- Does not upload files, call external services, or create real auth accounts.
begin;

select set_config('kamun.test_conference', gen_random_uuid()::text, true);
select set_config('kamun.test_other_conference', gen_random_uuid()::text, true);
select set_config('kamun.test_committee', gen_random_uuid()::text, true);

insert into public.conferences (id, slug, name, starts_at, ends_at, published)
select id, 'validation-' || id, 'Rollback validation', now(), now() + interval '1 day', true
from (values (current_setting('kamun.test_conference')::uuid),
             (current_setting('kamun.test_other_conference')::uuid)) as fixture(id);
insert into public.committees (id, conference_id, name, abbreviation, published)
values (current_setting('kamun.test_committee')::uuid,
        current_setting('kamun.test_other_conference')::uuid, 'Other conference', 'TEST', true);

-- Constraint failures must be raised, not silently accepted.
do $$
declare
  conference uuid := current_setting('kamun.test_conference')::uuid;
  other_committee uuid := current_setting('kamun.test_committee')::uuid;
begin
  begin
    insert into public.schedule_events (conference_id, committee_id, title, starts_at, ends_at)
    values (conference, other_committee, 'Wrong committee', now(), now() + interval '1 hour');
    raise exception 'FAIL: cross-conference schedule accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.announcements (conference_id, committee_id, title, body)
    values (conference, other_committee, 'Wrong committee', 'Body');
    raise exception 'FAIL: cross-conference announcement accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.resources (conference_id, committee_id, title, url)
    values (conference, other_committee, 'Wrong committee', 'https://example.invalid/test.pdf');
    raise exception 'FAIL: cross-conference resource accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.schedule_events (conference_id, title, starts_at, ends_at)
    values (conference, E' \t\n', now(), now() + interval '1 hour');
    raise exception 'FAIL: blank schedule title accepted';
  exception when check_violation then null; end;
  begin
    insert into public.schedule_events (conference_id, title, starts_at, ends_at)
    values (conference, 'Invalid dates', now(), now());
    raise exception 'FAIL: zero-duration schedule accepted';
  exception when check_violation then null; end;
  begin
    insert into public.announcements (conference_id, title, body)
    values (conference, ' ', 'Body');
    raise exception 'FAIL: blank announcement title accepted';
  exception when check_violation then null; end;
  begin
    insert into public.announcements (conference_id, title, body)
    values (conference, 'Title', E' \t\n');
    raise exception 'FAIL: blank announcement body accepted';
  exception when check_violation then null; end;
  begin
    insert into public.announcements (conference_id, title, body, published)
    values (conference, 'Missing publication date', 'Body', true);
    raise exception 'FAIL: missing publication date accepted';
  exception when check_violation then null; end;
  begin
    insert into public.announcements (conference_id, title, body, published_at, expires_at)
    values (conference, 'Invalid expiry', 'Body', now(), now() - interval '1 hour');
    raise exception 'FAIL: invalid expiry accepted';
  exception when check_violation then null; end;
end;
$$;

insert into public.schedule_events (conference_id, title, starts_at, ends_at, published)
select current_setting('kamun.test_conference')::uuid, title, now(), now() + interval '1 hour', published
from (values ('Visible', true), ('Draft', false)) as fixture(title, published);
insert into public.resources (conference_id, title, url, published)
select current_setting('kamun.test_conference')::uuid, title, 'https://example.invalid/test.pdf', published
from (values ('Visible', true), ('Draft', false)) as fixture(title, published);
insert into public.announcements (conference_id, title, body, published, published_at, expires_at)
values
  (current_setting('kamun.test_conference')::uuid, 'Visible', 'Body', true, now() - interval '1 hour', null),
  (current_setting('kamun.test_conference')::uuid, 'Draft', 'Body', false, null, null),
  (current_setting('kamun.test_conference')::uuid, 'Future', 'Body', true, now() + interval '1 day', null),
  (current_setting('kamun.test_conference')::uuid, 'Expired', 'Body', true, now() - interval '2 hours', now() - interval '1 hour');

-- No admin profile exists for this random identity.
select set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
select set_config('request.jwt.claims', json_build_object('sub', current_setting('request.jwt.claim.sub'), 'role', 'authenticated')::text, true);

set local role anon;

do $$
declare
  conference uuid := current_setting('kamun.test_conference')::uuid;
  table_name text;
  visible_count integer;
  changed_count integer;
begin
  foreach table_name in array array['schedule_events', 'announcements', 'resources'] loop
    execute format('select count(*) from public.%I where conference_id = $1', table_name)
      into visible_count using conference;
    if visible_count <> 1 then
      raise exception 'FAIL: % sees % rows in % instead of one published row', current_user, visible_count, table_name;
    end if;
    begin
      execute format('update public.%I set title = ''Unauthorized'' where conference_id = $1', table_name) using conference;
      get diagnostics changed_count = row_count;
      if changed_count <> 0 then raise exception 'FAIL: unauthorized update to %', table_name; end if;
    exception when insufficient_privilege then null; end;
    begin
      execute format('delete from public.%I where conference_id = $1', table_name) using conference;
      get diagnostics changed_count = row_count;
      if changed_count <> 0 then raise exception 'FAIL: unauthorized delete from %', table_name; end if;
    exception when insufficient_privilege then null; end;
  end loop;
  begin
    insert into public.schedule_events (conference_id, title, starts_at, ends_at)
    values (conference, 'Unauthorized', now(), now() + interval '1 hour');
    raise exception 'FAIL: unauthorized schedule insert';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.announcements (conference_id, title, body)
    values (conference, 'Unauthorized', 'Body');
    raise exception 'FAIL: unauthorized announcement insert';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.resources (conference_id, title, url)
    values (conference, 'Unauthorized', 'https://example.invalid/test.pdf');
    raise exception 'FAIL: unauthorized resource insert';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;

set local role authenticated;

do $$
declare
  conference uuid := current_setting('kamun.test_conference')::uuid;
  table_name text;
  visible_count integer;
  changed_count integer;
begin
  foreach table_name in array array['schedule_events', 'announcements', 'resources'] loop
    execute format('select count(*) from public.%I where conference_id = $1', table_name)
      into visible_count using conference;
    if visible_count <> 1 then
      raise exception 'FAIL: % sees % rows in % instead of one published row', current_user, visible_count, table_name;
    end if;
    begin
      execute format('update public.%I set title = ''Unauthorized'' where conference_id = $1', table_name) using conference;
      get diagnostics changed_count = row_count;
      if changed_count <> 0 then raise exception 'FAIL: unauthorized update to %', table_name; end if;
    exception when insufficient_privilege then null; end;
    begin
      execute format('delete from public.%I where conference_id = $1', table_name) using conference;
      get diagnostics changed_count = row_count;
      if changed_count <> 0 then raise exception 'FAIL: unauthorized delete from %', table_name; end if;
    exception when insufficient_privilege then null; end;
  end loop;
  begin
    insert into public.schedule_events (conference_id, title, starts_at, ends_at)
    values (conference, 'Unauthorized', now(), now() + interval '1 hour');
    raise exception 'FAIL: unauthorized schedule insert';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.announcements (conference_id, title, body)
    values (conference, 'Unauthorized', 'Body');
    raise exception 'FAIL: unauthorized announcement insert';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.resources (conference_id, title, url)
    values (conference, 'Unauthorized', 'https://example.invalid/test.pdf');
    raise exception 'FAIL: unauthorized resource insert';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;

rollback;
select 'PASS: content constraints and attendee/public RLS smoke tests; fixtures rolled back' as result;

-- Still test separately: real organiser sign-in, PDF upload/publish/open/hide,
-- committee-targeted content in the mobile UI, and application form validation.
-- Public PDFs remain accessible by URL after their resource listing is hidden.
