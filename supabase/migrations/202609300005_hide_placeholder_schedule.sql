update public.schedule_events
set published = false
where conference_id = '10000000-0000-4000-8000-000000000001';

comment on table public.schedule_events is
  'Schedule events remain unpublished until the KAMUN 2026 programme and room assignments are approved.';
