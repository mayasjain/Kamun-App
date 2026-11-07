-- DISEC details and guide supplied by the organiser.
begin;
insert into public.committees (
 id, conference_id, name, abbreviation, topic, experience_level, participant_group, display_order, published
) values (
 '20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001',
 'Disarmament and International Security Committee', 'DISEC',
 'Addressing the Use of Nuclear Weapons in Regional Conflicts', 'Beginner', 'University', 10, true
) on conflict (conference_id, abbreviation) do update set
 name=excluded.name, topic=excluded.topic, experience_level=excluded.experience_level,
 participant_group=excluded.participant_group, display_order=excluded.display_order, published=excluded.published;

insert into public.committee_chairs (committee_id, name, sort_order, published)
select id, chair.name, chair.sort_order, true from public.committees
cross join (values ('Alp Özden',1),('Filippa Kuhnert',2)) as chair(name,sort_order)
where conference_id='10000000-0000-4000-8000-000000000001' and abbreviation='DISEC'
on conflict (committee_id,name) do update set sort_order=excluded.sort_order,published=true;

-- The PDF is uploaded separately; this records the immutable published file.
insert into public.resources (conference_id,committee_id,title,kind,url,sort_order,published)
select conference_id,id,'DISEC Study Guide','pdf',
 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/disec-study-guide-8825934f6f5e.pdf',40,true
from public.committees c
where conference_id='10000000-0000-4000-8000-000000000001' and abbreviation='DISEC'
 and not exists (select 1 from public.resources r where r.conference_id=c.conference_id and r.committee_id=c.id and r.title='DISEC Study Guide');
commit;
