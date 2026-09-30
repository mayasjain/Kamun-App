# KAMUN MVP: Six-Phase Build Plan

## MVP outcome

The MVP is successful when a delegate can install the app on iPhone or Android, identify their committee, see an accurate schedule, receive and read conference updates, open relevant resources, find rooms, and reach emergency or welfare information—even when venue connectivity is weak. Organisers must be able to maintain that content without asking a developer to edit the app.

The MVP requires **six phases**. Each phase ends with an installable build, a focused test, and a decision to continue or correct the current phase.

## What is inside the MVP

- Anonymous attendee onboarding
- Committee selection or invite-code assignment
- Personalised home screen
- Committee-aware schedule
- Announcements
- Resources and study guides
- Venue and room information
- Emergency and welfare contacts
- Offline access to essential information
- Settings and assignment reset
- Admin dashboard for organisers
- iOS and Android store release

Push notifications are included only if the core announcement feed is already stable. Logistics requests can follow as version 1.1. Memes, voting, gallery, and other social features stay outside the MVP.

## Workstreams

Three workstreams run together throughout the project:

| Workstream | Owns |
| --- | --- |
| Mobile | Expo app, navigation, screens, offline behavior, device integrations, store builds |
| Backend and admin | Supabase schema, authentication, RLS, storage, admin dashboard, content publishing |
| Product, content, and QA | Requirements, KAMUN data, copy, acceptance testing, tester coordination, store metadata |

One person may cover multiple workstreams, but every responsibility needs a named owner.

## Phase 1 — Foundation and store access

**Duration:** 3–4 days  
**Goal:** Prove that the project can produce signed iPhone and Android builds before substantial feature work begins.

### Mobile

- Create the Expo and TypeScript application.
- Configure navigation, theme tokens, app identifiers, development/staging/production environments, and EAS build profiles.
- Create a basic welcome screen and app shell.
- Generate signed iOS and Android builds.

### Backend and admin

- Create development, staging, and production Supabase projects.
- Create the Next.js admin application shell.
- Configure environment validation and secret handling.
- Establish database migration and generated-type workflows.

### Product, content, and QA

- Confirm the organisation that owns the Apple and Google developer accounts.
- Create the App Store Connect and Google Play app records.
- Confirm bundle/package identifiers, support email, privacy-policy owner, and release owner.
- Recruit Android closed testers immediately if the Play account is subject to the 14-day testing requirement.
- Confirm the MVP feature list and mark every other feature as version 1.1 or later.

### Test build

Build **0.1**: install the empty app shell through TestFlight internal testing and Google Play internal testing.

### Phase is complete when

- The signed app installs and launches on at least one physical iPhone and two Android devices.
- Development, staging, and production configurations cannot be confused accidentally.
- Store ownership and signing access do not depend on a single person's private account.

## Phase 2 — Secure data and attendee identity

**Duration:** 4–5 days  
**Goal:** Establish the data and permission foundation needed by every user-facing feature.

### Mobile

- Connect the app to the development backend.
- Implement anonymous attendee sign-in.
- Build the first-run privacy acknowledgement and attendee profile form.
- Add committee selection or invite-code claiming.
- Add loading, error, invalid-code, and reset states.

### Backend and admin

- Create `conferences`, `profiles`, `conference_memberships`, `invite_codes`, `committees`, `venues`, `rooms`, and `schedule_events`.
- Implement Row Level Security before feature data is exposed.
- Prevent attendees from granting themselves chair, staff, or admin roles.
- Add seed data for several fictional committees, rooms, and schedule events.
- Implement verified organiser authentication.

### Product, content, and QA

- Decide whether delegates use unique/group invite codes or open committee selection.
- Confirm attendee roles and which content differs by role.
- Supply an approved committee list and initial venue/room structure.
- Define reset, lost-device, and incorrect-assignment behavior.

### Test build

Build **0.2**: onboarding and assignment only. Test fresh install, invalid/expired code, reset, interrupted onboarding, and attempted role escalation.

