-- A suspended organization must no longer grant organization-scoped access.
-- Platform admins keep access so they can inspect and reactivate it.

create or replace function private.has_active_organization_membership(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select private.is_platform_admin()
        or exists (
            select 1
            from public.organization_members
            join public.organizations
              on organizations.id = organization_members.organization_id
            where organization_members.user_id = (select auth.uid())
              and organization_members.organization_id = target_organization_id
              and organization_members.status = 'active'
              and organizations.status = 'active'
        );
$$;

create or replace function private.has_active_organization_role(
    target_organization_id uuid,
    allowed_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select private.is_platform_admin()
        or exists (
            select 1
            from public.organization_members
            join public.organizations
              on organizations.id = organization_members.organization_id
            where organization_members.user_id = (select auth.uid())
              and organization_members.organization_id = target_organization_id
              and organization_members.status = 'active'
              and organization_members.role = any (allowed_roles)
              and organizations.status = 'active'
        );
$$;

revoke all on function private.has_active_organization_membership(uuid) from public, anon;
revoke all on function private.has_active_organization_role(uuid, public.organization_role[]) from public, anon;
grant execute on function private.has_active_organization_membership(uuid) to authenticated;
grant execute on function private.has_active_organization_role(uuid, public.organization_role[]) to authenticated;
