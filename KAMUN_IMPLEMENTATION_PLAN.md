# KAMUN App Implementation and Release Plan

## Goal and deadline

Ship a reliable KAMUN conference companion for iPhone and Android before KAMUN 2026 begins on **13 November 2026**. The public version should focus on onboarding, the personalised schedule, announcements, resources, venue guidance, emergency contacts, and organiser content management.

This plan begins on **29 September 2026** and leaves 11–12 November as an emergency buffer. Logistics requests may ship if they pass testing by the feature-freeze date. The meme feed is planned after the core release unless its complete safety and moderation workflow is ready early.

## Delivery rules

1. Produce an installable iOS and Android build at the end of every phase.
2. Maintain separate development, staging, and production environments.
3. Test the same user flows on both platforms throughout development.
4. Keep incomplete features behind remotely controllable feature flags.
5. Promote one tested build from staging to production; do not rebuild different code for release.
6. Stop adding release features after 27 October. Later changes fix release blockers only.
7. Treat the admin dashboard and content rehearsal as part of the product, not post-development work.

## Release scope

### Required for version 1.0

- Anonymous attendee onboarding
- Committee assignment or invite-code claim
- Home screen with next session and current announcement
- Three-day, committee-aware schedule
- Announcements feed
- Resources and study-guide downloads
- KIT venue, room guidance, and external directions
- Emergency and welfare contacts available offline
- Settings, assignment reset, and privacy information
- Organiser dashboard for managing all of the above
- Error monitoring and basic operational logs

### Allowed only if complete by 27 October

- Push notifications
- Logistics requests and staff request queue
- CSV schedule import

### After version 1.0

- Meme feed, voting, reporting, blocking, and moderation
- Gallery
- Sponsors and Secretariat profiles beyond a simple static page
- Multi-conference organiser onboarding

## Environments and release channels

| Environment | Purpose | Backend | Mobile distribution | Data |
| --- | --- | --- | --- | --- |
| Development | Daily developer work | Local Supabase or isolated development project | Expo development build | Synthetic seed data |
| Staging | Organiser review and end-to-end tests | Dedicated staging Supabase project | TestFlight and Google Play internal/closed tracks | Sanitised KAMUN-like data |
| Production | Store release and conference operation | Dedicated production Supabase project | App Store and Google Play production | Approved live KAMUN data |

EAS should have three corresponding build profiles:

- `development`: development client, local debugging enabled
- `preview`: signed tester build using staging configuration
- `production`: store build using production configuration

Secrets belong in EAS environment variables, Vercel environment variables, and server-side secret stores. The Supabase service-role key must never be included in a mobile bundle.

## Phase 0 — Accounts, ownership, and release setup

**Dates:** 29 September–2 October  
**Outcome:** Store ownership and distribution paths are ready before feature development depends on them.

### Implementation

- Decide which legal entity owns the app, bundle identifier, store listings, Supabase projects, domain, and source repository.
- Enrol or verify the organisational Apple Developer and Google Play Console accounts.
- Create the App Store Connect app record and Google Play app entry.
- Reserve identifiers such as `org.munika.kamun` after confirming ownership.
- Create the Expo/EAS organisation and link the iOS and Android store applications.
- Create development, staging, and production Supabase projects.
- Set up the support email, privacy-policy URL, account/data-deletion contact, and incident owner.
- Recruit at least 12 reliable Android closed testers now in case the Play Console account is subject to Google's 14-day testing requirement.
- Assign one product owner, one content owner, and one person authorised to publish store releases.

### Parallel testing and evidence

- Upload a minimal signed shell build to TestFlight internal testing.
- Upload an Android App Bundle to Google Play internal testing.
- Confirm installation on one physical iPhone and two physical Android devices.
- Record store-account status, signing ownership, tester lists, and access recovery details in a restricted operations document.

### Exit gate

- Both stores accept a signed build.
- At least two people can access the organisational accounts without sharing credentials.
- The Android closed-test group is ready to begin as soon as the first usable build is available.

## Phase 1 — Repository, backend foundation, and app shell

**Dates:** 30 September–6 October  
**Outcome:** A secure skeleton runs on both platforms and connects to an isolated backend.

### Implementation

- Create the monorepo with `apps/mobile`, `apps/admin`, shared contracts, and `supabase` migrations.
- Start with the latest stable Expo SDK that targets Android API 36; verify the exact SDK/store compatibility before locking dependencies.
- Configure Expo Router, TypeScript strict mode, linting, formatting, environment validation, and CI.
- Add basic KAMUN design tokens, app icon placeholders, splash screen, bottom navigation, and empty/loading/error states.
- Create initial tables for conferences, profiles, memberships, invite codes, committees, venues, rooms, and schedule events.
- Implement anonymous attendee authentication and verified admin authentication.
- Write RLS policies before building feature screens.
- Seed a small fictional conference dataset covering multiple committees, rooms, days, and roles.
- Add Sentry to mobile and admin staging builds.

