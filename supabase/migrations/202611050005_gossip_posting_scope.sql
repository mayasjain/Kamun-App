-- Delegate messages are private to their own committee chairs.
begin;
create or replace function public.submit_committee_gossip(
  p_conference_id uuid, p_committee_id uuid, p_message text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_message text := trim(p_message);
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in with a delegate code first' using errcode = '28000';
  end if;
  if v_message is null or char_length(v_message) not between 3 and 500 then
    raise exception 'Message must be between 3 and 500 characters' using errcode = '22023';
  end if;
  if not public.has_current_attendee_access(p_conference_id,'member',null) then
    raise exception 'Delegate access is required' using errcode = '42501';
  end if;
  if p_committee_id is null or not public.has_current_attendee_access(p_conference_id,'member',p_committee_id) then
    raise exception 'You can send gossip only to your own committee chairs' using errcode='42501';
  end if;
  if not exists (
    select 1 from public.committees c join public.conferences conf on conf.id=c.conference_id
    where c.id=p_committee_id and c.conference_id=p_conference_id
      and c.published and conf.published
  ) then raise exception 'This committee is unavailable' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  if (select count(*) from public.committee_gossip
      where sender_user_id=v_user_id and created_at>now()-interval '10 minutes') >= 3
    or (select count(*) from public.committee_gossip
      where sender_user_id=v_user_id and created_at>now()-interval '1 day') >= 30 then
    raise exception 'Submission limit reached. Please try again later' using errcode='22023';
  end if;
  insert into public.committee_gossip (conference_id,committee_id,sender_user_id,message)
    values (p_conference_id,p_committee_id,v_user_id,v_message) returning id into v_id;
  return v_id;
end;
$$;

commit;
