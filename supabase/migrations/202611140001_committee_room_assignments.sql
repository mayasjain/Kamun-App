begin;
create temporary table kamun_room_updates(abbreviation text primary key,room_name text) on commit drop;
insert into kamun_room_updates values
 ('ILO','Room 1.067'),('PIF','Room 0.014'),('COPUOS','Room 2.067'),
 ('WHO','Room 3.061'),('EP','Room 2.058'),('USCC','Room 4.048'),
 ('DISEC','Room 4.045'),('UNSC','Room 0.016'),('IAEA','Room 3.068'),('IPC','Room -1.009');
update public.committees c set room_name=r.room_name from kamun_room_updates r
where c.conference_id='10000000-0000-4000-8000-000000000001' and c.abbreviation=r.abbreviation;
do $$ begin
 if (select count(*) from public.committees c join kamun_room_updates r on r.abbreviation=c.abbreviation and r.room_name=c.room_name where c.conference_id='10000000-0000-4000-8000-000000000001')<>10 then
  raise exception 'Expected all ten committee room assignments';
 end if;
end $$;
-- Only replace generic rooms on committee-specific events, preserving special venues.
update public.schedule_events e set room_name=c.room_name from public.committees c
where e.conference_id='10000000-0000-4000-8000-000000000001' and e.committee_id=c.id
 and c.conference_id=e.conference_id and (e.room_name is null or e.room_name='Committee rooms');
insert into public.locations(id,conference_id,name,category,address,description,sort_order,published)
values('14000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Faculty adviser room','conference','Room 2.067','Room for faculty advisers.',0,true)
on conflict(id) do update set address=excluded.address,description=excluded.description,published=true
where locations.conference_id=excluded.conference_id;
commit;
