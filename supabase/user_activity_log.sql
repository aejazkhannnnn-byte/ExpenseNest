begin;

create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (event_type in (
    'transaction_added', 'transaction_updated', 'transaction_deleted', 'csv_imported', 'csv_exported', 'backup_restored', 'backup_exported',
    'account_added', 'account_updated', 'account_deleted', 'legacy_entries_assigned',
    'monthly_budget_updated', 'category_limit_updated',
    'recurring_schedule_created', 'recurring_schedule_updated', 'recurring_schedule_deleted', 'recurring_payment_recorded',
    'savings_goal_created', 'savings_goal_contribution', 'savings_goal_deleted',
    'category_created', 'category_deleted', 'settings_updated', 'user_signed_in', 'user_signed_out', 'feedback_submitted',
    'family_created', 'family_invitation_sent', 'family_invitation_accepted', 'family_member_removed',
    'family_transaction_added', 'family_transaction_updated', 'family_transaction_deleted'
  )),
  created_at timestamptz not null default pg_catalog.now()
);

alter table public.user_activity_logs
  drop constraint if exists user_activity_logs_event_type_check;
alter table public.user_activity_logs
  add constraint user_activity_logs_event_type_check
  check (event_type in (
    'transaction_added', 'transaction_updated', 'transaction_deleted', 'csv_imported', 'csv_exported', 'backup_restored', 'backup_exported',
    'account_added', 'account_updated', 'account_deleted', 'legacy_entries_assigned',
    'monthly_budget_updated', 'category_limit_updated',
    'recurring_schedule_created', 'recurring_schedule_updated', 'recurring_schedule_deleted', 'recurring_payment_recorded',
    'savings_goal_created', 'savings_goal_contribution', 'savings_goal_deleted',
    'category_created', 'category_deleted', 'settings_updated', 'user_signed_in', 'user_signed_out', 'feedback_submitted',
    'family_created', 'family_invitation_sent', 'family_invitation_accepted', 'family_member_removed',
    'family_transaction_added', 'family_transaction_updated', 'family_transaction_deleted'
  ));

create index if not exists user_activity_logs_user_created_idx
  on public.user_activity_logs (user_id, created_at desc, id desc);

alter table public.user_activity_logs enable row level security;
revoke all on table public.user_activity_logs from public, anon, authenticated;
grant select, delete on table public.user_activity_logs to authenticated;

drop policy if exists user_activity_logs_select_own on public.user_activity_logs;
create policy user_activity_logs_select_own
  on public.user_activity_logs
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists user_activity_logs_delete_own on public.user_activity_logs;
create policy user_activity_logs_delete_own
  on public.user_activity_logs
  for delete to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.record_user_activity(_event_type text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  new_activity_id uuid;
begin
  if current_user_id is null then
    raise exception 'Please sign in to record account activity.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from auth.users as account
    where account.id = current_user_id
      and (account.banned_until is null or account.banned_until <= pg_catalog.now())
  ) then
    raise exception 'This account cannot record activity.' using errcode = '42501';
  end if;

  if _event_type is null or not (_event_type = any (array[
    'transaction_added', 'transaction_updated', 'transaction_deleted', 'csv_imported', 'csv_exported', 'backup_restored', 'backup_exported',
    'account_added', 'account_updated', 'account_deleted', 'legacy_entries_assigned',
    'monthly_budget_updated', 'category_limit_updated',
    'recurring_schedule_created', 'recurring_schedule_updated', 'recurring_schedule_deleted', 'recurring_payment_recorded',
    'savings_goal_created', 'savings_goal_contribution', 'savings_goal_deleted',
    'category_created', 'category_deleted', 'settings_updated', 'user_signed_in', 'user_signed_out', 'feedback_submitted',
    'family_created', 'family_invitation_sent', 'family_invitation_accepted', 'family_member_removed',
    'family_transaction_added', 'family_transaction_updated', 'family_transaction_deleted'
  ]::text[])) then
    raise exception 'Unsupported activity event.' using errcode = '22023';
  end if;

  if (
    select pg_catalog.count(*)
    from public.user_activity_logs as activity
    where activity.user_id = current_user_id
      and activity.created_at > pg_catalog.now() - interval '1 hour'
  ) >= 300 then
    raise exception 'Activity history is temporarily rate limited.' using errcode = '54000';
  end if;

  delete from public.user_activity_logs as activity
  where activity.user_id = current_user_id
    and activity.created_at < pg_catalog.now() - interval '365 days';

  insert into public.user_activity_logs (user_id, event_type)
  values (current_user_id, _event_type)
  returning id into new_activity_id;

  return new_activity_id;
end;
$function$;

revoke all on function public.record_user_activity(text) from public, anon;
grant execute on function public.record_user_activity(text) to authenticated;

comment on table public.user_activity_logs is
  'Private high-level activity history. It intentionally stores no transaction descriptions, amounts, or account balances.';
comment on function public.record_user_activity(text) is
  'Records a fixed, allowlisted event for the signed-in account; only that account can read or delete the resulting history.';

commit;

notify pgrst, 'reload schema';