### Parallel testing

- Automated checks on every pull request: type checking, linting, contract tests, migration reset, and RLS integration tests.
- Verify that an anonymous delegate can read published schedule data.
- Verify that the same delegate cannot create a staff membership, read drafts, or alter another user.
- Run the app shell on iOS simulator, Android emulator, one real iPhone, and one real Android device.

### Tester build

Distribute preview build **0.1** to the core team. Test installation, first launch, backend connection, navigation, and sign-out/reset only.

### Exit gate

- Clean database recreation from migrations and seeds works.
- Permission tests pass in CI.
- The signed preview build opens and connects on both platforms.

## Phase 2 — Onboarding, home, and offline schedule

**Dates:** 7–13 October  
**Outcome:** A delegate can install the app and use its most important conference function.

### Implementation

- Build welcome, privacy acknowledgement, attendee name, and invite/committee assignment flows.
- Build home with committee identity, current/next session, important announcement placeholder, and quick links.
- Build the Friday/Saturday/Sunday schedule with committee filtering and event details.
- Persist published schedule, assignment, rooms, and emergency placeholder data on-device.
- Show last-sync time, offline state, retry action, and content-unavailable state.
- Handle Central European timezone explicitly; store timestamps in UTC and render in `Europe/Berlin`.
- Add an in-app feedback action that opens the project support email with build/device information.

### Parallel testing

- Component tests for time-based current/next-session logic and schedule filtering.
- Integration tests for invite-code claim, reuse limits, expiry, and role assignment.
- Airplane-mode test after first sync.
- Fresh install, upgrade, reset, expired code, invalid code, and interrupted onboarding tests.
- Accessibility pass for dynamic text, screen-reader labels, contrast, and touch-target sizes.

### Tester build

Distribute preview build **0.2** to 6–10 organisers, chairs, and delegates. Start the Google Play closed test no later than this phase. Ask testers to complete onboarding, change committee if allowed, inspect all three days, kill/reopen the app, and repeat offline.

### Exit gate

- A first-time attendee reaches their schedule in under two minutes without assistance.
- The last synced schedule remains available without connectivity.
- No tester can obtain a privileged role through the client.
- All high-severity feedback from build 0.1 is resolved or explicitly deferred.

## Phase 3 — Announcements, resources, venues, and safety information

**Dates:** 14–20 October  
**Outcome:** The mobile app contains the complete read-only conference companion experience.

### Implementation

- Build announcements list/detail with audience and priority handling.
- Build resources grouped into general and committee-specific documents.
- Add secure document download/open behavior and clear cached-file state.
- Build venue and room lists, basic map markers, room directions, and external maps links.
- Build emergency, welfare, and safe-space pages; cache these records for offline use.
- Complete settings, privacy, notification preference placeholders, and local-data reset.
- Add deep-link routing for announcement and schedule-event URLs.
- Add a content schema version so old builds can reject incompatible server data safely.

### Parallel testing

- Test every supported document type on iOS and Android.
- Test map links with Apple Maps and Google Maps behavior.
- Verify committee and role targeting at the database layer.
- Test empty content, unpublished content, expired announcements, broken files, and slow downloads.
- Conduct a short usability session with at least three people who did not build the app.

### Tester build

Distribute preview build **0.3** to the complete Android closed-test cohort and an expanded TestFlight group. Give testers a script covering onboarding, schedule, documents, venue directions, offline use, and emergency contacts.

### Exit gate

- All required attendee screens exist on both platforms.
- Emergency information and the personal schedule work offline.
- Audience-specific content is inaccessible to excluded users, not merely hidden in the interface.
- No open blocker prevents organisers from starting content entry.

## Phase 4 — Admin dashboard and live content rehearsal

**Dates:** 14–23 October, overlapping Phase 3  
**Outcome:** KAMUN organisers can operate the app without developer intervention.

### Implementation

- Build authenticated dashboard navigation and conference readiness overview.
- Add management screens for committees, rooms, schedule events, announcements, resources, locations, and emergency contacts.
- Add draft/publish/archive states and audit logging.
- Add file upload restrictions, replacement behavior, and orphan-file cleanup.
- Add audience preview before publishing announcements.
- Add CSV schedule validation and dry-run import only if it can be completed without delaying core editing.
- Add production content export and backup procedures.

### Parallel testing

- Organiser acceptance testing with realistic KAMUN data.
- Two-person rehearsal: one organiser changes a room and publishes an urgent update; a separate tester verifies the result on offline/reconnected iOS and Android devices.
- Permission tests for content editor, staff, and administrator roles.
- Test accidental duplicate imports, overlapping events, invalid dates, oversized files, and expired sessions.