### Phase is complete when

- A delegate completes onboarding without assistance.
- The app restores their assignment after restart.
- Permission tests prove that delegates cannot read drafts or acquire privileged roles.
- The entire database can be recreated from migrations and seed data.

## Phase 3 — Core delegate experience

**Duration:** 6–7 days  
**Goal:** Deliver the smallest app that already solves the delegate's main conference problem.

### Mobile

- Build the home screen with committee, current/next session, and quick actions.
- Build Friday, Saturday, and Sunday schedule views.
- Build schedule-event details and room links.
- Cache the assignment, published schedule, rooms, and emergency placeholder locally.
- Display last-sync time, offline status, retry behavior, and expired/stale content states.
- Handle the `Europe/Berlin` timezone consistently.

### Backend and admin

- Add publish/draft behavior for schedule events.
- Create read policies for published conference and committee content.
- Add schedule indexes and validation for invalid or overlapping times.
- Begin schedule and committee editing in the admin dashboard.

### Product, content, and QA

- Provide a realistic three-day schedule dataset.
- Define what appears on the home screen before, during, and after the conference.
- Test terminology and comprehension with delegates who did not design the app.
- Confirm which schedule events are global, committee-specific, or role-specific.

### Test build

Build **0.3**: complete onboarding, home, and schedule. Distribute it to organisers, chairs, and the Android closed-test group.

### Phase is complete when

- A new attendee reaches their personal schedule in under two minutes.
- Current and next session calculations work at day boundaries and across all conference days.
- The last synced schedule remains usable in airplane mode.
- Organisers approve the schedule presentation on both platforms.

## Phase 4 — Complete conference content and organiser dashboard

**Duration:** 6–7 days  
**Goal:** Complete the read-only attendee experience and let organisers operate it independently.

### Mobile

- Add announcement list and detail screens.
- Add general and committee-specific resources.
- Add document download/open behavior.
- Add venue, room, map link, and directions screens.
- Add emergency, welfare, and safe-space information with offline access.
- Complete settings, privacy information, local-data reset, and support contact.

### Backend and admin

- Add `announcements`, announcement audiences, `resources`, `locations`, and `emergency_contacts`.
- Build dashboard screens for committees, rooms, schedule, announcements, resources, locations, and contacts.
- Add draft, publish, archive, file restrictions, audience preview, and audit records.
- Add CSV schedule import only if ordinary schedule editing is already reliable.

### Product, content, and QA

- Supply approved resources, maps/locations, emergency contacts, welfare information, and privacy copy.
- Name one owner for each content area.
- Run an organiser rehearsal: change a room, replace a document, and publish an urgent announcement.
- Check accessibility, wording, empty states, expired content, broken files, and incorrect audience assignments.

### Test build

Build **0.4**: full MVP without push notifications. Expand TestFlight and Play testing to delegates who were not involved in development.

### Phase is complete when

- Every required attendee screen works on iOS and Android.
- A non-developer organiser can correct and publish content.
- Emergency contacts and the personal schedule remain available offline.
- Committee-restricted content is blocked by backend permissions, not only hidden in the app.

## Phase 5 — Notifications, hardening, and release candidate

**Duration:** 5–6 days  
**Goal:** Turn the feature-complete build into a stable release candidate.

### Mobile

- Add notification permission education and Expo push-token registration.
- Deep-link notification taps to announcement details.
- Complete recovery behavior for slow network, server errors, expired sessions, and damaged cache.
- Add production error monitoring and build/version information.
- Remove all incomplete or disabled MVP navigation paths.

### Backend and admin

- Implement server-side notification targeting by conference, role, and committee.
- Store send attempts and failures while keeping announcements as the authoritative message history.
- Finalise storage policies, audit logs, backups, and production content import.
- Freeze database schema changes at the end of the phase.

### Product, content, and QA

