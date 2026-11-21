-- Enforce suspended-account status for cloud finance, family, and feedback data.
-- Run after family-sharing, feedback, and admin-user-actions setup; public.user_data must exist.

begin;

do $migration$
declare
  required_table record;
  row_security_enabled boolean;
begin
  for required_table in
    select table_name
    from unnest(array[
      'family_groups',
      'family_members',
      'family_invitations',
      'family_transactions',
      'feedback_messages',
      'user_data'
    ]) as required(table_name)
  loop
    select relation.relrowsecurity
      into row_security_enabled
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as schema_name
      on schema_name.oid = relation.relnamespace
    where schema_name.nspname = 'public'
      and relation.relname = required_table.table_name
      and relation.relkind in ('r', 'p');

    if not found then
      raise exception 'Required table public.% was not found.', required_table.table_name;
    end if;

    if required_table.table_name <> 'user_data' and not row_security_enabled then
      raise exception 'Enable row level security on public.% before applying this migration.', required_table.table_name;
    end if;
  end loop;
end;
$migration$;

-- user_data is the app's private cloud backup; keep every row owner-only.
alter table public.user_data enable row level security;
revoke all on table public.user_data from anon, authenticated;
grant select, insert, update on table public.user_data to authenticated;

drop policy if exists user_data_manage_own on public.user_data;
create policy user_data_manage_own
  on public.user_data as permissive for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists user_data_owner_only on public.user_data;
create policy user_data_owner_only
  on public.user_data as restrictive for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function public.is_account_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from auth.users as account
    where account.id = auth.uid()
      and (account.banned_until is null or account.banned_until <= pg_catalog.now())
  );
$function$;

revoke all on function public.is_account_allowed() from public, anon;
grant execute on function public.is_account_allowed() to authenticated;

create or replace function public.reject_suspended_account_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is not null and not public.is_account_allowed() then
    raise exception 'This account is suspended. Contact an administrator.'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$function$;

revoke all on function public.reject_suspended_account_write() from public, anon, authenticated;

do $migration$
declare
  protected_table text;
begin
  foreach protected_table in array array[
    'family_groups',
    'family_members',
    'family_invitations',
    'family_transactions',
    'feedback_messages',
    'user_data'
  ]
  loop
    execute format('revoke all on table public.%I from anon', protected_table);
    execute format(
      'revoke truncate, references, trigger on table public.%I from authenticated',
      protected_table
    );

    execute format(
      'drop policy if exists suspended_accounts_have_no_data_access on public.%I',
      protected_table
    );
    execute format(
      'create policy suspended_accounts_have_no_data_access on public.%I as restrictive for all to authenticated using ((select public.is_account_allowed())) with check ((select public.is_account_allowed()))',
      protected_table
    );

    execute format(
      'drop trigger if exists suspended_account_write_guard on public.%I',
      protected_table
    );
    execute format(
      'create trigger suspended_account_write_guard before insert or update or delete on public.%I for each row execute function public.reject_suspended_account_write()',
      protected_table
    );
  end loop;
end;
$migration$;

comment on function public.is_account_allowed() is
  'Returns whether the current authenticated account is not suspended.';
comment on function public.reject_suspended_account_write() is
  'Stops suspended users from changing protected rows, including through SECURITY DEFINER RPCs.';

commit;

notify pgrst, 'reload schema';
