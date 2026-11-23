begin;

do $migration$
begin
  if to_regclass('public.admin_users') is null then
    raise exception 'Create admin_users before applying admin_activity_tracking.sql.';
  end if;
  if to_regclass('public.admin_activity_logs') is null then
    raise exception 'Run admin_activity_log.sql and admin_user_actions.sql before applying admin_activity_tracking.sql.';
  end if;
end;
$migration$;

alter table public.admin_activity_logs
  drop constraint if exists admin_activity_logs_action_check;
alter table public.admin_activity_logs
  drop constraint if exists admin_activity_logs_action_allowed_check;
alter table public.admin_activity_logs
  add constraint admin_activity_logs_action_allowed_check
  check (action in ('feedback_status_changed', 'feedback_response_sent', 'feedback_response_updated', 'user_account_action', 'admin_signed_in', 'admin_signed_out', 'admin_setting_changed'));

alter table public.admin_activity_logs
  drop constraint if exists admin_activity_logs_target_type_check;
alter table public.admin_activity_logs
  drop constraint if exists admin_activity_logs_target_type_allowed_check;
alter table public.admin_activity_logs
  add constraint admin_activity_logs_target_type_allowed_check
  check (target_type in ('feedback', 'user', 'admin'));

create or replace function public.record_admin_activity(_action text, _setting_key text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_admin_id uuid := auth.uid();
  new_activity_id uuid;
begin
  if current_admin_id is null or not exists (
    select 1 from public.admin_users as admin where admin.user_id = current_admin_id
  ) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  if _action not in ('admin_signed_in', 'admin_signed_out', 'admin_setting_changed') then
    raise exception 'Unsupported administrator activity.' using errcode = '22023';
  end if;

  if _action = 'admin_setting_changed' then
    if _setting_key is null or _setting_key not in ('theme', 'currency', 'dateFormat', 'density', 'privacyMode', 'weekStart', 'motionPreference', 'all_preferences') then
      raise exception 'Unsupported application setting.' using errcode = '22023';
    end if;
  elsif _setting_key is not null then
    raise exception 'A setting key is only accepted for setting changes.' using errcode = '22023';
  end if;

  insert into public.admin_activity_logs (
    actor_id, actor_email, action, target_type, target_id, details
  ) values (
    current_admin_id,
    auth.jwt() ->> 'email',
    _action,
    'admin',
    current_admin_id,
    case when _action = 'admin_setting_changed'
      then pg_catalog.jsonb_build_object('setting', _setting_key)
      else '{}'::jsonb
    end
  ) returning id into new_activity_id;

  return new_activity_id;
end;
$function$;

revoke all on function public.record_admin_activity(text, text) from public, anon;
grant execute on function public.record_admin_activity(text, text) to authenticated;

comment on function public.record_admin_activity(text, text) is
  'Adds an allowlisted admin session or setting event to the admin-only audit log without recording preference values.';

commit;

notify pgrst, 'reload schema';
