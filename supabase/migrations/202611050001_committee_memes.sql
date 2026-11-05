begin;
create table public.committee_memes (
 id uuid primary key default gen_random_uuid(), conference_id uuid not null,
 committee_id uuid not null, author_id uuid not null references auth.users(id),
 image_path text not null unique, caption text not null default '' check(char_length(caption)<=180),
 created_at timestamptz not null default now(), removed_at timestamptz,
 foreign key (conference_id,committee_id) references public.committees(conference_id,id)
);
create index committee_memes_recent on public.committee_memes(conference_id,created_at desc,id desc);
create table public.committee_meme_reports (
 meme_id uuid not null references public.committee_memes(id) on delete cascade,
 reporter_id uuid not null references auth.users(id), reason text not null check(char_length(reason) between 3 and 500),
 created_at timestamptz not null default now(), primary key(meme_id,reporter_id)
);
alter table public.committee_memes enable row level security;
alter table public.committee_meme_reports enable row level security;
revoke all on public.committee_memes,public.committee_meme_reports from anon,authenticated;
grant select,update on public.committee_memes to authenticated;
grant select on public.committee_meme_reports to authenticated;
create policy meme_admin_read on public.committee_memes for select to authenticated using(public.is_kamun_admin());
create policy meme_admin_update on public.committee_memes for update to authenticated using(public.is_kamun_admin()) with check(public.is_kamun_admin());
create policy meme_report_admin on public.committee_meme_reports for select to authenticated using(public.is_kamun_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('committee-memes','committee-memes',false,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy meme_upload on storage.objects for insert to authenticated with check (
 bucket_id='committee-memes' and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.attendee_memberships m where m.user_id=auth.uid() and m.conference_id::text=(storage.foldername(name))[2] and public.has_current_attendee_access(m.conference_id))
);
-- A definer function avoids exposing author IDs in the attendee feed.
create function public.list_committee_memes(p_conference_id uuid,p_committee_id uuid default null,p_before timestamptz default null)
returns table(id uuid,committee_id uuid,image_path text,caption text,created_at timestamptz,is_own boolean)
language sql stable security definer set search_path=public as $$
 select m.id,m.committee_id,m.image_path,m.caption,m.created_at,m.author_id=auth.uid()
 from public.committee_memes m where m.conference_id=p_conference_id and m.removed_at is null
 and public.has_current_attendee_access(p_conference_id)
 and (p_committee_id is null or m.committee_id=p_committee_id)
 and (p_before is null or m.created_at<p_before)
 order by m.created_at desc,m.id desc limit 24;
$$;
-- Storage SELECT needs the same access without granting table visibility.
create function public.can_read_meme_image(p_path text) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.committee_memes m where m.image_path=p_path and m.removed_at is null and public.has_current_attendee_access(m.conference_id));
$$;
create policy meme_image_read on storage.objects for select to authenticated using(bucket_id='committee-memes' and (public.is_kamun_admin() or (storage.foldername(name))[1]=auth.uid()::text or public.can_read_meme_image(name)));
create policy meme_cleanup on storage.objects for delete to authenticated using(bucket_id='committee-memes' and (storage.foldername(name))[1]=auth.uid()::text and not public.can_read_meme_image(name));
create function public.post_committee_meme(p_conference_id uuid,p_committee_id uuid,p_image_path text,p_caption text default '') returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
 if not public.has_current_attendee_access(p_conference_id) then raise exception 'Current participant access required'; end if;
 if not exists(select 1 from public.committees c join public.conferences f on f.id=c.conference_id where c.id=p_committee_id and c.conference_id=p_conference_id and c.published and f.published) then raise exception 'Committee unavailable'; end if;
 if split_part(p_image_path,'/',1)<>auth.uid()::text or split_part(p_image_path,'/',2)<>p_conference_id::text or not exists(select 1 from storage.objects where bucket_id='committee-memes' and name=p_image_path and owner_id=auth.uid()::text) then raise exception 'Upload a photo first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,51));
 if (select count(*) from public.committee_memes where author_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'You have posted ten memes this hour. Try again later.'; end if;
 insert into public.committee_memes(conference_id,committee_id,author_id,image_path,caption) values(p_conference_id,p_committee_id,auth.uid(),p_image_path,trim(coalesce(p_caption,''))) returning id into result;
 return result;
end; $$;
create function public.remove_committee_meme(p_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
begin
 update public.committee_memes set removed_at=now() where id=p_id and author_id=auth.uid() and public.has_current_attendee_access(conference_id);
 return found;
end; $$;
create function public.report_committee_meme(p_id uuid,p_reason text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.committee_memes where id=p_id and removed_at is null and public.has_current_attendee_access(conference_id)) then raise exception 'Meme unavailable'; end if;
 insert into public.committee_meme_reports(meme_id,reporter_id,reason) values(p_id,auth.uid(),trim(p_reason)) on conflict do nothing;
end; $$;
revoke all on function public.list_committee_memes(uuid,uuid,timestamptz),public.can_read_meme_image(text),public.post_committee_meme(uuid,uuid,text,text),public.remove_committee_meme(uuid),public.report_committee_meme(uuid,text) from public,anon;
grant execute on function public.list_committee_memes(uuid,uuid,timestamptz),public.can_read_meme_image(text),public.post_committee_meme(uuid,uuid,text,text),public.remove_committee_meme(uuid),public.report_committee_meme(uuid,text) to authenticated;
commit;
