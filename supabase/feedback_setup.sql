-- Secure feedback inbox for authenticated ExpenseNest users and admins.
-- Run this in the Supabase SQL Editor after the admin_users table exists.

begin;

create table if not exists public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_email text,
  category text not null default 'general'
    check (category in ('general', 'idea', 'bug', 'other')),
  message text not null
    check (char_length(btrim(message)) between 10 and 2000),
  status text not null default 'new'
    check (status in ('new', 'in_review', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists feedback_messages_status_created_idx
  on public.feedback_messages (status, created_at desc);

create index if not exists feedback_messages_user_created_idx
  on public.feedback_messages (user_id, created_at desc);

alter table public.feedback_messages enable row level security;

drop policy if exists feedback_messages_insert_own on public.feedback_messages;
create policy feedback_messages_insert_own
  on public.feedback_messages
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'new'
    and coalesce(lower(btrim(user_email)), '') = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists feedback_messages_select_admin on public.feedback_messages;
create policy feedback_messages_select_admin
  on public.feedback_messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.admin_users as admin
      where admin.user_id = auth.uid()
    )
  );

drop policy if exists feedback_messages_update_admin_status on public.feedback_messages;
create policy feedback_messages_update_admin_status
  on public.feedback_messages
  for update to authenticated
  using (
    exists (
      select 1
      from public.admin_users as admin
      where admin.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users as admin
      where admin.user_id = auth.uid()
    )
  );

revoke all on table public.feedback_messages from anon, authenticated;
grant select on table public.feedback_messages to authenticated;
grant insert (user_id, user_email, category, message)
  on table public.feedback_messages to authenticated;
grant update (status) on table public.feedback_messages to authenticated;

commit;

notify pgrst, 'reload schema';