### Tester build

Distribute preview build **0.4** with the staging dashboard. Begin entering production-quality conference data in staging, then obtain written approval from the content owner.

### Exit gate

- A non-developer organiser can create, correct, publish, and archive content.
- Critical changes reach both mobile platforms after refresh/reconnection.
- Every privileged publish operation creates an audit record.
- The content owner approves the staging dataset structure.

## Phase 5 — Push notifications and optional logistics

**Dates:** 21–27 October  
**Outcome:** The final release candidate has reliable alerting; optional operations ship only if fully accepted.

### Required implementation

- Register and refresh Expo push tokens by user, conference, platform, role, and committee.
- Request notification permission in context, after explaining its conference value.
- Send notifications from a server-side function using server-resolved audiences.
- Deep-link notification taps to the relevant in-app announcement.
- Store send attempts and delivery errors without treating push as guaranteed delivery.
- Keep every pushed message visible in the announcement feed.

### Optional logistics slice

Implement only if a named logistics owner approves the workflow:

- Delegate/chair request form
- Request statuses: submitted, acknowledged, in progress, resolved, cancelled
- Staff queue with assignment and history
- Requester-only read access plus authorised staff access
- Duplicate-submit protection and rate limiting

If any logistics permission or workflow test fails by 27 October, disable the feature flag and move it to version 1.1.

### Parallel testing

- Foreground, background, terminated-app, denied-permission, token-refresh, and notification-tap tests.
- Send targeting tests for all attendees, one committee, chairs, and staff.
- Confirm excluded users never receive or retrieve targeted message content.
- Perform a 20-device notification rehearsal if enough testers are available.
- Re-run offline, upgrade, and permission suites on both platforms.

### Tester build

Distribute release candidate **0.9**. Freeze features at the end of this phase.

### Exit gate

- Required version 1.0 flows pass on the agreed device matrix.
- Push failures do not hide announcements from the in-app feed.
- Crash-free tester sessions and unresolved defects meet the release threshold below.
- Every included feature has a named operational owner.

## Phase 6 — Store compliance, release candidate, and submission

**Dates:** 28 October–3 November  
**Outcome:** The tested 1.0 build is submitted to both stores with complete metadata.

### Implementation and compliance

- Set final icons, splash assets, app name, version, build numbers, package IDs, and signing configuration.
- Verify Android targets API level 36 as required for new submissions after 31 August 2026.
- Complete privacy disclosures, Google Play Data safety, Apple privacy details, age rating, export compliance, support URL, and reviewer notes.
- Provide reviewers with a working demo assignment/invite path and instructions for role-specific areas.
- Prepare iPhone and Android screenshots from production-like content without personal data.
- Verify the privacy policy describes anonymous authentication, device identifiers, push tokens, logs, files, retention, and deletion requests.
- Remove disabled or incomplete screens from navigation; a feature flag alone should not leave broken review paths.
- Create a signed production build from the release commit and run the full smoke suite.

### Parallel testing

- Regression testing on the oldest supported iPhone/iOS combination and representative small, mid-size, and current Android devices.
- Fresh-install and upgrade tests from the previous TestFlight/Play build.
- Poor-network, no-network, backend-error, expired-session, and corrupted-cache recovery tests.
- Final RLS test suite against a production-schema clone.
- Security review for exposed keys, privileged endpoints, storage rules, and logs containing personal data.

### Store submission

- Submit the iOS build to App Review with manual release selected.
- Promote the Android closed-test build or submit the approved production build after Play production access is available.
- Keep the tested build installed on staff devices while review is pending.
- Respond to store questions the same day.

### Exit gate

- Both stores have accepted or are reviewing the same release candidate.
- No severity-1 or severity-2 defect remains open.
- Production backend, content, support, and monitoring owners have approved launch.

## Phase 7 — Approval, production rehearsal, and controlled launch

**Dates:** 4–10 November  
**Outcome:** The app is publicly available with enough time to correct store or operational issues.

### Work

- Resolve review findings through the smallest possible change and repeat regression tests.
- Copy only approved staging content into production using migrations/imports, not manual ad hoc database edits.
- Run a full conference-day simulation with at least one delegate, chair, content editor, and logistics staff member.
- Test room change, schedule correction, urgent announcement, lost connectivity, and support escalation.
- Publish Android with a staged rollout where available; manually release iOS after final approval.
- Verify production installation using public store links on devices not enrolled as testers.
- Freeze database migrations and dashboard feature changes after launch.

### Exit gate

- Public installs work on both stores.
- Production data has been approved by KAMUN's content owner.
- Staff can publish an update and verify it on iOS and Android without developer assistance.
- Incident, rollback, and contact procedures have been rehearsed.

