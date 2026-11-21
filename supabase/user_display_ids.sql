-- Give each auth account a stable, human-friendly ID for admin display.
-- Internal auth UUIDs remain unchanged and continue to drive relationships.

begin;

do $migration$
begin
  if to_regclass('public.admin_users') is null then
    raise exception 'Create admin_users before applying user_display_ids.sql.';
  end if;
end;
$migration$;

create table if not exists public.user_display_ids (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_id text not null unique
    check (display_id ~ '^[A-Z][0-9]{5}$'),
  created_at timestamptz not null default now()
);

alter table public.user_display_ids enable row level security;

drop policy if exists user_display_ids_select_admin on public.user_display_ids;
create policy user_display_ids_select_admin
  on public.user_display_ids
  for select to authenticated
  using (
    exists (
      select 1
      from public.admin_users as admin
      where admin.user_id = auth.uid()
    )
  );

revoke all on table public.user_display_ids from anon, authenticated;
grant select on table public.user_display_ids to authenticated;

create or replace function public.ensure_user_display_id(_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  existing_id text;
  candidate_id text;
begin
  if _user_id is null then
    raise exception 'A user ID is required.' using errcode = '22023';
  end if;

  select display_id into existing_id
  from public.user_display_ids
  where user_id = _user_id;
  if found then return existing_id; end if;

  loop
    candidate_id := pg_catalog.chr(65 + pg_catalog.floor(pg_catalog.random() * 26)::integer)
      || pg_catalog.lpad(pg_catalog.floor(pg_catalog.random() * 100000)::integer::text, 5, '0');

    begin
      insert into public.user_display_ids (user_id, display_id)
      values (_user_id, candidate_id);
      return candidate_id;
    exception when unique_violation then
      select display_id into existing_id
      from public.user_display_ids
      where user_id = _user_id;
      if found then return existing_id; end if;
    end;
  end loop;
end;
$function$;

create or replace function public.assign_user_display_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform public.ensure_user_display_id(new.id);
  return new;
end;
$function$;

revoke all on function public.ensure_user_display_id(uuid) from public, anon, authenticated;
revoke all on function public.assign_user_display_id() from public, anon, authenticated;

drop trigger if exists auth_users_assign_display_id on auth.users;
create trigger auth_users_assign_display_id
  after insert on auth.users
  for each row
  execute function public.assign_user_display_id();

do $backfill$
declare
  account record;
begin
  for account in
    select id from auth.users order by created_at, id
  loop
    perform public.ensure_user_display_id(account.id);
  end loop;
end;
$backfill$;

commit;

notify pgrst, 'reload schema';
