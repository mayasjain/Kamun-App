# KAMUN App

Fast-track foundation for the KAMUN 2026 attendee app and organiser dashboard.

## Projects

- `apps/mobile`: Expo SDK 57 mobile app for iOS, Android, and web
- `apps/admin`: Next.js organiser dashboard with Supabase authentication
- `supabase`: database migrations and development seed data

## Local development

Copy the `.env.example` files in each app to `.env.local` and add the same Supabase project URL and publishable key.

```bash
cd apps/mobile
npm run start
```

```bash
cd apps/admin
npm run dev
```

The mobile app displays safe sample data until Supabase credentials are configured.

The package identifier `org.munika.kamun` is provisional and must be confirmed before the first signed store build.

## First organiser

After creating the first organiser in Supabase Auth, grant access explicitly:

```sql
insert into public.admin_profiles (user_id, role)
values ('AUTH_USER_UUID', 'admin');
```

Authenticated users without an `admin_profiles` row cannot open the organiser dashboard or modify conference content.
