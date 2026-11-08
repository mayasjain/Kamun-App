-- Allocate upload capacity before Storage accepts bytes. Never recycle a path's
-- budget automatically: expired reservations may already have a backing object.
begin;
-- Finish pre-migration uploads before counting existing objects, and hold new
-- writes until the replacement policy commits so no object escapes accounting.
lock table storage.objects in share row exclusive mode;

create table public.meme_upload_budgets (
 budget_key text primary key,
 issued bigint not null check (issued >= 0)
);
create table public.meme_upload_reservations (
 image_path text primary key,
 user_id uuid not null,
 conference_id uuid not null references public.conferences(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now() + interval '10 minutes'
);
create index meme_upload_reservations_user_time
 on public.meme_upload_reservations(user_id,created_at);
alter table public.meme_upload_budgets enable row level security;
alter table public.meme_upload_reservations enable row level security;
revoke all on public.meme_upload_budgets, public.meme_upload_reservations
 from public,anon,authenticated;

-- Existing objects consume slots too. No Storage metadata or files are deleted.
insert into public.meme_upload_budgets(budget_key,issued)
 select 'bucket',count(*) from storage.objects where bucket_id='committee-memes';
insert into public.meme_upload_budgets(budget_key,issued)
 select 'user:' || owner_id,count(*) from storage.objects
 where bucket_id='committee-memes' and owner_id is not null group by owner_id;

create function public.reserve_meme_upload(p_conference_id uuid,p_content_type text)
returns text language plpgsql security definer set search_path=public as $$
declare
 v_user uuid := auth.uid();
 v_count bigint;
 v_path text;
 v_extension text;
begin
 if v_user is null or not public.has_current_attendee_access(p_conference_id) then
  raise exception 'Current participant access required' using errcode='42501';
 end if;
 v_extension := case p_content_type when 'image/jpeg' then 'jpeg'
  when 'image/png' then 'png' when 'image/webp' then 'webp' end;
 if v_extension is null then
  raise exception 'Choose a JPG, PNG or WebP photo' using errcode='22023';
 end if;

 -- Atomic UPDATE serializes allocation, including concurrent accounts. With
 -- the bucket's 8 MiB object limit, 2,000 paths bound retained bytes to 16 GiB.
 update public.meme_upload_budgets set issued=issued+1
  where budget_key='bucket' and issued<2000 returning issued into v_count;
 if not found then
  raise exception 'The gallery upload capacity has been reached' using errcode='54000';
 end if;
 insert into public.meme_upload_budgets as b(budget_key,issued)
  values('user:' || v_user::text,1)
  on conflict(budget_key) do update set issued=b.issued+1 where b.issued<100
  returning issued into v_count;
 if not found then
  raise exception 'Your gallery upload capacity has been reached' using errcode='54000';
 end if;
 if (select count(*) from public.meme_upload_reservations
     where user_id=v_user and created_at>now()-interval '1 hour')>=10 then
  raise exception 'You have started ten uploads this hour. Try again later.' using errcode='54000';
 end if;
 v_path := v_user::text || '/' || p_conference_id::text || '/' || gen_random_uuid()::text || '.' || v_extension;
 insert into public.meme_upload_reservations(image_path,user_id,conference_id)
  values(v_path,v_user,p_conference_id);
 return v_path;
end;
$$;

create function public.can_upload_reserved_meme(p_path text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.meme_upload_reservations r
  where r.image_path=p_path and r.user_id=auth.uid() and r.expires_at>now()
   and public.has_current_attendee_access(r.conference_id));
$$;
revoke all on function public.reserve_meme_upload(uuid,text),public.can_upload_reserved_meme(text)
 from public,anon,authenticated;
grant execute on function public.reserve_meme_upload(uuid,text),public.can_upload_reserved_meme(text)
 to authenticated;

drop policy meme_upload on storage.objects;
create policy meme_upload on storage.objects for insert to authenticated
 with check(bucket_id='committee-memes' and public.can_upload_reserved_meme(name));
commit;
