// PGLITE_MODULE points to a temporary @electric-sql/pglite/dist/index.js.
// Uses real product tables/functions/policies. Only platform Auth/Storage and
// unavailable pgcrypto installation are substituted; no live backend is used.
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
if (!process.env.PGLITE_MODULE) throw new Error('Set PGLITE_MODULE to PGlite dist/index.js');
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE));
const db = new PGlite();
try {
 await db.exec(`
 create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema storage; create schema extensions;
 grant usage on schema public,auth,storage to anon,authenticated,service_role;
 create table auth.users(id uuid primary key,aud text,role text,email text,created_at timestamptz,updated_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text,unique(bucket_id,name));
 alter table storage.objects enable row level security;
 grant select,insert,update,delete on storage.objects to authenticated;
 create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
 `);
 const migrations=['202609300001_initial_kamun.sql','202609300002_attendee_access.sql',
 '202610210003_announcement_audiences.sql','202610210004_organizer_message_codes.sql','202610210005_emergency_whatsapp_contacts.sql',
 '202610210006_committee_gossip.sql','202610270001_ecg_identity.sql','202610270002_ecg_access_rules.sql','202610270003_personal_attendee_login.sql',
 '202611050001_committee_memes.sql','202611050002_meme_general_gallery.sql',
 '202611050003_meme_moderation.sql','202611050004_meme_posting_scope.sql',
 '202611080001_meme_upload_budget.sql','202611080002_meme_votes_comments.sql',
 '202611080003_chairs_meme_gallery.sql','202611080004_ecg_admin_login.sql','202611080005_shared_admin_app.sql'];
 for (const file of migrations) {
  try {
   await db.exec((await readFile(new URL('../migrations/'+file,import.meta.url),'utf8')).replace('create extension if not exists pgcrypto;',''));
  } catch(e) { throw new Error(`${file}: ${e.message} (position ${e.position ?? '?'})`, { cause: e }); }
  if(file==='202609300001_initial_kamun.sql') await db.exec(`
   insert into public.conferences(id,slug,name,starts_at,ends_at,published) values('10000000-0000-4000-8000-000000000001','test','Test',now(),now()+interval '1 day',true);
   insert into public.committees(id,conference_id,name,abbreviation,published) values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','ILO','ILO',true);
  `);
 }
 await db.exec(await readFile(new URL('../migrations/202611090001_web_push.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../migrations/202611110001_app_only_guests.sql',import.meta.url),'utf8'));
 await db.exec(`
 insert into public.committees(id,conference_id,name,abbreviation,published)
 select gen_random_uuid(),'10000000-0000-4000-8000-000000000001',v,v,true
 from unnest(array['IPC','IAEA','EP','COPUOS','USCC','UNSC','WHO','DISEC','PIF']) v on conflict(conference_id,abbreviation) do nothing;
 `);
 await db.exec(await readFile(new URL('../migrations/202611130001_ipc_meme_assignments.sql',import.meta.url),'utf8'));
 for (const file of ['meme_votes_comments.sql','chairs_meme_gallery.sql','shared_admin_app.sql','ipc_meme_assignments.sql']) {
  const sql = await readFile(new URL('./'+file,import.meta.url),'utf8');
  await db.exec(file==='chairs_meme_gallery.sql' ? sql.replace(/^insert into public.committees.*;$/m,'') : sql);
 }
 console.log('PASS: IPC assigned posting and existing vote, comment, chairs and admin permissions.');
 await db.exec(await readFile(new URL('./app_only_guests.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('./web_push.sql',import.meta.url),'utf8'));
 console.log('PASS: app-only guest role validation, claims/profiles, refresh, revocation and privilege isolation.');
 console.log('PASS: push audience, privacy/RLS, due queue, edit deduplication, leases, logout, expired grants, account transfer and removal.');
} catch(e) { console.error(e.message, e.where ?? '', e.position ?? '', e.internalQuery ?? ''); process.exitCode=1; }
finally { await db.close(); }
