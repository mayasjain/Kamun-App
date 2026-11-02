KAMUN 2026

Attendee app: apps/mobile (Expo for iOS, Android and web)
Organiser dashboard: apps/admin (Next.js)
Database schema and backend functions: supabase/

Local setup
1. Install dependencies with npm ci in each app directory.
2. Copy each .env.example to .env.local and configure the appropriate Supabase project.
3. Attendee app: cd apps/mobile && npm run web
4. Organiser dashboard: cd apps/admin && npm run dev

The shared ECE login is implemented locally but is not deployed to the live site.
Current deployment requirements and verification: docs/ECG_SHARED_CODE_RELEASE.txt
ECE source patch and installation instructions: integrations/ece/README.txt
Legacy KAMUN test codes do not establish an ECE identity.

Validation
- In both app directories: npm run lint and ./node_modules/.bin/tsc --noEmit
- From the repository root:
  node --test apps/mobile/tests/*.test.mjs apps/admin/tests/*.test.mjs supabase/tests/edge-handlers.test.mjs
- Database rollback checks are in supabase/tests/ and docs/BACKEND_VALIDATION.sql.
- Keep the migrations: existing deployments and clean installs depend on their order.

Organiser setup
Create a non-anonymous email/password user in Supabase Auth, then grant only a
trusted organiser an admin_profiles row with that user's UUID and role 'admin'.
The dashboard login is /auth/login; attendee codes do not grant admin access.
The conference-resources bucket is public: hiding a listing does not make its
file private. Upload only documents approved for public sharing.
