-- Two-way, private conversations for feedback submissions.
-- Run after feedback_setup.sql and feedback_responses.sql. The existing
-- feedback_messages.admin_response field remains the latest-reply summary.

begin;

-- New submissions start unread for the admin. Existing rows receive the
-- default during ADD COLUMN and are therefore treated as already seen.
alter table public.feedback_messages
  add column if not exists admin_read_at timestamptz default pg_catalog.now();
alter table public.feedback_messages
  alter column admin_read_at drop default;

create table if not exists public.feedback_replies (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback_messages (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_role text not null check (author_role in ('user', 'admin')),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  created_at timestamptz not null default pg_catalog.now(),
  user_read_at timestamptz,
  admin_read_at timestamptz
);

create index if not exists feedback_replies_thread_idx
  on public.feedback_replies (feedback_id, created_at, id);
create index if not exists feedback_replies_user_unread_idx
  on public.feedback_replies (feedback_id, user_read_at)
  where author_role = 'admin' and user_read_at is null;
create index if not exists feedback_replies_admin_unread_idx
  on public.feedback_replies (feedback_id, admin_read_at)
  where author_role = 'user' and admin_read_at is null;

alter table public.feedback_replies enable row level security;
revoke all on table public.feedback_replies from public, anon, authenticated;
grant select on table public.feedback_replies to authenticated;

drop policy if exists feedback_replies_select_conversation on public.feedback_replies;
create policy feedback_replies_select_conversation
  on public.feedback_replies
  for select to authenticated
  using (
    exists (
      select 1
      from public.feedback_messages as feedback
      where feedback.id = feedback_replies.feedback_id
        and (
          feedback.user_id = (select auth.uid())
          or exists (
            select 1 from public.admin_users as admin
            where admin.user_id = (select auth.uid())
          )
        )
    )
  );

-- Preserve responses created before conversations were introduced without
-- generating a false unread alert for old conversations.
insert into public.feedback_replies (
  feedback_id, author_id, author_role, message, created_at, user_read_at, admin_read_at
)
select feedback.id,
       feedback.responded_by,
       'admin',
       feedback.admin_response,
       coalesce(feedback.responded_at, feedback.created_at, pg_catalog.now()),
       coalesce(feedback.responded_at, feedback.created_at, pg_catalog.now()),
       coalesce(feedback.responded_at, feedback.created_at, pg_catalog.now())
from public.feedback_messages as feedback
where nullif(pg_catalog.btrim(feedback.admin_response), '') is not null
  and not exists (
    select 1
    from public.feedback_replies as reply
    where reply.feedback_id = feedback.id
      and reply.author_role = 'admin'
      and reply.message = feedback.admin_response
  );

create or replace function public.user_reply_to_feedback(
  _feedback_id uuid,
  _message text
)
returns public.feedback_replies
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  clean_message text := nullif(pg_catalog.btrim(_message), '');
  inserted_reply public.feedback_replies%rowtype;
begin
  if current_user_id is null then
    raise exception 'Sign in to reply to feedback.' using errcode = '42501';
  end if;
  if clean_message is null or pg_catalog.char_length(clean_message) > 2000 then
    raise exception 'A reply must contain between 1 and 2,000 characters.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.feedback_messages as feedback
    where feedback.id = _feedback_id and feedback.user_id = current_user_id
  ) then
    raise exception 'Feedback message not found.' using errcode = 'P0002';
  end if;

  insert into public.feedback_replies (
    feedback_id, author_id, author_role, message, user_read_at
  ) values (
    _feedback_id, current_user_id, 'user', clean_message, pg_catalog.now()
  ) returning * into inserted_reply;

  update public.feedback_messages
  set status = 'in_review'
  where id = _feedback_id and status = 'resolved';

  return inserted_reply;
end;
$function$;

create or replace function public.admin_reply_to_feedback(
  _feedback_id uuid,
  _message text,
  _status text default 'in_review'
)
returns public.feedback_replies
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_admin_id uuid := auth.uid();
  clean_message text := nullif(pg_catalog.btrim(_message), '');
  inserted_reply public.feedback_replies%rowtype;
