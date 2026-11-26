# KAMUN 2026 · The Black Forest Summit

The public conference guide for Karlsruhe Model United Nations, 13–15 November 2026. Browse the programme, public announcements, committees, resources, Secretariat and partners without signing in. A separate organiser dashboard manages conference content.

**[Open the conference guide](https://app.kamun.org)** · **[About KAMUN](https://kamun.org/kamun/)**

## Project structure

| Directory | Purpose |
| --- | --- |
| [`apps/mobile`](apps/mobile) | Expo and React Native guide for web, iOS and Android |
| [`apps/admin`](apps/admin) | Next.js dashboard for organisers with Supabase Auth |
| [`supabase`](supabase) | PostgreSQL migrations, sample data, Edge Functions and backend tests |
| [`docs`](docs) | Release notes and validation records |
| [`integrations/ece`](integrations/ece) | Reference for the ECE integration used during the conference |

## Run locally

Use Node.js 24.3 or later and npm. To run a local Supabase instance, also install Docker and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```sh
npm ci --prefix apps/mobile
npm ci --prefix apps/admin
cp apps/mobile/.env.example apps/mobile/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

From the repository root, run `supabase start` to start the local services and load the migrations and sample data. Copy the displayed project URL and publishable key into both `.env.local` files. You can also use a development Supabase project with the schema already applied.

| App | Development command |
| --- | --- |
| Conference guide | `npm run dev:mobile` |
| Organiser dashboard | `npm run dev:admin` |

Run the commands in separate terminals. The guide uses the project's public data access rules. For dashboard access, create an email/password user in Supabase Auth and add their user UUID to `public.admin_profiles` with the `admin` role. The dashboard sign-in route is `/auth/login`.

The sample project includes conference records and document covers. To enable downloads in your development project, upload the original PDFs to its `conference-resources` bucket and update the resource URLs. Personal staff contacts and team portraits are provisioned privately. Without the portrait assets, the guide displays staff initials.

## Checks and builds

```sh
npm run check                      # Lint, type checking and tests
npm --prefix apps/mobile run build:web
npm --prefix apps/admin run build
```

SQL regression checks are in [`supabase/tests`](supabase/tests). The web export is written to `apps/mobile/dist` and can be deployed with the [Cloudflare Pages configuration](apps/mobile/wrangler.json). The organiser dashboard builds and deploys separately.

Use an isolated development project for schema changes and tests. Keep database backups, attendee codes, private assets and server credentials outside version control. A public Storage bucket serves files directly, so upload only documents approved for public sharing.

## Credits and assets

KAMUN 2026 is organised by [MUNIKA e.V.](https://kamun.org/). The Expo starter includes its [MIT notice](apps/mobile/LICENSE). Conference branding, partner logos and materials remain subject to their respective rights holders’ terms.
