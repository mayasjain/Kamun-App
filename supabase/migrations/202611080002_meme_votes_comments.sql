begin;
create table public.meme_votes (
 meme_id uuid not null references public.committee_memes(id) on delete cascade,
 actor text not null,
 value smallint not null check(value in (-1,1)),
 primary key(meme_id,actor)
);
create table public.meme_comments (
 id uuid primary key default gen_random_uuid(),
 meme_id uuid not null references public.committee_memes(id) on delete cascade,
 conference_id uuid not null references public.conferences(id),
 actor text not null,
 author_label text not null,
 body text not null check(char_length(body) between 1 and 500 and body ~ '[^[:space:]]'),
 created_at timestamptz not null default now(),
 removed_at timestamptz
);
create index meme_comments_page on public.meme_comments(meme_id,created_at desc,id desc);
create index meme_comments_actor_time on public.meme_comments(conference_id,actor,created_at);
create table public.meme_interaction_limits (
 conference_id uuid not null references public.conferences(id),
 actor text not null,
 action text not null check(action in ('vote','comment')),
 window_start timestamptz not null,
 attempts integer not null,
 primary key(conference_id,actor,action)
);
alter table public.meme_votes enable row level security;
alter table public.meme_comments enable row level security;
alter table public.meme_interaction_limits enable row level security;
revoke all on public.meme_votes,public.meme_comments,public.meme_interaction_limits from public,anon,authenticated;

-- These helpers are callable only by the definer RPCs below. Auth user IDs are
-- installation/session identities; ECE person IDs remain stable across devices.
create function public.meme_actor(p_conference_id uuid) returns text
language sql stable security definer set search_path=public as $$
 select case when m.identity_source='ecg' then 'ecg:' || b.ecg_person_id::text
  else 'legacy:' || m.access_code_id::text end
 from public.attendee_memberships m left join public.ecg_participant_bindings b
  on b.conference_id=m.conference_id and b.user_id=m.user_id
 where m.conference_id=p_conference_id and m.user_id=auth.uid()
  and public.has_current_attendee_access(p_conference_id) limit 1;
$$;
create function public.acquire_meme_interaction(p_conference_id uuid,p_actor text,p_action text)
returns void language plpgsql security definer set search_path=public as $$
declare v_attempts integer;
begin
 insert into public.meme_interaction_limits as l(conference_id,actor,action,window_start,attempts)
 values(p_conference_id,p_actor,p_action,now(),1)
 on conflict(conference_id,actor,action) do update set
  window_start=case when l.window_start<=now()-interval '1 minute' then now() else l.window_start end,
  attempts=case when l.window_start<=now()-interval '1 minute' then 1 else l.attempts+1 end
 returning attempts into v_attempts;
 if v_attempts > (case when p_action='comment' then 3 else 60 end) then
  raise exception 'Please wait a minute before trying again.' using errcode='54000';
 end if;
end;
$$;

create function public.get_meme_activity(p_ids uuid[])
returns table(meme_id uuid,upvotes bigint,downvotes bigint,my_vote smallint,comment_count bigint)
language plpgsql stable security definer set search_path=public as $$
begin
 if p_ids is null or cardinality(p_ids)>24 then
  raise exception 'Request up to 24 memes' using errcode='22023'; end if;
 return query select m.id,
  (select count(*) from public.meme_votes v where v.meme_id=m.id and v.value=1),
  (select count(*) from public.meme_votes v where v.meme_id=m.id and v.value=-1),
  coalesce((select v.value from public.meme_votes v where v.meme_id=m.id and v.actor=public.meme_actor(m.conference_id)),0)::smallint,
  (select count(*) from public.meme_comments c where c.meme_id=m.id and c.removed_at is null)
 from public.committee_memes m where m.id=any(p_ids) and m.removed_at is null
  and (public.has_current_attendee_access(m.conference_id) or public.is_kamun_admin());
end;
$$;
create function public.set_meme_vote(p_meme_id uuid,p_value integer)
returns void language plpgsql security definer set search_path=public as $$
declare m public.committee_memes%rowtype; v_actor text;
begin
 if p_value is null or p_value not in (-1,0,1) then raise exception 'Invalid vote' using errcode='22023'; end if;
 select * into m from public.committee_memes where id=p_meme_id and removed_at is null for update;
 v_actor:=public.meme_actor(m.conference_id);
 if m.id is null or v_actor is null then raise exception 'Meme unavailable. Sign in again.' using errcode='42501'; end if;
 perform public.acquire_meme_interaction(m.conference_id,v_actor,'vote');
 if p_value=0 then delete from public.meme_votes where meme_id=m.id and actor=v_actor;
 else
  insert into public.meme_votes(meme_id,actor,value) values(m.id,v_actor,p_value)
  on conflict(meme_id,actor) do update set value=excluded.value;
 end if;
