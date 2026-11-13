begin;

-- Conference admins can review all committee boxes without receiving sender IDs.
create function public.my_admin_gossip(p_conference_id uuid,p_committee_id uuid default null,p_before timestamptz default null,p_before_id uuid default null)
returns table(id uuid,committee_id uuid,message text,status text,created_at timestamptz)
language plpgsql stable security definer set search_path=public as $$
begin
 if not public.is_conference_admin(p_conference_id) then
  raise exception 'Conference administrator access required' using errcode='42501';
 end if;
 if p_committee_id is not null and not exists(
  select 1 from public.committees c where c.id=p_committee_id and c.conference_id=p_conference_id
 ) then
  raise exception 'Committee unavailable' using errcode='22023';
 end if;
 if (p_before is null)<>(p_before_id is null) then
  raise exception 'Invalid gossip cursor' using errcode='22023';
 end if;
 return query select g.id,g.committee_id,g.message,g.status,g.created_at
 from public.committee_gossip g
 where g.conference_id=p_conference_id and (p_committee_id is null or g.committee_id=p_committee_id)
 and (p_before is null or (g.created_at,g.id)<(p_before,p_before_id))
 order by g.created_at desc,g.id desc limit 100;
end;
$$;
revoke all on function public.my_admin_gossip(uuid,uuid,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.my_admin_gossip(uuid,uuid,timestamptz,uuid) to authenticated;

commit;
