-- Programme drafts are imported by 202610210001_import_schedule_drafts.sql.
-- Do not recreate the superseded placeholder schedule here.

insert into public.announcements (
  conference_id, title, body, priority, published_at, published
) values (
  '10000000-0000-4000-8000-000000000001',
  'Welcome to KAMUN 2026',
  'The attendee app foundation is connected. Final operational information will be published by the Secretariat.',
  'normal',
  now(),
  true
);

insert into public.locations (
  conference_id, name, category, address, description, published
) values (
  '10000000-0000-4000-8000-000000000001',
  'Karlsruhe Institute of Technology',
  'conference',
  'Karlsruhe, Germany',
  'Primary KAMUN 2026 venue. Exact building and room information must be approved before release.',
  true
);

-- Delegate codes are issued by ECG; never seed a shared delegate credential.
