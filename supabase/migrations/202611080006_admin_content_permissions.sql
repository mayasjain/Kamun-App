begin;
-- Retain update removal, but reject old clients' event/resource removal requests.
create or replace function public.remove_conference_content(p_conference_id uuid,p_table text,p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not public.is_conference_admin(p_conference_id) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_table is distinct from 'announcements' then raise exception 'Only updates can be removed' using errcode='42501'; end if;
 update public.announcements set published=false where id=p_id and conference_id=p_conference_id and published;
 return found;
end;
$$;
-- Protect against direct writes as well as the removal RPC. Resource protection
-- applies to both conference essentials and study guides, regardless of role.
create function public.protect_conference_content() returns trigger
language plpgsql set search_path=public as $$
begin
 if tg_table_name='resources' or auth.role()='authenticated' then
  if tg_op='DELETE' then raise exception 'This content cannot be removed' using errcode='42501'; end if;
  if old.published and not new.published then raise exception 'This content cannot be unpublished' using errcode='42501'; end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end;
$$;
revoke all on function public.protect_conference_content() from public,anon,authenticated;
create trigger protect_resources before delete or update on public.resources for each row execute function public.protect_conference_content();
create trigger protect_schedule before delete or update on public.schedule_events for each row execute function public.protect_conference_content();
-- A scoped policy supports the same insert used by the existing organiser form.
drop policy "admins manage announcements" on public.announcements;
create policy "admins read announcements" on public.announcements for select to authenticated using(public.is_conference_admin(conference_id));
create policy "admins update announcements" on public.announcements for update to authenticated using(public.is_conference_admin(conference_id)) with check(public.is_conference_admin(conference_id));
create policy "admins publish announcements" on public.announcements for insert to authenticated with check(
 public.is_conference_admin(conference_id) and committee_id is null and published
 and published_at is not null and published_at<=now()+interval '5 minutes'
 and char_length(btrim(title)) between 1 and 160 and char_length(btrim(body)) between 1 and 10000
);
commit;
