-- Retire the admin financial overview RPC.
-- The Admin Panel must not read personal transactions, amounts, balances, budgets, or goals.

begin;

do $migration$
begin
  if to_regprocedure('public.get_admin_financial_overview(date,date,text)') is not null then
    execute 'revoke all on function public.get_admin_financial_overview(date, date, text) from public, anon, authenticated';
  end if;
end;
$migration$;

drop function if exists public.get_admin_financial_overview(date, date, text);
drop function if exists public.admin_finance_parse_json(text);
drop function if exists public.admin_finance_value(jsonb, text);
drop function if exists public.admin_finance_number(text);
drop function if exists public.admin_finance_date(text);

commit;

notify pgrst, 'reload schema';