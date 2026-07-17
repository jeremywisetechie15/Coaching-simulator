-- An organization must be emptied of all memberships before hard deletion.
-- This database invariant complements the application-level conflict message
-- and prevents direct Data API or service-role deletes from orphaning users.
alter table public.organization_members
    drop constraint if exists organization_members_organization_id_fkey;

alter table public.organization_members
    add constraint organization_members_organization_id_fkey
    foreign key (organization_id)
    references public.organizations(id)
    on delete restrict;

-- Removing an organization membership also removes only the user's group
-- memberships that belong to this organization. If another FK (notably
-- sessions_user_organization_fk) rejects the membership deletion, PostgreSQL
-- rolls this trigger work back in the same statement.
create or replace function private.cleanup_group_members_after_organization_membership_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    delete from public.group_members as group_membership
    using public.groups as organization_group
    where group_membership.group_id = organization_group.id
      and group_membership.user_id = old.user_id
      and organization_group.organization_id = old.organization_id;

    return old;
end;
$$;

revoke all on function private.cleanup_group_members_after_organization_membership_delete()
    from public, anon, authenticated;

drop trigger if exists cleanup_group_members_after_organization_membership_delete
    on public.organization_members;

create trigger cleanup_group_members_after_organization_membership_delete
    after delete on public.organization_members
    for each row
    execute function private.cleanup_group_members_after_organization_membership_delete();
