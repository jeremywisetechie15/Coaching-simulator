-- Archived groups are no longer valid assignment targets.
-- Platform administrators retain their administrative bypass, while regular
-- members can only read content scoped to an active group.
create or replace function private.can_read_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select private.is_platform_admin()
        or exists (
            select 1
            from public.groups g
            join public.group_members gm on gm.group_id = g.id
            where g.id = target_group_id
              and g.status = 'active'
              and gm.user_id = (select auth.uid())
              and private.has_active_organization_membership(g.organization_id)
        );
$$;

revoke all on function private.can_read_group(uuid) from public, anon;
grant execute on function private.can_read_group(uuid) to authenticated;
