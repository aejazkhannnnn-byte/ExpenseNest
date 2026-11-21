-- Admin-only aggregate analytics. No emails or transaction descriptions are returned.
-- Requires admin_users, feedback_messages, family_groups and family_transactions.

begin;

do $migration$
begin
  if to_regclass('public.admin_users') is null then
    raise exception 'Create admin_users before applying admin_analytics.sql.';
  end if;
  if to_regclass('public.feedback_messages') is null then
    raise exception 'Run feedback_setup.sql before applying admin_analytics.sql.';
  end if;
  if to_regclass('public.family_groups') is null or to_regclass('public.family_transactions') is null then
    raise exception 'Set up family_groups and family_transactions before applying admin_analytics.sql.';
  end if;
end;
$migration$;

create or replace function public.get_admin_analytics(_from_date date, _to_date date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  period_days integer;
  previous_from date;
  total_users bigint;
  period_users bigint;
  previous_users bigint;
  period_feedback bigint;
  feedback_new bigint;
  feedback_in_review bigint;
  feedback_resolved bigint;
  total_families bigint;
  period_families bigint;
  period_transactions bigint;
  period_income_count bigint;
  period_expense_count bigint;
  monthly_signups jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.admin_users as admin where admin.user_id = auth.uid()
  ) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  if _from_date is null or _to_date is null or _to_date < _from_date then
    raise exception 'Choose a valid analytics date range.' using errcode = '22023';
  end if;

  period_days := (_to_date - _from_date) + 1;
  if period_days > 366 then
    raise exception 'Analytics date range cannot exceed 366 days.' using errcode = '22023';
  end if;
  previous_from := _from_date - period_days;

  select count(*) into total_users from auth.users;
  select count(*) into period_users
  from auth.users
  where created_at >= (_from_date::timestamp at time zone 'Asia/Kolkata')
    and created_at < ((_to_date + 1)::timestamp at time zone 'Asia/Kolkata');
  select count(*) into previous_users
  from auth.users
  where created_at >= (previous_from::timestamp at time zone 'Asia/Kolkata')
    and created_at < (_from_date::timestamp at time zone 'Asia/Kolkata');

  select
    count(*),
    count(*) filter (where status = 'new'),
    count(*) filter (where status = 'in_review'),
    count(*) filter (where status = 'resolved')
  into period_feedback, feedback_new, feedback_in_review, feedback_resolved
  from public.feedback_messages
  where created_at >= (_from_date::timestamp at time zone 'Asia/Kolkata')
    and created_at < ((_to_date + 1)::timestamp at time zone 'Asia/Kolkata');

  select count(*) into total_families from public.family_groups;
  select count(*) into period_families
  from public.family_groups
  where created_at >= (_from_date::timestamp at time zone 'Asia/Kolkata')
    and created_at < ((_to_date + 1)::timestamp at time zone 'Asia/Kolkata');

  select
    count(*),
    count(*) filter (where type = 'income'),
    count(*) filter (where type = 'expense')
  into period_transactions, period_income_count, period_expense_count
  from public.family_transactions
  where transaction_date >= _from_date
    and transaction_date <= _to_date;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('key', to_char(months.month_start, 'YYYY-MM'),
                         'label', to_char(months.month_start, 'Mon'),
                         'count', months.signup_count)
      order by months.month_start
    ),
    '[]'::jsonb
  )
  into monthly_signups
  from (
    select month_start::date,
           (select count(*)
            from auth.users as account
            where account.created_at >= (month_start at time zone 'Asia/Kolkata')
              and account.created_at < ((month_start + interval '1 month') at time zone 'Asia/Kolkata')) as signup_count
    from generate_series(
      date_trunc('month', now() at time zone 'Asia/Kolkata') - interval '5 months',
      date_trunc('month', now() at time zone 'Asia/Kolkata'),
      interval '1 month'
    ) as calendar(month_start)
  ) as months;

  return jsonb_build_object(
    'period', jsonb_build_object('from', _from_date, 'to', _to_date, 'days', period_days),
    'users', jsonb_build_object('total', total_users, 'new', period_users, 'previous_new', previous_users),
    'feedback', jsonb_build_object('total', period_feedback, 'new', feedback_new,
                                   'in_review', feedback_in_review, 'resolved', feedback_resolved),
    'families', jsonb_build_object('total', total_families, 'new', period_families),
    'transactions', jsonb_build_object('count', period_transactions,
                                       'income_count', period_income_count,
                                       'expense_count', period_expense_count),
    'monthly_signups', monthly_signups
  );
end;
$function$;

revoke all on function public.get_admin_analytics(date, date) from public, anon, authenticated;
grant execute on function public.get_admin_analytics(date, date) to authenticated;

commit;

notify pgrst, 'reload schema';
