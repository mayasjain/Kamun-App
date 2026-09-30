# KAMUN Fast-Track Open-Source Plan

## Recommendation

Do not fork a complete third-party conference product. Start from official Expo and Next.js/Supabase foundations, reuse only clearly licensed components, and reduce the first release to a read-focused conference companion.

This approach can reduce implementation to approximately **10–14 focused working days**, excluding unpredictable store review time.

## What to reuse

### Mobile foundation

Use the current official Expo starter with Expo Router, TypeScript, and EAS. Connect it to Supabase using Expo's documented Supabase integration.

Reuse from the foundation:

- iOS and Android project configuration
- File-based navigation
- Development and store build tooling
- Environment handling
- Supabase session persistence when organiser-only authentication is later needed in mobile

Build the KAMUN screens directly in this foundation. This is faster than removing unrelated authentication, discovery, ticket, speaker, and API code from a large event application.

### Admin foundation

Use Vercel's official Next.js `with-supabase` starter for the organiser dashboard.

Reuse from the foundation:

- Supabase server/client setup
- Organiser authentication
- Protected dashboard structure
- Tailwind and shadcn/ui setup
- Vercel deployment path

Replace the starter content with simple CRUD pages for schedule, announcements, resources, rooms, and emergency contacts.

### Reference-only projects

`Open Schedule` is MIT-licensed and useful as a reference for event administration, schedule views, and announcements. Its Java/Spring/Vaadin stack does not match the planned Expo/Supabase system, so forking it would replace one implementation problem with a migration problem.

`MUNify DELEGATOR` addresses registration and delegation management rather than an attendee conference companion. Its own documentation says it is early-stage and not recommended for production use without consultation. Do not base the KAMUN mobile release on it.

The EventYay Expo demo is visually and structurally close to the desired mobile app, but its repository page does not state a standard software license. Do not copy its source unless the copyright holder supplies a clear compatible license. Its public architecture and screen list can be used as design reference.

## Simplified MVP

The fast-track version contains:

1. Local onboarding: attendee name, role label, and committee selection stored on the device
2. Home: next session, committee, latest announcement, and quick links
3. Schedule: Friday/Saturday/Sunday, filtered by committee
4. Announcements: published organiser updates
5. Resources: general and committee documents
6. Locations: venue, rooms, and external map links
7. Emergency and welfare information, cached offline
8. Settings: change committee, refresh data, privacy, and support
9. Small organiser dashboard for maintaining the above content

## Remove from the first release

- Delegate accounts and invite codes
- Delegate records in the backend
- Logistics requests
- Memes, voting, uploads, reporting, and moderation
- Gallery and elaborate staff profiles
- Multiple conferences
- Committee-specific push notifications
- Realtime subscriptions
- Complex CSV imports

Without attendee-generated content or private delegate data, the mobile app can read only published conference content. A user's name and committee stay on their device. Only organisers need authenticated accounts.

## Minimal data model

| Table | Purpose |
| --- | --- |
| `conferences` | KAMUN name, dates, timezone, venue, published status |
| `committees` | Committee name, abbreviation, topic, colour, room |
| `schedule_events` | Session title, time, room, optional committee, type, published status |
| `announcements` | Title, body, priority, optional committee, publish/expiry time |
| `resources` | Title, document URL/path, category, optional committee |
| `locations` | Venue/room/location information and map coordinates or link |
| `emergency_contacts` | Label, person/role, phone/email, ordering |
| `admin_profiles` | Authenticated organiser ID and admin/editor role |

All attendee-facing tables allow anonymous read access only when `published = true`. Writes require an authenticated organiser role.

## Four accelerated phases

### Phase 1 — Fork foundations and prove stores

**Time:** 2 days

- Create the Expo app from the official starter.
- Create the dashboard from the official Next.js/Supabase starter.
- Configure Supabase development and production environments.
- Reserve iOS and Android identifiers.
- Upload the shell to TestFlight internal and Google Play internal testing.
- Add the minimal database migration and sample KAMUN data.

**Deliverable:** signed app shell on real iPhone and Android devices.

### Phase 2 — Build the attendee companion

**Time:** 4–5 days

- Build local onboarding, home, schedule, announcements, resources, locations, emergency, and settings.
- Add committee filtering.
- Persist the last successful content response for offline use.
- Add loading, empty, stale, offline, and retry states.

**Deliverable:** complete read-only mobile MVP using seeded content.

### Phase 3 — Build organiser editing and load real content

**Time:** 3–4 days

- Add organiser login.
- Add schedule, announcement, resource, location, and emergency-contact forms.
- Add draft/publish controls and basic validation.
- Enter the real KAMUN content.
- Rehearse a room change and urgent announcement.

**Deliverable:** organisers can maintain the conference without developer intervention.

### Phase 4 — Test, submit, and launch

**Time:** 3 days of engineering plus store-review buffer

- Test on physical iPhone and Android devices.
- Test fresh install, committee change, offline launch, reconnection, missing content, bad document link, and organiser permissions.
- Complete privacy declarations, screenshots, descriptions, support links, reviewer notes, and production builds.
- Submit to both stores and fix only review blockers or critical defects.

**Deliverable:** public version 1.0 on both stores.

## Features to add after launch

Add attendee identity only when a feature genuinely needs ownership. The recommended order is:

1. Broadcast push notifications
2. Logistics requests with anonymous Supabase identity
3. Chair/staff mobile views
4. Committee-targeted notifications
5. Meme feed with reporting, blocking, filtering, and moderation

This keeps the simple release from inheriting the security and operational work of features that are not needed for schedules and conference information.

## License rules

- Prefer MIT, BSD, or Apache-2.0 code for foundations and components.
- Keep required copyright and license notices in the repository and distribution where applicable.
- Do not copy code from a repository with no license; public source is not automatically permission to reuse it.
- Review AGPL dependencies carefully because distributing or operating modified network software can create source-sharing obligations.
- Do not copy another conference's artwork, documents, brand, screenshots, or store metadata.

## Immediate next task

Create a short-lived technical spike from the official Expo starter, connect it to a minimal Supabase schema, and display a seeded KAMUN schedule on one iPhone and one Android device. In parallel, create the organiser dashboard from the official Next.js/Supabase starter. Keep the spike only if both foundations build cleanly and the schedule works offline within two days.