end;
$$;

create function public.list_meme_comments(p_meme_id uuid,p_before timestamptz default null,p_before_id uuid default null)
returns table(id uuid,body text,author_label text,created_at timestamptz,is_own boolean,can_remove boolean)
language plpgsql stable security definer set search_path=public as $$
declare m public.committee_memes%rowtype; v_actor text;
begin
 select * into m from public.committee_memes where committee_memes.id=p_meme_id and removed_at is null;
 v_actor:=public.meme_actor(m.conference_id);
 if m.id is null or (v_actor is null and not public.is_kamun_admin()) then raise exception 'Meme unavailable. Sign in again.' using errcode='42501'; end if;
 if (p_before is null)<>(p_before_id is null) then raise exception 'Invalid comment cursor' using errcode='22023'; end if;
 return query select c.id,c.body,c.author_label,c.created_at,coalesce(c.actor=v_actor,false),
  coalesce(c.actor=v_actor,false) or public.can_moderate_meme_gallery(m.conference_id,m.committee_id)
 from public.meme_comments c where c.meme_id=m.id and c.removed_at is null
  and (p_before is null or (c.created_at,c.id)<(p_before,p_before_id))
 order by c.created_at desc,c.id desc limit 20;
end;
$$;
create function public.add_meme_comment(p_meme_id uuid,p_body text)
returns uuid language plpgsql security definer set search_path=public as $$
declare m public.committee_memes%rowtype; v_actor text; v_label text; v_id uuid; v_body text:=btrim(p_body);
begin
 if v_body is null or char_length(v_body) not between 1 and 500 or v_body !~ '[^[:space:]]' then
  raise exception 'Write a comment between 1 and 500 characters.' using errcode='22023'; end if;
 select * into m from public.committee_memes where id=p_meme_id and removed_at is null for update;
 v_actor:=public.meme_actor(m.conference_id);
 if m.id is null or v_actor is null then raise exception 'Meme unavailable. Sign in again.' using errcode='42501'; end if;
 perform public.acquire_meme_interaction(m.conference_id,v_actor,'comment');
 if (select count(*) from public.meme_comments c where c.conference_id=m.conference_id and c.actor=v_actor and c.created_at>now()-interval '1 day')>=30 then
  raise exception 'You have reached the daily comment limit.' using errcode='54000'; end if;
 -- Include removed comments so moderation cannot be used to recycle capacity.
 if (select count(*) from public.meme_comments c where c.meme_id=m.id)>=200 then
  raise exception 'This meme has reached its comment limit.' using errcode='54000'; end if;
 select concat_ws(' · ',case when a.access_type='chair' then 'Chair' else coalesce(b.seat_label,'Delegate') end,c.abbreviation)
 into v_label from public.attendee_memberships a
 left join public.ecg_participant_bindings b on b.conference_id=a.conference_id and b.user_id=a.user_id
 left join public.committees c on c.id=a.committee_id
 where a.conference_id=m.conference_id and a.user_id=auth.uid();
 insert into public.meme_comments(meme_id,conference_id,actor,author_label,body)
 values(m.id,m.conference_id,v_actor,v_label,v_body) returning id into v_id;
 return v_id;
end;
$$;
create function public.remove_meme_comment(p_comment_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 update public.meme_comments c set removed_at=now()
 from public.committee_memes m where c.id=p_comment_id and c.meme_id=m.id
  and c.removed_at is null and m.removed_at is null
  and (c.actor=public.meme_actor(m.conference_id) or public.can_moderate_meme_gallery(m.conference_id,m.committee_id));
 return found;
end;
$$;
revoke all on function public.meme_actor(uuid),public.acquire_meme_interaction(uuid,text,text),
 public.get_meme_activity(uuid[]),public.set_meme_vote(uuid,integer),
 public.list_meme_comments(uuid,timestamptz,uuid),public.add_meme_comment(uuid,text),public.remove_meme_comment(uuid)
 from public,anon,authenticated;
grant execute on function public.get_meme_activity(uuid[]),public.set_meme_vote(uuid,integer),
 public.list_meme_comments(uuid,timestamptz,uuid),public.add_meme_comment(uuid,text),public.remove_meme_comment(uuid)
 to authenticated;
commit;
