-- Return privacy-safe usage counts for one account to verified administrators.
-- No transaction amounts, descriptions, categories, family names, or emails are returned.

begin;

do $migration$
begin
  if to_regclass('public.admin_users') is null then
    raise exception 'Create admin_users before applying admin_user_health.sql.';
  end if;
  if to_regclass('public.family_groups') is null
     or to_regclass('public.family_members') is null
     or to_regclass('public.family_transactions') is null then
    raise exception 'Set up family sharing before applying admin_user_health.sql.';
  end if;
  if to_regclass('public.feedback_messages') is null then
    raise exception 'Run feedback_setup.sql before applying admin_user_health.sql.';
  end if;
end;
$migration$;

create or replace function public.get_admin_user_health(_user_id uuid)
returns table (
  family_group_count bigint,
  transaction_count bigint,
  feedback_count bigint,
  last_sign_in_at timestamptz,
  last_transaction_at timestamptz,
  last_feedback_at timestamptz
)
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

  if _user_id is null then
    raise exception 'A user account is required.' using errcode = '22023';
  end if;

  return query
  select
    (
      select count(*)::bigint
      from (
        select member.family_id
        from public.family_members as member
        where member.user_id = _user_id
        union
        select family.id
        from public.family_groups as family
        where family.owner_id = _user_id
      ) as memberships
    ),
    (
      select count(*)::bigint
      from public.family_transactions as transaction_row
      where transaction_row.created_by = _user_id
    ),
    (
      select count(*)::bigint
      from public.feedback_messages as feedback
      where feedback.user_id = _user_id
    ),
    account.last_sign_in_at,
    (
      select max(transaction_row.created_at)
      from public.family_transactions as transaction_row
      where transaction_row.created_by = _user_id
    ),
    (
      select max(feedback.created_at)
      from public.feedback_messages as feedback
      where feedback.user_id = _user_id
    )
  from auth.users as account
  where account.id = _user_id;

  if not found then
    raise exception 'The requested user account was not found.' using errcode = 'P0002';
  end if;
end;
$function$;

revoke all on function public.get_admin_user_health(uuid) from public, anon, authenticated;
grant execute on function public.get_admin_user_health(uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