## Phase 8 — Conference operations

**Dates:** 11–15 November  
**Outcome:** Stable service during the event.

### Before the conference

- Use 11–12 November only for content corrections and release-blocking fixes.
- Preload final schedules and emergency contacts on organiser test devices.
- Confirm dashboard access, staff roles, notification permissions, and on-call contacts.
- Export a printable/static emergency schedule as a fallback.

### During the conference

- One person owns content, one owns technical monitoring, and one is the decision-maker for urgent messages.
- Monitor Sentry, Supabase health, failed push batches, and support email at agreed intervals.
- Log every production incident and workaround.
- Avoid app-store updates during the conference unless the current version is unusable or unsafe. Prefer server content corrections and already-tested configuration flags.

### After the conference

- Archive the conference, stop unnecessary notifications, export required records, and run the approved retention/deletion process.
- Review incidents and tester/user feedback before planning version 1.1.

## Continuous testing strategy

### Automated on every pull request

- TypeScript type checking and linting
- Unit tests for date/time, audience, and validation logic
- Component tests for important states
- Database migration reset
- RLS and storage-policy integration tests
- Production bundle/configuration validation

### Automated nightly or before each tester build

- Mobile smoke flow: install/launch → onboarding → home → schedule → announcement → emergency page
- Admin smoke flow: sign in → edit draft → publish → confirm mobile visibility
- Build both platform artifacts
- Dependency and secret scanning

### Manual device matrix

| Group | Minimum coverage |
| --- | --- |
| iPhone | One small/older supported device, one common mid-size device, one current device |
| Android | One Android 10/11 device if supported, one Android 13/14 device, one Android 16/API 36 device |
| Display | Small screen, large screen, increased text size, dark/light mode if both are supported |
| Network | Wi-Fi, mobile data, slow connection, airplane mode, reconnection |

### Severity and release thresholds

| Severity | Example | Release rule |
| --- | --- | --- |
| S1 critical | Data exposure, privilege escalation, app cannot launch, wrong emergency information | Zero open; stop release immediately |
| S2 major | Schedule unavailable, onboarding blocked, content publishing broken | Zero open for required flows |
| S3 moderate | Non-critical layout or recoverable feature defect | May release only with owner and documented workaround |
| S4 minor | Cosmetic issue with no functional impact | Can enter version 1.1 backlog |

For the final candidate, require all scripted acceptance flows to pass on both platforms, no S1/S2 issues, and no unexplained crash affecting more than one tester.

## Tester groups

| Group | Size | Responsibility |
| --- | --- | --- |
| Core team | 4–6 | Test every build and report blockers quickly |
| Organisers/chairs | 6–10 | Validate terminology, schedules, permissions, and operational workflows |
| Delegates | 12–20 | Validate onboarding, comprehension, offline use, and real device variety |
| Release owners | 2–3 | Verify store metadata, production configuration, and launch checklist |

Testers should report build number, device, OS version, steps, expected result, actual result, screenshot/video when useful, and whether the issue reproduces.

## Store-specific timing constraints

- TestFlight supports internal and external beta testing. The first external build may require beta review, so internal testing should start during Phase 0 and external testing during Phase 2.
- A newly created personal Google Play account may require at least 12 testers continuously opted into a closed test for 14 days before production access. Start this no later than 13 October, preferably earlier.
- New Android submissions after 31 August 2026 must target Android 16/API 36. Confirm the chosen Expo SDK does this before the repository is locked.
- Submit the production candidate by 3 November. Store reviews can be fast, but the schedule must allow for rejection, clarification, and resubmission.
- Do not include the meme feed in the store submission until it provides content filtering, reporting, blocking, published contact details, and an operational moderation response.

## Decisions needed during Phase 0

These decisions do not block writing the project shell, but they must be closed by 2 October:

1. Which legal entity owns the Apple and Google developer accounts?
2. Are those accounts already active, and is the Google account organisational or personal?
3. Will delegates receive invite codes, or may they freely select a committee?
4. What is the minimum supported iOS version and Android version?
5. Who owns the authoritative schedule and approves production content?
6. Who handles privacy/deletion requests and urgent technical incidents?
7. Is logistics required for version 1.0, or explicitly version 1.1?

## Immediate next work package

Start Phase 0 and Phase 1 together:

1. Verify the Apple Developer and Google Play Console account status.
2. Create the app records and reserve the identifiers.
3. Recruit the Android tester group.
4. Scaffold the Expo/Next.js monorepo and three environment profiles.
5. Create the initial Supabase migrations and RLS test harness.
6. Upload a signed shell build to TestFlight internal testing and Google Play internal testing by 2 October.

This first package proves the riskiest external dependency—actual iOS and Android distribution—before most feature work begins.
