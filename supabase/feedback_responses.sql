-- Allow users to view their own submissions and let administrators save replies.
-- Run after feedback_setup.sql. For Admin Activity audit entries, also run after
-- admin_activity_log.sql and admin_user_actions.sql.

begin;

alter table public.feedback_messages
  add column if not exists admin_response text,
  add column if not exists responded_at timestamptz,
  add column if not exists responded_by uuid references auth.users (id) on delete set null;

alter table public.feedback_messages
  drop constraint if exists feedback_messages_admin_response_check;
alter table public.feedback_messages
  add constraint feedback_messages_admin_response_check
  check (admin_response is null or char_length(btrim(admin_response)) between 1 and 2000);

create index if not exists feedback_messages_user_history_idx
  on public.feedback_messages (user_id, created_at desc, id desc);
create index if not exists feedback_messages_admin_history_idx
  on public.feedback_messages (created_at desc, id desc);

drop policy if exists feedback_messages_select_own on public.feedback_messages;
create policy feedback_messages_select_own
  on public.feedback_messages
  for select to authenticated
  using (user_id = (select auth.uid()));

grant select on table public.feedback_messages to authenticated;
grant update (status) on table public.feedback_messages to authenticated;

do $migration$
begin
  if to_regclass('public.admin_activity_logs') is not null then
    alter table public.admin_activity_logs
      drop constraint if exists admin_activity_logs_action_check;
    alter table public.admin_activity_logs
      drop constraint if exists admin_activity_logs_action_allowed_check;
    alter table public.admin_activity_logs
      add constraint admin_activity_logs_action_allowed_check
      check (action in (
        'feedback_status_changed', 'feedback_response_sent', 'feedback_response_updated',
        'user_account_action', 'admin_signed_in', 'admin_signed_out', 'admin_setting_changed'
      ));
  end if;
end;
$migration$;

create or replace function public.admin_update_feedback(
  _feedback_id uuid,
  _status text,
  _response text default null,
  _update_response boolean default false
)
returns public.feedback_messages
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_admin_id uuid := auth.uid();
  clean_response text;
  updated_feedback public.feedback_messages%rowtype;
begin
  if current_admin_id is null or not exists (
    select 1 from public.admin_users as admin where admin.user_id = current_admin_id
  ) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  if _status is null or _status not in ('new', 'in_review', 'resolved') then
    raise exception 'Unsupported feedback status.' using errcode = '22023';
  end if;

  if _update_response then
    clean_response := nullif(pg_catalog.btrim(_response), '');
    if clean_response is null or pg_catalog.char_length(clean_response) > 2000 then
      raise exception 'A response must contain between 1 and 2,000 characters.' using errcode = '22023';
    end if;

    update public.feedback_messages as feedback
    set status = _status,
        admin_response = clean_response,
        responded_at = pg_catalog.now(),
        responded_by = current_admin_id
    where feedback.id = _feedback_id
    returning feedback.* into updated_feedback;
  else
    update public.feedback_messages as feedback
    set status = _status
    where feedback.id = _feedback_id
    returning feedback.* into updated_feedback;
  end if;

  if not found then
    raise exception 'Feedback message not found.' using errcode = 'P0002';
  end if;

  return updated_feedback;
end;
$function$;

revoke all on function public.admin_update_feedback(uuid, text, text, boolean) from public, anon;
grant execute on function public.admin_update_feedback(uuid, text, text, boolean) to authenticated;

create or replace function public.log_admin_feedback_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller_id uuid := auth.uid();
  audit_action text;
begin
  if old.status is distinct from new.status or old.admin_response is distinct from new.admin_response then
    if to_regclass('public.admin_activity_logs') is not null and caller_id is not null then
      audit_action := case
        when old.admin_response is distinct from new.admin_response and old.admin_response is null then 'feedback_response_sent'
        when old.admin_response is distinct from new.admin_response then 'feedback_response_updated'
        else 'feedback_status_changed'
      end;

      insert into public.admin_activity_logs (
        actor_id, actor_email, action, target_type, target_id, details
      ) values (
        caller_id,
        auth.jwt() ->> 'email',
        audit_action,
        'feedback',
        new.id,
        pg_catalog.jsonb_build_object(
          'from', old.status,
          'to', new.status,
          'category', new.category,
          'user_email', new.user_email,
          'response_length', case when new.admin_response is null then 0 else pg_catalog.char_length(new.admin_response) end
        )
      );
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.log_admin_feedback_status_change() from public, anon, authenticated;

drop trigger if exists admin_activity_feedback_status_changed on public.feedback_messages;
drop trigger if exists admin_activity_feedback_changes on public.feedback_messages;
create trigger admin_activity_feedback_changes
  after update of status, admin_response on public.feedback_messages
  for each row
  execute function public.log_admin_feedback_status_change();

comment on column public.feedback_messages.admin_response is
  'Administrator response shown to the feedback owner. It is not sent by email automatically.';
comment on function public.admin_update_feedback(uuid, text, text, boolean) is
  'Allows administrators to manage feedback status and save an in-app response.';

commit;

notify pgrst, 'reload schema';
