-- Allow the protected Edge Function to audit sign-in access changes.
-- Run after admin_activity_log.sql.

begin;

do $migration$
begin
  if to_regclass('public.admin_users') is null then
    raise exception 'Create admin_users before applying admin_user_actions.sql.';
  end if;
  if to_regclass('public.admin_activity_logs') is null then
    raise exception 'Run admin_activity_log.sql before applying admin_user_actions.sql.';
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
  check (target_type in ('feedback', 'user'));

create or replace function public.get_admin_user_suspensions()
returns table (user_id uuid, banned_until timestamptz)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not exists (
    select 1 from public.admin_users as admin where admin.user_id = auth.uid()
  ) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  return query
  select account.id, account.banned_until
  from auth.users as account
  where account.banned_until is not null
    and account.banned_until > pg_catalog.now();
end;
$function$;

revoke all on function public.get_admin_user_suspensions() from public, anon, authenticated;
grant execute on function public.get_admin_user_suspensions() to authenticated;

commit;

notify pgrst, 'reload schema';
