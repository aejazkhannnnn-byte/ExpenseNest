-- REFERENCE ONLY: do not run over an existing family schema without comparing it first.
-- This describes the schema the current FamilySharing component expects.

create table if not exists public.family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.family_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table if not exists public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_groups (id) on delete cascade,
  invited_email text not null check (char_length(btrim(invited_email)) between 3 and 320),
  invite_code text not null unique,
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz
);

create table if not exists public.family_transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_groups (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null check (char_length(btrim(category)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 250),
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists family_members_user_id_idx
  on public.family_members (user_id, family_id);
create index if not exists family_transactions_family_date_idx
  on public.family_transactions (family_id, transaction_date desc, created_at desc);
create index if not exists family_invitations_family_email_idx
  on public.family_invitations (family_id, invited_email);

grant select, insert, update, delete on public.family_groups to authenticated;
grant select on public.family_members to authenticated;
grant select, insert, update, delete on public.family_transactions to authenticated;

create or replace function public.is_family_member(_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members as member
    where member.family_id = _family_id
      and member.user_id = auth.uid()
  );
$$;

revoke all on function public.is_family_member(uuid) from public;
revoke all on function public.is_family_member(uuid) from anon;
grant execute on function public.is_family_member(uuid) to authenticated;

create or replace function public.add_family_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.family_members (family_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (family_id, user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.add_family_owner_member() from public;

drop trigger if exists family_groups_add_owner_member on public.family_groups;
create trigger family_groups_add_owner_member
  after insert on public.family_groups
  for each row execute function public.add_family_owner_member();

alter table public.family_groups enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invitations enable row level security;
alter table public.family_transactions enable row level security;

drop policy if exists family_groups_select_members on public.family_groups;
create policy family_groups_select_members
  on public.family_groups for select to authenticated
  using (public.is_family_member(id));

drop policy if exists family_groups_insert_owner on public.family_groups;
create policy family_groups_insert_owner
  on public.family_groups for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists family_groups_update_owner on public.family_groups;
create policy family_groups_update_owner
  on public.family_groups for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists family_groups_delete_owner on public.family_groups;
create policy family_groups_delete_owner
  on public.family_groups for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists family_members_select_family on public.family_members;
create policy family_members_select_family
  on public.family_members for select to authenticated
  using (public.is_family_member(family_id));

-- Membership writes happen through the owner trigger and the invitation RPC.
-- No direct insert, update, or delete policy is granted to clients.

drop policy if exists family_transactions_select_family on public.family_transactions;
create policy family_transactions_select_family
  on public.family_transactions for select to authenticated
  using (public.is_family_member(family_id));

drop policy if exists family_transactions_insert_own on public.family_transactions;
create policy family_transactions_insert_own
  on public.family_transactions for insert to authenticated
  with check (created_by = auth.uid() and public.is_family_member(family_id));

drop policy if exists family_transactions_update_own on public.family_transactions;
create policy family_transactions_update_own
  on public.family_transactions for update to authenticated
  using (created_by = auth.uid() and public.is_family_member(family_id))
  with check (created_by = auth.uid() and public.is_family_member(family_id));

drop policy if exists family_transactions_delete_own on public.family_transactions;
create policy family_transactions_delete_own
  on public.family_transactions for delete to authenticated
  using (created_by = auth.uid() and public.is_family_member(family_id));

create or replace function public.create_family_invitation(_family_id uuid, _email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  normalized_email text := lower(btrim(coalesce(_email, '')));
  new_invite_code text;
begin
  if caller_id is null then
    raise exception 'Please sign in before creating an invitation.';
  end if;

  if char_length(normalized_email) < 3 or char_length(normalized_email) > 320 then
    raise exception 'Enter a valid email address.';
  end if;

  if not exists (
    select 1 from public.family_groups
    where id = _family_id and owner_id = caller_id
  ) then
    raise exception 'Only the family owner can invite members.';
  end if;

  update public.family_invitations
  set revoked_at = now()
  where family_id = _family_id
    and invited_email = normalized_email
    and accepted_at is null
    and revoked_at is null;

  loop
    new_invite_code := replace(gen_random_uuid()::text, '-', '');
    exit when not exists (
      select 1 from public.family_invitations
      where family_invitations.invite_code = new_invite_code
    );
  end loop;

  insert into public.family_invitations (
    family_id, invited_email, invite_code, invited_by
  ) values (
    _family_id, normalized_email, new_invite_code, caller_id
  );

  return new_invite_code;
end;
$$;

revoke all on function public.create_family_invitation(uuid, text) from public;
revoke all on function public.create_family_invitation(uuid, text) from anon;
grant execute on function public.create_family_invitation(uuid, text) to authenticated;

create or replace function public.accept_family_invitation(_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  invitation public.family_invitations%rowtype;
begin
  if caller_id is null or caller_email = '' then
    raise exception 'Please sign in before accepting an invitation.';
  end if;

  select * into invitation
  from public.family_invitations
  where invite_code = btrim(coalesce(_invite_code, ''))
  for update;

  if not found
    or invitation.accepted_at is not null
    or invitation.revoked_at is not null
    or invitation.expires_at <= now() then
    raise exception 'This invitation code is invalid, expired, or already used.';
  end if;

  if invitation.invited_email <> caller_email then
    raise exception 'Sign in with the email address this invitation was sent to.';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (invitation.family_id, caller_id, 'member')
  on conflict (family_id, user_id) do nothing;

  update public.family_invitations
  set accepted_at = now()
  where id = invitation.id;

  return invitation.family_id;
end;
$$;

revoke all on function public.accept_family_invitation(text) from public;
revoke all on function public.accept_family_invitation(text) from anon;
grant execute on function public.accept_family_invitation(text) to authenticated;
