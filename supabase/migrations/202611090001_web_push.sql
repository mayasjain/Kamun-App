begin;
-- Push subscriptions are device credentials. No client can enumerate their endpoints/keys.
create table public.web_push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 conference_id uuid not null references public.conferences(id) on delete cascade,
 endpoint text not null unique check(length(endpoint) between 20 and 2048),
 p256dh text not null, auth text not null,
 person_id bigint not null, revision text not null,
 kind text not null check(kind in ('delegate','chair','kamun_admin')),
 committee text, seat text,
 enabled boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.web_push_subscriptions enable row level security;
revoke all on public.web_push_subscriptions from public,anon,authenticated;
grant all on public.web_push_subscriptions to service_role;

create table public.web_push_deliveries (
 id uuid primary key default gen_random_uuid(),
 subscription_id uuid not null references public.web_push_subscriptions(id) on delete cascade,
 announcement_id uuid not null references public.announcements(id) on delete cascade,
 state text not null default 'pending' check(state in ('pending','sending','sent','skipped','failed')),
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 lease_id uuid, last_http_status integer,
 created_at timestamptz not null default now(),
 unique(subscription_id,announcement_id)
);
create index web_push_ready on public.web_push_deliveries(available_at) where state in ('pending','sending');
alter table public.web_push_deliveries enable row level security;
revoke all on public.web_push_deliveries from public,anon,authenticated;
grant all on public.web_push_deliveries to service_role;

-- Deliberately independent of short foreground leases: delivery re-verifies ECE
-- status server-side so a closed app can receive alerts without renewing its grant.
create function public.web_push_identity(p_user uuid,p_conference uuid)
returns table(person_id bigint,revision text,kind text,committee text,seat text,valid_until timestamptz)
language sql stable security definer set search_path=public as $$
 select b.ecg_person_id,b.credential_revision,'kamun_admin'::text,null::text,null::text,b.valid_until
 from public.ecg_admin_bindings b where b.user_id=p_user and b.conference_id=p_conference and b.revoked_at is null
 union all
 select b.ecg_person_id,b.credential_revision,case b.access_type when 'member' then 'delegate' else 'chair' end,c.abbreviation,b.seat_label,b.valid_until
 from public.ecg_participant_bindings b join public.committees c on c.id=b.committee_id
 join public.attendee_memberships m on m.user_id=b.user_id and m.conference_id=b.conference_id and m.identity_source='ecg'
 where b.user_id=p_user and b.conference_id=p_conference and b.revoked_at is null;
$$;

create function public.web_push_register(p_user uuid,p_conference uuid,p_endpoint text,p_p256dh text,p_auth text)
returns void language plpgsql security definer set search_path=public as $$
declare i record;
begin
 if auth.role()<>'service_role' then raise exception 'Forbidden' using errcode='42501'; end if;
 select * into i from public.web_push_identity(p_user,p_conference) where valid_until>now() limit 1;
 if not found then raise exception 'Current identity required' using errcode='42501'; end if;
 if (select count(*) from public.web_push_subscriptions where user_id=p_user and enabled and endpoint<>p_endpoint)>=10 then
  raise exception 'Device limit reached' using errcode='22023';
 end if;
 -- Rotate the row ID on transfer so queued alerts cannot cross account boundaries.
 delete from public.web_push_subscriptions where endpoint=p_endpoint;
 insert into public.web_push_subscriptions(user_id,conference_id,endpoint,p256dh,auth,person_id,revision,kind,committee,seat)
 values(p_user,p_conference,p_endpoint,p_p256dh,p_auth,i.person_id,i.revision,i.kind,i.committee,i.seat);
end $$;

create function public.web_push_invalidate_binding() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if new.revoked_at is not null or old.ecg_person_id is distinct from new.ecg_person_id
 or old.credential_revision is distinct from new.credential_revision then
  update public.web_push_subscriptions set enabled=false,updated_at=now()
  where user_id=old.user_id and conference_id=old.conference_id;
 end if;
 return new;
