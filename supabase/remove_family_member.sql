-- Add owner-only member removal to the existing family sharing schema.
-- This keeps the removed member's historical transactions in family history.

begin;

create or replace function public.remove_family_member(
  _family_id uuid,
  _user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Please login first';
  end if;

  if _family_id is null or _user_id is null then
    raise exception 'Family and member are required';
  end if;

  if not public.is_family_owner(_family_id) then
    raise exception 'Only the family owner can remove members';
  end if;

  if exists (
    select 1
    from public.family_groups
    where id = _family_id
      and owner_id = _user_id
  ) then
    raise exception 'The family owner cannot be removed';
  end if;

  delete from public.family_members
  where family_id = _family_id
    and user_id = _user_id;

  if not found then
    raise exception 'Family member not found';
  end if;

  update public.family_invitations as invitation
  set expires_at = now()
  where invitation.family_id = _family_id
    and invitation.status = 'pending'
    and lower(invitation.invited_email) = (
      select lower(auth_user.email)
      from auth.users as auth_user
      where auth_user.id = _user_id
    );
end;
$function$;

revoke all on function public.remove_family_member(uuid, uuid) from public;
revoke all on function public.remove_family_member(uuid, uuid) from anon;
grant execute on function public.remove_family_member(uuid, uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
