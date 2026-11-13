begin;

-- Only verified IPC seat labels are used; access codes and personal names are not stored.
create function public.normalize_ipc_meme_seat(p_label text)
returns text language sql immutable set search_path=public as $$
 select replace(replace(replace(lower(regexp_replace(btrim(p_label),'[[:space:]]+',' ','g')),
  '(cupuos)','(copuos)'),'(european parliament)','(ep)'),'(us cc)','(uscc)');
$$;

create table public.ipc_meme_assignments (
 conference_id uuid not null references public.conferences(id),
 seat_label text not null,
 committee_id uuid not null,
 primary key(conference_id,seat_label),
 foreign key(conference_id,committee_id) references public.committees(conference_id,id),
 check(seat_label=public.normalize_ipc_meme_seat(seat_label))
);
alter table public.ipc_meme_assignments enable row level security;
revoke all on public.ipc_meme_assignments from public,anon,authenticated;

insert into public.ipc_meme_assignments(conference_id,seat_label,committee_id)
select c.conference_id,public.normalize_ipc_meme_seat(v.seat),c.id
from (values
 ('Al Jazeera (IAEA)','IAEA'),
 ('BBC World (ILO)','ILO'),
 ('Charlie Hebdo (European Parliament)','EP'),
 ('China Daily (CUPUOS)','COPUOS'),
 ('Eleanzer Oswald (EIC of the Independent Gazetteer) (US CC)','USCC'),
 ('Financial Times (ILO)','ILO'),
 ('Fox News (UNSC)','UNSC'),
 ('New York Times (WHO)','WHO'),
 ('Russia Today (IAEA)','IAEA'),
 ('The Guardian (DISEC)','DISEC'),
 ('The Island Times (PIF)','PIF')
) v(seat,target)
join public.committees c on c.abbreviation=v.target
where c.conference_id='10000000-0000-4000-8000-000000000001';
do $$ begin
 if (select count(*) from public.ipc_meme_assignments where conference_id='10000000-0000-4000-8000-000000000001')<>11 then
  raise exception 'IPC assignments require all target committees to exist';
 end if;
end $$;

create function public.can_post_committee_meme(p_conference_id uuid,p_committee_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select (public.is_conference_admin(p_conference_id) or public.has_current_attendee_access(p_conference_id))
 and (p_committee_id is null or exists(
  select 1 from public.committees c join public.conferences f on f.id=c.conference_id
  where c.id=p_committee_id and c.conference_id=p_conference_id and c.published and f.published
  and (public.is_conference_admin(p_conference_id)
   or public.has_current_attendee_access(p_conference_id,null,p_committee_id)
   or exists(
    select 1 from public.ecg_participant_bindings b
    join public.attendee_memberships m on m.conference_id=b.conference_id and m.user_id=b.user_id
    join public.committees ipc on ipc.id=b.committee_id and ipc.conference_id=b.conference_id
    join public.ipc_meme_assignments a on a.conference_id=b.conference_id
     and a.seat_label=public.normalize_ipc_meme_seat(b.seat_label)
    where b.conference_id=p_conference_id and b.user_id=auth.uid()
     and b.access_type='member' and b.revoked_at is null and b.valid_until>now()
     and m.identity_source='ecg' and m.access_type='member' and m.committee_id=b.committee_id
     and ipc.abbreviation='IPC' and a.committee_id=p_committee_id
     and public.has_current_attendee_access(p_conference_id,'member',ipc.id)
   ))
  ));
$$;

create function public.get_my_meme_posting_committees(p_conference_id uuid)
returns uuid[] language sql stable security definer set search_path=public as $$
 select coalesce(array_agg(c.id order by c.id),'{}'::uuid[])
 from public.committees c where c.conference_id=p_conference_id
  and public.can_post_committee_meme(p_conference_id,c.id);
$$;
revoke all on function public.normalize_ipc_meme_seat(text),public.can_post_committee_meme(uuid,uuid),public.get_my_meme_posting_committees(uuid) from public,anon,authenticated;
grant execute on function public.get_my_meme_posting_committees(uuid) to authenticated;

create or replace function public.post_committee_meme(p_conference_id uuid,p_committee_id uuid,p_image_path text,p_caption text default '') returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
 if (not public.has_current_attendee_access(p_conference_id) and not public.is_conference_admin(p_conference_id)) then raise exception 'Current participant access required'; end if;
 if not public.can_post_committee_meme(p_conference_id,p_committee_id) then
  raise exception 'You can post only to General, your own committee or your assigned reporting committee' using errcode='42501';
 end if;
 if p_committee_id is not null and not exists(select 1 from public.committees c join public.conferences f on f.id=c.conference_id where c.id=p_committee_id and c.conference_id=p_conference_id and c.published and f.published) then raise exception 'Committee unavailable'; end if;
 if split_part(p_image_path,'/',1)<>auth.uid()::text or split_part(p_image_path,'/',2)<>p_conference_id::text or not exists(select 1 from storage.objects where bucket_id='committee-memes' and name=p_image_path and owner_id=auth.uid()::text) then raise exception 'Upload a photo first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,51));
 if (select count(*) from public.committee_memes where author_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'You have posted ten memes this hour. Try again later.'; end if;
 insert into public.committee_memes(conference_id,committee_id,author_id,image_path,caption) values(p_conference_id,p_committee_id,auth.uid(),p_image_path,trim(coalesce(p_caption,''))) returning id into result;
 return result;
end; $$;


commit;
