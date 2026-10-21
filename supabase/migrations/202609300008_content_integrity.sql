-- Additive validation: existing rows are not scanned or rewritten here.
-- NOT VALID constraints still apply to inserts and updated rows. If a legacy
-- row has invalid text or publication dates, correct those values when editing it.
-- Existing event date ordering is already enforced by schedule_events_dates_valid.

alter table public.committees
  add constraint committees_id_conference_unique unique (id, conference_id);

-- Composite foreign keys prevent assigning content to another conference's
-- committee. NULL committee_id continues to mean conference-wide content.
alter table public.schedule_events
  add constraint schedule_events_committee_conference_fk
  foreign key (committee_id, conference_id)
  references public.committees (id, conference_id) on delete cascade not valid;

alter table public.announcements
  add constraint announcements_committee_conference_fk
  foreign key (committee_id, conference_id)
  references public.committees (id, conference_id) on delete cascade not valid;

alter table public.resources
  add constraint resources_committee_conference_fk
  foreign key (committee_id, conference_id)
  references public.committees (id, conference_id) on delete cascade not valid;

alter table public.schedule_events
  add constraint schedule_events_title_nonblank
  check (title ~ '[^[:space:]]') not valid;

alter table public.announcements
  add constraint announcements_title_nonblank
  check (title ~ '[^[:space:]]') not valid,
  add constraint announcements_body_nonblank
  check (body ~ '[^[:space:]]') not valid,
  add constraint announcements_publication_required
  check (not published or published_at is not null) not valid,
  add constraint announcements_expiry_valid
  check (expires_at is null or published_at is null or expires_at > published_at) not valid;

-- Future published_at values are intentional: the existing SELECT policy hides
-- scheduled announcements until that instant. Unpublished drafts may omit dates.
-- Run docs/BACKEND_VALIDATION.sql in a test project, then audit legacy rows before
-- separately running ALTER TABLE ... VALIDATE CONSTRAINT for these constraints.