end $$;
create trigger push_participant_revoked after update on public.ecg_participant_bindings for each row execute function public.web_push_invalidate_binding();
create trigger push_admin_revoked after update on public.ecg_admin_bindings for each row execute function public.web_push_invalidate_binding();

create function public.web_push_eligible(p_subscription uuid,p_announcement uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.web_push_subscriptions s
 join public.announcements a on a.id=p_announcement and a.conference_id=s.conference_id
 join public.web_push_identity(s.user_id,s.conference_id) i on i.person_id=s.person_id
 and i.revision=s.revision and i.kind=s.kind and i.committee is not distinct from s.committee and i.seat is not distinct from s.seat
 where s.id=p_subscription and s.enabled and a.published and a.published_at<=now()
 and (a.expires_at is null or a.expires_at>now())
 and (a.audience='all' or (a.audience='member' and i.kind='delegate') or (a.audience='chair' and i.kind='chair') or i.kind='kamun_admin')
 and (a.committee_id is null or i.kind='kamun_admin' or exists(select 1 from public.committees c where c.id=a.committee_id and c.abbreviation=i.committee)));
$$;

-- All publishing paths (mobile, organiser, dashboard, SQL) use this durable queue.
create function public.web_push_queue_announcement() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if not new.published or new.published_at is null then return new; end if;
 if tg_op='UPDATE' then
  if old.published and old.published_at is not distinct from new.published_at then return new; end if;
 end if;
 insert into public.web_push_deliveries(subscription_id,announcement_id,available_at)
 select s.id,new.id,greatest(now(),new.published_at) from public.web_push_subscriptions s
 where s.enabled and s.conference_id=new.conference_id
 and (new.audience='all' or s.kind='kamun_admin' or (new.audience='chair' and s.kind='chair') or (new.audience='member' and s.kind='delegate'))
 on conflict do nothing;
 return new;
end $$;
create trigger queue_announcement_push after insert or update on public.announcements for each row execute function public.web_push_queue_announcement();

create function public.web_push_claim(p_limit integer default 50)
returns table(delivery_id uuid,lease_id uuid,subscription_id uuid,announcement_id uuid,endpoint text,p256dh text,auth text,person_id bigint,revision text,kind text,committee text,seat text)
language plpgsql security definer set search_path=public as $$
begin
 if auth.role()<>'service_role' then raise exception 'Forbidden' using errcode='42501'; end if;
 return query
 with ready as (select d.id from public.web_push_deliveries d
 where d.state in ('pending','sending') and d.available_at<=now() and d.attempts<6
 order by d.available_at for update skip locked limit least(greatest(p_limit,1),100)),
 claimed as (update public.web_push_deliveries d set state='sending',attempts=d.attempts+1,
 available_at=now()+interval '3 minutes',lease_id=gen_random_uuid() from ready r where d.id=r.id returning d.*)
 select d.id,d.lease_id,s.id,d.announcement_id,s.endpoint,s.p256dh,s.auth,s.person_id,s.revision,s.kind,s.committee,s.seat
 from claimed d join public.web_push_subscriptions s on s.id=d.subscription_id;
end $$;

create function public.web_push_finish(p_delivery uuid,p_lease uuid,p_state text,p_http integer default null)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.role()<>'service_role' then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_state not in ('pending','sent','skipped','failed') then raise exception 'Invalid state'; end if;
 update public.web_push_deliveries set state=case when attempts>=6 and p_state='pending' then 'failed' else p_state end,
 last_http_status=p_http,available_at=now()+least(interval '15 minutes',interval '30 seconds'*power(2,attempts)),lease_id=null
 where id=p_delivery and lease_id=p_lease and state='sending';
end $$;

revoke all on function public.web_push_identity(uuid,uuid),public.web_push_register(uuid,uuid,text,text,text),public.web_push_invalidate_binding(),public.web_push_eligible(uuid,uuid),public.web_push_queue_announcement(),public.web_push_claim(integer),public.web_push_finish(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.web_push_identity(uuid,uuid),public.web_push_register(uuid,uuid,text,text,text),public.web_push_eligible(uuid,uuid),public.web_push_claim(integer),public.web_push_finish(uuid,uuid,text,integer) to service_role;
commit;
