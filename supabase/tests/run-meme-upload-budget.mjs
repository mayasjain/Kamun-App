// Embedded PostgreSQL regression runner. Install @electric-sql/pglite in a
// temporary directory, then set PGLITE_MODULE to its dist/index.js absolute path.
// Auth/Storage API schemas below are minimal fixtures; RLS and product upload
// migrations run in PostgreSQL, without accessing any deployed backend.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
if (!process.env.PGLITE_MODULE) throw new Error('Set PGLITE_MODULE to a temporary PGlite installation');
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE));
const db = new PGlite();
try {
 await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create schema storage;
  grant usage on schema public,auth,storage to anon,authenticated,service_role;
  create table auth.users(id uuid primary key,aud text,role text,email text,created_at timestamptz,updated_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$
   select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  create table public.conferences(id uuid primary key,published boolean default true);
  create table public.committees(id uuid primary key,conference_id uuid,name text,abbreviation text,published boolean default true,unique(conference_id,id));
  create table public.test_members(user_id uuid,conference_id uuid,access_type text,committee_id uuid);
  create function public.has_current_attendee_access(p_conference_id uuid,p_access_type text default null,p_committee_id uuid default null)
   returns boolean language sql stable security definer as $$
    select exists(select 1 from public.test_members where user_id=auth.uid() and conference_id=p_conference_id
    and (p_access_type is null or access_type=p_access_type) and (p_committee_id is null or committee_id=p_committee_id)) $$;
  create function public.is_kamun_admin() returns boolean language sql stable as $$ select false $$;
  create function public.ecg_bind_verified_identity(uuid,uuid,bigint,text,text,text,text)
   returns void language sql security definer as $$ insert into public.test_members values($2,$1,'member','20000000-0000-4000-8000-000000000001') $$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text,unique(bucket_id,name));
  alter table storage.objects enable row level security;
  grant select,insert,update,delete on storage.objects to authenticated;
  create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
  insert into public.conferences(id) values('10000000-0000-4000-8000-000000000001');
  insert into public.committees(id,conference_id,abbreviation) values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','ILO');
 `);
 for (const name of ['202611050001_committee_memes.sql','202611050002_meme_general_gallery.sql','202611050003_meme_moderation.sql','202611050004_meme_posting_scope.sql']) {
  // The original upload policy refers to the existing membership relation.
  if (name==='202611050001_committee_memes.sql') await db.exec('create view public.attendee_memberships as select * from public.test_members; grant select on public.attendee_memberships to authenticated');
  await db.exec(await readFile(new URL('../migrations/'+name,import.meta.url),'utf8'));
 }
 // Backfill must count pre-existing objects, even orphans.
 await db.exec("insert into storage.objects(bucket_id,name,owner_id) values('committee-memes','legacy/orphan.png','legacy-owner')");
 await db.exec(await readFile(new URL('../migrations/202611080001_meme_upload_budget.sql',import.meta.url),'utf8'));
 assert.equal((await db.query("select issued from public.meme_upload_budgets where budget_key='bucket'")).rows[0].issued,1);
 assert.equal((await db.query("select issued from public.meme_upload_budgets where budget_key='user:legacy-owner'")).rows[0].issued,1);
 await db.exec(await readFile(new URL('./meme_upload_budget.sql',import.meta.url),'utf8'));
 console.log('PASS: real PostgreSQL RLS denies unreserved inserts; valid reserve/upload/post works; hourly, account, bucket, MIME, expiry, forgery and foreign-user cases pass; failed allocation rolls back counters; legacy objects counted.');
} finally { await db.close(); }
