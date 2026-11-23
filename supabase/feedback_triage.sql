-- Private admin assignment and priority controls for the feedback inbox.
-- Run after feedback_setup.sql, feedback_responses.sql, and feedback_conversations.sql.

begin;

do $migration$
begin
  if to_regclass('public.admin_users') is null then
    raise exception 'Create admin_users before applying feedback_triage.sql.';
  end if;
  if to_regclass('public.feedback_messages') is null then
    raise exception 'Run feedback_setup.sql before applying feedback_triage.sql.';
  end if;

  if to_regclass('public.admin_activity_logs') is not null then
    alter table public.admin_activity_logs
      drop constraint if exists admin_activity_logs_action_check;
    alter table public.admin_activity_logs
      drop constraint if exists admin_activity_logs_action_allowed_check;
    alter table public.admin_activity_logs
      add constraint admin_activity_logs_action_allowed_check
      check (action in (
        'feedback_status_changed', 'feedback_response_sent', 'feedback_response_updated',
        'feedback_triage_updated', 'user_account_action', 'admin_signed_in', 'admin_signed_out',
        'admin_setting_changed'
      ));
  end if;
end;
$migration$;

create table if not exists public.feedback_triage (
  feedback_id uuid primary key references public.feedback_messages (id) on delete cascade,
  assigned_to uuid references auth.users (id) on delete set null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  updated_at timestamptz not null default pg_catalog.now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists feedback_triage_assignee_priority_idx
  on public.feedback_triage (assigned_to, priority, updated_at desc);

alter table public.feedback_triage enable row level security;
revoke all on table public.feedback_triage from public, anon, authenticated;
grant select on table public.feedback_triage to authenticated;

drop policy if exists feedback_triage_select_admin on public.feedback_triage;
create policy feedback_triage_select_admin
  on public.feedback_triage
  for select to authenticated
  using (
    exists (
      select 1 from public.admin_users as admin
      where admin.user_id = (select auth.uid())
    )
  );

create or replace function public.get_feedback_assignees()
returns table (user_id uuid, email text, display_name text)
language plpgsql
stable
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
  select admin.user_id,
         account.email::text,
         coalesce(
           nullif(pg_catalog.btrim(account.raw_user_meta_data ->> 'full_name'), ''),
           nullif(pg_catalog.btrim(account.raw_user_meta_data ->> 'name'), ''),
           nullif(pg_catalog.split_part(account.email, '@', 1), ''),
           'Administrator'
         )::text as display_name
  from public.admin_users as admin
  join auth.users as account on account.id = admin.user_id
  order by 3, 2;
end;
$function$;

create or replace function public.admin_update_feedback_triage(
  _feedback_id uuid,
  _assigned_to uuid,
  _priority text
)
returns table (feedback_id uuid, assigned_to uuid, priority text, updated_at timestamptz, updated_by uuid)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_admin_id uuid := auth.uid();
  previous_assignee uuid;
  previous_priority text := 'normal';
  updated_row public.feedback_triage%rowtype;
  feedback_email text;
  feedback_category text;
begin
  if current_admin_id is null or not exists (
    select 1 from public.admin_users as admin where admin.user_id = current_admin_id
  ) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
  if _priority is null or _priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'Unsupported feedback priority.' using errcode = '22023';
  end if;
  if _assigned_to is not null and not exists (
    select 1 from public.admin_users as admin where admin.user_id = _assigned_to
  ) then
    raise exception 'Feedback can only be assigned to an administrator.' using errcode = '22023';
  end if;

  select feedback.user_email, feedback.category
  into feedback_email, feedback_category
  from public.feedback_messages as feedback
  where feedback.id = _feedback_id;
  if not found then
    raise exception 'Feedback message not found.' using errcode = 'P0002';
  end if;

  select triage.assigned_to, triage.priority
  into previous_assignee, previous_priority
  from public.feedback_triage as triage
  where triage.feedback_id = _feedback_id
  for update;
  previous_priority := coalesce(previous_priority, 'normal');

  insert into public.feedback_triage (feedback_id, assigned_to, priority, updated_at, updated_by)
  values (_feedback_id, _assigned_to, _priority, pg_catalog.now(), current_admin_id)
  on conflict (feedback_id) do update
  set assigned_to = excluded.assigned_to,
      priority = excluded.priority,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
  returning * into updated_row;

  if (previous_assignee is distinct from _assigned_to or previous_priority is distinct from _priority)
     and to_regclass('public.admin_activity_logs') is not null then
    insert into public.admin_activity_logs (
      actor_id, actor_email, action, target_type, target_id, details
    ) values (
      current_admin_id,
      auth.jwt() ->> 'email',
      'feedback_triage_updated',
      'feedback',
      _feedback_id,
      pg_catalog.jsonb_build_object(
        'category', feedback_category,
        'user_email', feedback_email,
        'from_assignee', previous_assignee,
        'to_assignee', _assigned_to,
        'from_priority', previous_priority,
        'to_priority', _priority
      )
    );
  end if;

  return query select updated_row.feedback_id, updated_row.assigned_to, updated_row.priority,
                      updated_row.updated_at, updated_row.updated_by;
end;
$function$;

revoke all on function public.get_feedback_assignees() from public, anon;
revoke all on function public.admin_update_feedback_triage(uuid, uuid, text) from public, anon;
grant execute on function public.get_feedback_assignees() to authenticated;
grant execute on function public.admin_update_feedback_triage(uuid, uuid, text) to authenticated;

comment on table public.feedback_triage is
  'Admin-only feedback assignment and priority metadata. End users cannot read or update it.';

commit;

notify pgrst, 'reload schema';
