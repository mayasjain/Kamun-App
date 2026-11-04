KAMUN 2026

Attendee app: apps/mobile (Expo for iOS, Android and web)
Organiser dashboard: apps/admin (Next.js)
Database schema and backend functions: supabase/

Repository layout
- apps/mobile/src/: Expo routes, components, contexts, hooks, constants and libraries.
- apps/admin/src/: Next.js routes, components, libraries and authentication proxy.
- Each app keeps configuration, environment files, package.json and package-lock.json
  at its own root, with tests in tests/. The @/ import alias points to that app's src/.
- apps/mobile/assets/: bundled branding, document covers and partner logos.
- apps/mobile/public/: web manifest and install icons.
- supabase/migrations/: ordered database history; supabase/functions/: edge functions.
- supabase/scripts/: manual chair and organiser access-code setup SQL.
- supabase/tests/: backend regression tests and SQL checks.
- integrations/ece/: source patch and setup instructions for the external ECE app.
- docs/: release notes and manual backend validation instructions.

The root package provides convenience commands only. Each app has an independent
dependency installation and lockfile; install dependencies inside each app.
Keep framework-specific code in its app and backend code in supabase/.

Local setup
1. Install dependencies with npm ci in each app directory.
2. Copy each .env.example to .env.local and configure the appropriate Supabase project.
3. From the repository root, start the attendee app with npm run dev:mobile.
4. Start the organiser dashboard with npm run dev:admin in another terminal.

The shared ECE login is implemented locally but is not deployed to the live site.
Current deployment requirements and verification: docs/ECG_SHARED_CODE_RELEASE.txt
ECE source patch and installation instructions: integrations/ece/README.txt
Legacy KAMUN test codes do not establish an ECE identity.

Validation
- From the repository root: npm run check (lint, type checks and automated tests).
- Run individual checks with npm run lint, npm run typecheck or npm test.
- Each app also supports npm run lint, npm run typecheck and npm test locally.
- Database rollback checks are in supabase/tests/ and docs/BACKEND_VALIDATION.sql.
- Keep the migrations: existing deployments and clean installs depend on their order.

Organiser setup
Create a non-anonymous email/password user in Supabase Auth, then grant only a
trusted organiser an admin_profiles row with that user's UUID and role 'admin'.
The dashboard login is /auth/login; attendee codes do not grant admin access.
The conference-resources bucket is public: hiding a listing does not make its
file private. Upload only documents approved for public sharing.