begin
  if current_admin_id is null or not exists (
    select 1 from public.admin_users as admin where admin.user_id = current_admin_id
  ) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
  if clean_message is null or pg_catalog.char_length(clean_message) > 2000 then
    raise exception 'A reply must contain between 1 and 2,000 characters.' using errcode = '22023';
  end if;
  if _status is null or _status not in ('new', 'in_review', 'resolved') then
    raise exception 'Unsupported feedback status.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.feedback_messages where id = _feedback_id) then
    raise exception 'Feedback message not found.' using errcode = 'P0002';
  end if;

  insert into public.feedback_replies (
    feedback_id, author_id, author_role, message, admin_read_at
  ) values (
    _feedback_id, current_admin_id, 'admin', clean_message, pg_catalog.now()
  ) returning * into inserted_reply;

  update public.feedback_messages
  set status = _status,
      admin_response = clean_message,
      responded_at = inserted_reply.created_at,
      responded_by = current_admin_id
  where id = _feedback_id;

  return inserted_reply;
end;
$function$;

create or replace function public.mark_feedback_replies_read(_feedback_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  marked_count integer := 0;
  changed_count integer := 0;
  is_admin boolean;
begin
  if current_user_id is null then
    raise exception 'Sign in to open this conversation.' using errcode = '42501';
  end if;
  select exists (
    select 1 from public.admin_users as admin where admin.user_id = current_user_id
  ) into is_admin;

  if is_admin then
    update public.feedback_messages
    set admin_read_at = pg_catalog.now()
    where id = _feedback_id and admin_read_at is null;
    get diagnostics marked_count = row_count;

    update public.feedback_replies
    set admin_read_at = pg_catalog.now()
    where feedback_id = _feedback_id
      and author_role = 'user'
      and admin_read_at is null;
    get diagnostics changed_count = row_count;
    marked_count := marked_count + changed_count;
  elsif exists (
    select 1 from public.feedback_messages
    where id = _feedback_id and user_id = current_user_id
  ) then
    update public.feedback_replies
    set user_read_at = pg_catalog.now()
    where feedback_id = _feedback_id
      and author_role = 'admin'
      and user_read_at is null;
    get diagnostics marked_count = row_count;
  else
    raise exception 'Feedback message not found.' using errcode = 'P0002';
  end if;

  return marked_count;
end;
$function$;

create or replace function public.get_feedback_unread_count()
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  unread_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'Sign in to view feedback notifications.' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.admin_users as admin where admin.user_id = current_user_id
  ) then
    select (
      select pg_catalog.count(*)::integer
      from public.feedback_messages as feedback
      where feedback.admin_read_at is null
    ) + (
      select pg_catalog.count(*)::integer
      from public.feedback_replies as reply
      where reply.author_role = 'user' and reply.admin_read_at is null
    ) into unread_count;
  else
    select pg_catalog.count(*)::integer into unread_count
    from public.feedback_replies as reply
    join public.feedback_messages as feedback on feedback.id = reply.feedback_id
    where feedback.user_id = current_user_id
      and reply.author_role = 'admin'
      and reply.user_read_at is null;
  end if;

  return coalesce(unread_count, 0);
end;
$function$;

-- The legacy audit trigger runs on feedback status changes. A user follow-up
-- may reopen a resolved item, so keep those user actions out of the admin log.
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
  if (old.status is distinct from new.status or old.admin_response is distinct from new.admin_response)
    and caller_id is not null
    and exists (select 1 from public.admin_users as admin where admin.user_id = caller_id)
    and to_regclass('public.admin_activity_logs') is not null then
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
  return new;
end;
$function$;

revoke all on function public.log_admin_feedback_status_change() from public, anon, authenticated;

revoke all on function public.user_reply_to_feedback(uuid, text) from public, anon;
revoke all on function public.admin_reply_to_feedback(uuid, text, text) from public, anon;
revoke all on function public.mark_feedback_replies_read(uuid) from public, anon;
revoke all on function public.get_feedback_unread_count() from public, anon;
grant execute on function public.user_reply_to_feedback(uuid, text) to authenticated;
grant execute on function public.admin_reply_to_feedback(uuid, text, text) to authenticated;
grant execute on function public.mark_feedback_replies_read(uuid) to authenticated;
grant execute on function public.get_feedback_unread_count() to authenticated;

comment on table public.feedback_replies is
  'Private two-way feedback conversation messages. Access is limited to the feedback owner and administrators.';

commit;

notify pgrst, 'reload schema';
