-- Restrict helper functions used by RLS policies to signed-in users only.

revoke all on function private.is_platform_admin() from public, anon;
revoke all on function private.has_active_organization_membership(uuid) from public, anon;
revoke all on function private.has_active_organization_role(uuid, public.organization_role[]) from public, anon;
revoke all on function private.can_read_group(uuid) from public, anon;

grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.has_active_organization_membership(uuid) to authenticated;
grant execute on function private.has_active_organization_role(uuid, public.organization_role[]) to authenticated;
grant execute on function private.can_read_group(uuid) to authenticated;

notify pgrst, 'reload schema';
