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

-- Keep one privacy-safe app-activity record per signed-in account per local day.
create table if not exists public.account_activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_date date not null,
  recorded_at timestamptz not null default pg_catalog.now(),
  primary key (user_id, activity_date)
);

create index if not exists account_activity_days_date_idx
  on public.account_activity_days (activity_date);

alter table public.account_activity_days enable row level security;
revoke all on table public.account_activity_days from public, anon, authenticated;

create or replace function public.record_account_activity()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Please sign in before recording account activity.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from auth.users as account
    where account.id = current_user_id
      and (account.banned_until is null or account.banned_until <= pg_catalog.now())
  ) then
    raise exception 'This account cannot record activity.' using errcode = '42501';
  end if;

  insert into public.account_activity_days (user_id, activity_date)
  values (current_user_id, (pg_catalog.now() at time zone 'Asia/Kolkata')::date)
  on conflict (user_id, activity_date) do nothing;
end;
$function$;

revoke all on function public.record_account_activity() from public, anon;
grant execute on function public.record_account_activity() to authenticated;

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
  active_users bigint;
  previous_active_users bigint;
  returning_users bigint;
  returning_rate numeric;
  daily_active_users jsonb;
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

  select count(distinct activity.user_id)
    into active_users
  from public.account_activity_days as activity
  where activity.activity_date between _from_date and _to_date;

  select count(distinct activity.user_id)
    into previous_active_users
  from public.account_activity_days as activity
  where activity.activity_date >= previous_from
    and activity.activity_date < _from_date;

  select count(distinct activity.user_id)
    into returning_users
  from public.account_activity_days as activity
  join auth.users as account on account.id = activity.user_id
  where activity.activity_date between _from_date and _to_date
    and account.created_at < (_from_date::timestamp at time zone 'Asia/Kolkata');

  returning_rate := case
    when active_users = 0 then 0
    else round((returning_users::numeric * 100) / active_users, 1)
  end;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(daily.activity_date, 'YYYY-MM-DD'),
        'label', to_char(daily.activity_date, 'Mon FMDD'),
        'count', daily.active_count
      ) order by daily.activity_date
    ),
    '[]'::jsonb
  )
  into daily_active_users
  from (
    select calendar.activity_date::date as activity_date,
           coalesce(active.active_count, 0)::bigint as active_count
    from generate_series(
      _from_date::timestamp,
      _to_date::timestamp,
      interval '1 day'
    ) as calendar(activity_date)
    left join (
      select activity.activity_date, count(distinct activity.user_id)::bigint as active_count
      from public.account_activity_days as activity
      where activity.activity_date between _from_date and _to_date
      group by activity.activity_date
    ) as active on active.activity_date = calendar.activity_date::date
  ) as daily;

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
    'users', jsonb_build_object(
      'total', total_users,
      'new', period_users,
      'previous_new', previous_users,
      'active', active_users,
      'previous_active', previous_active_users,
      'returning', returning_users,
      'returning_rate', returning_rate
    ),
    'feedback', jsonb_build_object('total', period_feedback, 'new', feedback_new,
                                   'in_review', feedback_in_review, 'resolved', feedback_resolved),
    'families', jsonb_build_object('total', total_families, 'new', period_families),
    'transactions', jsonb_build_object('count', period_transactions,
                                       'income_count', period_income_count,
                                       'expense_count', period_expense_count),
    'monthly_signups', monthly_signups,
    'daily_active_users', daily_active_users
  );
end;
$function$;

revoke all on function public.get_admin_analytics(date, date) from public, anon, authenticated;
grant execute on function public.get_admin_analytics(date, date) to authenticated;

comment on table public.account_activity_days is
  'One account-per-day app usage record, without transaction or financial details.';
comment on function public.record_account_activity() is
  'Records the current authenticated account as active for the current Asia/Kolkata date.';

commit;

notify pgrst, 'reload schema';
