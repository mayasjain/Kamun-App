begin;
insert into auth.users(id) values('87000000-0000-4000-8000-000000000001'),('87000000-0000-4000-8000-000000000002'),('87000000-0000-4000-8000-000000000003');
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','87000000-0000-4000-8000-000000000001',970001,'delegate','ILO','France',repeat('a',64));
select public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','87000000-0000-4000-8000-000000000002',970002,'delegate','ILO','Brazil',repeat('b',64));
select public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','87000000-0000-4000-8000-000000000003',970003,'chair','ILO',null,repeat('c',64));
reset role;
insert into public.committee_memes(id,conference_id,committee_id,author_id,image_path,caption,chairs_only)
select ('97000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'10000000-0000-4000-8000-000000000001',
 case when n=2 then (select id from public.committees where abbreviation='ILO') else null end,
 case when n in (3,4) then '87000000-0000-4000-8000-000000000003'::uuid else '87000000-0000-4000-8000-000000000001'::uuid end,
 'author-removal-'||n,'Removal fixture',n in (3,4)
from generate_series(1,5) n;
set local role authenticated;
select set_config('request.jwt.claim.sub','87000000-0000-4000-8000-000000000002',true);
do $$ begin
 if public.remove_committee_meme('97000000-0000-4000-8000-000000000001') then raise exception 'Foreign author deletion allowed'; end if;
end $$;
select set_config('request.jwt.claim.sub','87000000-0000-4000-8000-000000000001',true);
do $$ begin
 if not public.remove_committee_meme('97000000-0000-4000-8000-000000000001') then raise exception 'Own General deletion denied'; end if;
 if public.remove_committee_meme('97000000-0000-4000-8000-000000000001') then raise exception 'Repeated removal accepted'; end if;
 if not public.remove_committee_meme('97000000-0000-4000-8000-000000000002') then raise exception 'Own committee deletion denied'; end if;
end $$;
select set_config('request.jwt.claim.sub','87000000-0000-4000-8000-000000000003',true);
do $$ begin
 if not public.remove_committee_meme('97000000-0000-4000-8000-000000000003') then raise exception 'Own Chairs deletion denied'; end if;
end $$;
reset role;
update public.ecg_participant_bindings set revoked_at=now() where ecg_person_id=970001;
update public.ecg_participant_bindings set access_type='member',seat_label='New seat' where ecg_person_id=970003;
update public.attendee_memberships set access_type='member' where user_id='87000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claim.sub','87000000-0000-4000-8000-000000000001',true);
do $$ begin
 if public.remove_committee_meme('97000000-0000-4000-8000-000000000005') then raise exception 'Revoked owner deletion allowed'; end if;
end $$;
select set_config('request.jwt.claim.sub','87000000-0000-4000-8000-000000000003',true);
do $$ begin
 if public.remove_committee_meme('97000000-0000-4000-8000-000000000004') then raise exception 'Former chair accessed private gallery'; end if;
end $$;
reset role;
rollback;
