begin;
-- Personal admin codes remain in ECE; grants are short-lived and session-bound.
create table public.ecg_admin_bindings (
 conference_id uuid not null references public.conferences(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 ecg_person_id bigint not null check(ecg_person_id>0),
 credential_revision text not null check(credential_revision ~ '^[a-f0-9]{64}$'),
 session_scope text not null check(session_scope ~ '^[a-f0-9]{64}$'),
 verified_at timestamptz not null,
 valid_until timestamptz not null,
 revoked_at timestamptz,
 primary key(conference_id,user_id),
 check(valid_until>verified_at and valid_until<=verified_at+interval '5 minutes')
);
create index ecg_admin_person on public.ecg_admin_bindings(ecg_person_id,credential_revision);
alter table public.ecg_admin_bindings enable row level security;
revoke all on public.ecg_admin_bindings from public,anon,authenticated;
grant select on public.ecg_admin_bindings to authenticated;
grant all on public.ecg_admin_bindings to service_role;
create policy admin_binding_own on public.ecg_admin_bindings for select to authenticated using(user_id=auth.uid());

create or replace function public.is_kamun_admin() returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.admin_profiles where user_id=auth.uid())
 or exists(select 1 from public.ecg_admin_bindings where user_id=auth.uid()
  and revoked_at is null and valid_until>now());
$$;

create function public.ecg_clear_linked_admin(p_conference_id uuid,p_user_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
 if auth.role()<>'service_role' then raise exception 'Forbidden' using errcode='42501'; end if;
 update public.ecg_admin_bindings set revoked_at=now() where conference_id=p_conference_id and user_id=p_user_id;
end $$;

create function public.ecg_bind_verified_admin(p_conference_id uuid,p_user_id uuid,p_ecg_person_id bigint,p_credential_revision text,p_session_scope text)
returns table(conference_id uuid,conference_slug text,access_type text,access_label text,committee_id uuid,committee_name text,committee_abbreviation text,seat_label text)
language plpgsql security definer set search_path=public as $$
begin
 if auth.role()<>'service_role' then raise exception 'Forbidden' using errcode='42501'; end if;
 if not exists(select 1 from public.conferences where id=p_conference_id and published) then raise exception 'Conference unavailable'; end if;
 -- A session cannot retain its previous participant or organiser identity.
 delete from public.attendee_memberships where user_id=p_user_id;
 update public.ecg_participant_bindings set revoked_at=now() where user_id=p_user_id;
 delete from public.organizer_message_permissions where user_id=p_user_id;
 update public.ecg_admin_bindings set revoked_at=now() where user_id=p_user_id;
 insert into public.ecg_admin_bindings as b values(p_conference_id,p_user_id,p_ecg_person_id,p_credential_revision,p_session_scope,now(),now()+interval '5 minutes',null)
 on conflict on constraint ecg_admin_bindings_pkey do update set ecg_person_id=excluded.ecg_person_id,
 credential_revision=excluded.credential_revision,session_scope=excluded.session_scope,
 verified_at=excluded.verified_at,valid_until=excluded.valid_until,revoked_at=null;
 return query select c.id,c.slug,'admin'::text,'Administrator'::text,null::uuid,null::text,null::text,null::text from public.conferences c where c.id=p_conference_id;
end $$;

create function public.ecg_refresh_verified_admin(p_conference_id uuid,p_user_id uuid,p_ecg_person_id bigint,p_credential_revision text,p_session_scope text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if auth.role()<>'service_role' then raise exception 'Forbidden' using errcode='42501'; end if;
 update public.ecg_admin_bindings set verified_at=now(),valid_until=now()+interval '5 minutes'
 where conference_id=p_conference_id and user_id=p_user_id and ecg_person_id=p_ecg_person_id
 and credential_revision=p_credential_revision and session_scope=p_session_scope and revoked_at is null;
 return found;
end $$;

create function public.my_current_admin_profile(p_conference_id uuid)
returns table(conference_id uuid,conference_slug text,access_type text,access_label text,committee_id uuid,committee_name text,committee_abbreviation text,seat_label text)
language sql stable security definer set search_path=public as $$
 select c.id,c.slug,'admin'::text,'Administrator'::text,null::uuid,null::text,null::text,null::text
 from public.ecg_admin_bindings b join public.conferences c on c.id=b.conference_id
 where b.conference_id=p_conference_id and b.user_id=auth.uid() and b.revoked_at is null and b.valid_until>now();
$$;

-- Legacy attendee and organiser claims must also clear the temporary admin role.
create function public.clear_admin_on_identity_switch() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 update public.ecg_admin_bindings set revoked_at=now() where user_id=new.user_id;
 return new;
end $$;
revoke all on function public.clear_admin_on_identity_switch() from public,anon,authenticated;
create trigger attendee_clears_admin after insert or update on public.attendee_memberships for each row execute function public.clear_admin_on_identity_switch();
create trigger organizer_clears_admin after insert or update on public.organizer_message_permissions for each row execute function public.clear_admin_on_identity_switch();

create or replace function public.ecg_revoke_verified_identity_all(p_ecg_person_id bigint,p_credential_revision text)
returns integer language plpgsql security definer set search_path=public as $$
declare v_count integer; v_admin_count integer;
begin
 if auth.role()<>'service_role' then raise exception 'Forbidden' using errcode='42501'; end if;
 update public.ecg_participant_bindings set revoked_at=now() where ecg_person_id=p_ecg_person_id and credential_revision=p_credential_revision and revoked_at is null;
 get diagnostics v_count=row_count;
 update public.ecg_admin_bindings set revoked_at=now() where ecg_person_id=p_ecg_person_id and credential_revision=p_credential_revision and revoked_at is null;
 get diagnostics v_admin_count=row_count;
 return v_count+v_admin_count;
end $$;
revoke all on function public.ecg_clear_linked_admin(uuid,uuid),public.ecg_bind_verified_admin(uuid,uuid,bigint,text,text),public.ecg_refresh_verified_admin(uuid,uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function public.ecg_clear_linked_admin(uuid,uuid),public.ecg_bind_verified_admin(uuid,uuid,bigint,text,text),public.ecg_refresh_verified_admin(uuid,uuid,bigint,text,text) to service_role;
revoke all on function public.my_current_admin_profile(uuid) from public,anon;
grant execute on function public.my_current_admin_profile(uuid) to authenticated;
commit;