- Run the complete acceptance script on both platforms.
- Test notifications in foreground, background, and terminated states.
- Test denied notification permission, token refresh, offline/reconnection, upgrades, and fresh installs.
- Verify store privacy disclosures, screenshots, descriptions, support information, reviewer instructions, and age rating.
- Perform a conference rehearsal with delegate, chair, content editor, and administrator roles.

### Test build

Build **0.9**: the first release candidate. No new MVP features enter after this build.

### Phase is complete when

- Every MVP flow passes on the supported iOS and Android device matrix.
- There are no open critical or major defects.
- Push failures never prevent users from reading the same announcement in the app.
- KAMUN's product, content, privacy, and release owners approve the candidate.

## Phase 6 — Store submission and controlled launch

**Duration:** 7–10 days including review buffer  
**Goal:** Publish the tested app and prove the production operation before conference day.

### Mobile and release

- Create production builds from the approved release commit.
- Confirm the Android target API, iOS deployment target, signing, icons, splash assets, version, and build numbers.
- Submit iOS through App Store Connect with manual release selected.
- Promote or submit Android through Google Play after production access is available.
- Fix only store blockers or critical defects, then repeat the affected regression tests.

### Backend and admin

- Apply the tested production migrations.
- Import only content approved in staging.
- Verify production monitoring, backups, support access, and feature flags.
- Freeze privileged and schema changes until after the conference.

### Product, content, and QA

- Reply to store questions on the same day.
- Install the public release from both stores on devices that were not beta testers.
- Run the conference-day scenario against production: room change, corrected schedule, urgent announcement, offline/reconnection, and support escalation.
- Prepare a static schedule and emergency-contact fallback.

### Release build

Build **1.0**: staged Android rollout and manually released iOS version.

### Phase is complete when

- Public installation works from both stores.
- Staff can update production content without developer assistance.
- The approved KAMUN schedule, resources, rooms, and contacts are live.
- Incident owners and fallback procedures have been rehearsed.

## Phase summary

| Phase | Main result | Expected time | Build |
| --- | --- | --- | --- |
| 1. Foundation and stores | Signed shell on iOS and Android | 3–4 days | 0.1 |
| 2. Identity and security | Onboarding, assignments, and protected backend | 4–5 days | 0.2 |
| 3. Delegate core | Home, personalised schedule, and offline cache | 6–7 days | 0.3 |
| 4. Content and admin | Complete attendee information and organiser control | 6–7 days | 0.4 |
| 5. Hardening | Notifications, full regression, release candidate | 5–6 days | 0.9 |
| 6. Submission and launch | Public iPhone and Android release | 7–10 days | 1.0 |

The implementation work is approximately **24–29 focused working days**, followed by store-review time that partly overlaps final testing and content preparation.

## Testing rhythm

At the end of each phase:

1. Build signed iOS and Android artifacts from the same commit.
2. Run automated type, migration, permission, and smoke checks.
3. Complete the phase-specific manual test script on physical devices.
4. Collect feedback for no more than one working day.
5. Fix critical and major defects before beginning dependent work.
6. Record deferred minor issues in the version 1.1 backlog.

The project does not wait until Phase 6 to test stores. TestFlight and Google Play distribution begin in Phase 1, and the Android closed-test period begins no later than Phase 3.

## MVP acceptance checklist

The MVP is ready to release only when:

- A delegate can onboard and reach their schedule without help.
- Schedule, room, announcement, and resource content is correct for the delegate's committee.
- Schedule and emergency information survive temporary loss of connectivity.
- Delegates cannot grant themselves privileged roles or read drafts.
- Organisers can update content and verify the result on both platforms.
- Required notifications reach the intended audience, with the same message preserved in-app.
- Fresh install, upgrade, reset, offline, denied-permission, and backend-failure scenarios are tested.
- No critical or major defect remains open.
- The app can be installed publicly from both stores before the conference.

## First work package

Begin Phase 1 by verifying the Apple and Google developer accounts, reserving the application identifiers, creating the Expo monorepo and environments, and uploading the signed app shell. In parallel, confirm the MVP ownership decisions and recruit the Android closed-test group.
