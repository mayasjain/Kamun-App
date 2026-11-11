begin;
insert into auth.users(id) values('30000000-0000-4000-8000-000000000011'),('30000000-0000-4000-8000-000000000012');
select set_config('request.jwt.claim.role','service_role',true);
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000011',911,'faculty_adviser',null,null,repeat('a',64));
select * from public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000012',912,'observer',null,null,repeat('b',64));
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000011',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$ begin
 if not public.has_current_attendee_access('10000000-0000-4000-8000-000000000001') then raise exception 'Guest app access absent'; end if;
 if public.has_current_attendee_access('10000000-0000-4000-8000-000000000001','chair') then raise exception 'Guest received chair privileges'; end if;
 if public.has_current_attendee_access('10000000-0000-4000-8000-000000000001','member') then raise exception 'Guest received delegate privileges'; end if;
 if public.is_kamun_admin() then raise exception 'Guest became admin'; end if;
 if not exists(select 1 from public.my_current_attendee_profile('10000000-0000-4000-8000-000000000001') where access_type='faculty_adviser' and access_label='Faculty adviser' and committee_id is null and seat_label is null) then raise exception 'Guest profile incorrect'; end if;
 begin
  perform public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000011',911,'chair','ILO',null,repeat('a',64));
  raise exception 'Guest directly escalated';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.role','service_role',true);
do $$ begin
 begin
  perform public.ecg_bind_verified_identity('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000011',911,'faculty_adviser','ILO',null,repeat('a',64));
  raise exception 'Guest accepted committee';
 exception when invalid_parameter_value then null; end;
 if not public.ecg_refresh_verified_identity('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000011',911,repeat('a',64)) then raise exception 'Guest refresh failed'; end if;
 perform public.ecg_revoke_verified_identity_all(911,repeat('a',64));
end $$;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000011',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$ begin
 if public.has_current_attendee_access('10000000-0000-4000-8000-000000000001') then raise exception 'Guest revocation failed'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000012',true);
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.my_current_attendee_profile('10000000-0000-4000-8000-000000000001') where access_type='observer' and access_label='Observer') then raise exception 'Observer profile absent'; end if;
end $$;
rollback;
