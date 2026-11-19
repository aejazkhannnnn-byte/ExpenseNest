-- Record administrator changes to feedback status.
-- Run after feedback_setup.sql and admin_users have been created.

begin;

do $migration$
begin
  if to_regclass('public.admin_users') is null then
    raise exception 'Create admin_users before applying admin_activity_log.sql.';
  end if;

  if to_regclass('public.feedback_messages') is null then
    raise exception 'Run feedback_setup.sql before admin_activity_log.sql.';
  end if;
end;
$migration$;

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null check (action = 'feedback_status_changed'),
  target_type text not null check (target_type = 'feedback'),
  target_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_created_idx
  on public.admin_activity_logs (created_at desc);

alter table public.admin_activity_logs enable row level security;

drop policy if exists admin_activity_logs_select_admin
  on public.admin_activity_logs;
create policy admin_activity_logs_select_admin
  on public.admin_activity_logs
  for select to authenticated
  using (
    exists (
      select 1
      from public.admin_users as admin
      where admin.user_id = auth.uid()
    )
  );

revoke all on table public.admin_activity_logs from anon, authenticated;
grant select on table public.admin_activity_logs to authenticated;

create or replace function public.log_admin_feedback_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller_id uuid := auth.uid();
begin
  if old.status is distinct from new.status and caller_id is not null then
    insert into public.admin_activity_logs (
      actor_id,
      actor_email,
      action,
      target_type,
      target_id,
      details
    ) values (
      caller_id,
      auth.jwt() ->> 'email',
      'feedback_status_changed',
      'feedback',
      new.id,
      pg_catalog.jsonb_build_object(
        'from', old.status,
        'to', new.status,
        'category', new.category,
        'user_email', new.user_email
      )
    );
  end if;

  return new;
end;
$function$;

revoke all on function public.log_admin_feedback_status_change() from public, anon, authenticated;

drop trigger if exists admin_activity_feedback_status_changed
  on public.feedback_messages;
create trigger admin_activity_feedback_status_changed
  after update of status on public.feedback_messages
  for each row
  execute function public.log_admin_feedback_status_change();

commit;

notify pgrst, 'reload schema';
