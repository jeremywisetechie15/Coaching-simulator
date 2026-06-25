-- Harden RLS for admin/configuration tables and organization memberships.
-- Platform roles stay in public.profiles.platform_role: admin | user.
-- Organization roles stay in public.organization_members.role: member | manager.

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.profiles
        where profiles.id = (select auth.uid())
          and profiles.platform_role = 'admin'::public.platform_role
    );
$$;

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
            where organization_members.user_id = (select auth.uid())
              and organization_members.organization_id = target_organization_id
              and organization_members.status = 'active'
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
            where organization_members.user_id = (select auth.uid())
              and organization_members.organization_id = target_organization_id
              and organization_members.status = 'active'
              and organization_members.role = any (allowed_roles)
        );
$$;

create or replace function private.can_read_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.groups
        where groups.id = target_group_id
          and private.has_active_organization_membership(groups.organization_id)
    );
$$;

grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.has_active_organization_membership(uuid) to authenticated;
grant execute on function private.has_active_organization_role(uuid, public.organization_role[]) to authenticated;
grant execute on function private.can_read_group(uuid) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = pg_catalog.now();
    return new;
end;
$$;

revoke all on function public.current_user_is_platform_admin() from public, anon, authenticated;
revoke all on function public.current_user_has_active_organization_membership(uuid) from public, anon, authenticated;
revoke all on function public.current_user_can_read_group(uuid) from public, anon, authenticated;

alter table public.prompts enable row level security;
alter table public.methods enable row level security;
alter table public.method_steps enable row level security;
alter table public.method_resources enable row level security;
alter table public.notation_output_schemas enable row level security;
alter table public.organization_members enable row level security;

revoke all on table public.prompts from anon;
revoke all on table public.methods from anon;
revoke all on table public.method_steps from anon;
revoke all on table public.method_resources from anon;
revoke all on table public.notation_output_schemas from anon;
revoke all on table public.organization_members from anon;
revoke all on table public.groups from anon;
revoke all on table public.group_members from anon;

grant select on table public.prompts to authenticated;
grant select on table public.methods to authenticated;
grant select on table public.method_steps to authenticated;
grant select on table public.method_resources to authenticated;
grant select on table public.notation_output_schemas to authenticated;
grant select on table public.organization_members to authenticated;
grant select on table public.groups to authenticated;
grant select on table public.group_members to authenticated;

grant insert, update, delete on table public.prompts to authenticated;
grant insert, update, delete on table public.methods to authenticated;
grant insert, update, delete on table public.method_steps to authenticated;
grant insert, update, delete on table public.method_resources to authenticated;
grant insert, update, delete on table public.notation_output_schemas to authenticated;
grant insert, update, delete on table public.organization_members to authenticated;

drop policy if exists "Authenticated users can read prompts" on public.prompts;
drop policy if exists "Platform admins can insert prompts" on public.prompts;
drop policy if exists "Platform admins can update prompts" on public.prompts;
drop policy if exists "Platform admins can delete prompts" on public.prompts;

create policy "Authenticated users can read prompts"
    on public.prompts
    for select
    to authenticated
    using (true);

create policy "Platform admins can insert prompts"
    on public.prompts
    for insert
    to authenticated
    with check (private.is_platform_admin());

create policy "Platform admins can update prompts"
    on public.prompts
    for update
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

create policy "Platform admins can delete prompts"
    on public.prompts
    for delete
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Authenticated users can read active methods" on public.methods;
drop policy if exists "Platform admins can insert methods" on public.methods;
drop policy if exists "Platform admins can update methods" on public.methods;
drop policy if exists "Platform admins can delete methods" on public.methods;

create policy "Authenticated users can read active methods"
    on public.methods
    for select
    to authenticated
    using (is_active = true or private.is_platform_admin());

create policy "Platform admins can insert methods"
    on public.methods
    for insert
    to authenticated
    with check (private.is_platform_admin());

create policy "Platform admins can update methods"
    on public.methods
    for update
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

create policy "Platform admins can delete methods"
    on public.methods
    for delete
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Authenticated users can read active method steps" on public.method_steps;
drop policy if exists "Platform admins can insert method steps" on public.method_steps;
drop policy if exists "Platform admins can update method steps" on public.method_steps;
drop policy if exists "Platform admins can delete method steps" on public.method_steps;

create policy "Authenticated users can read active method steps"
    on public.method_steps
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or exists (
            select 1
            from public.methods
            where methods.id = method_steps.method_id
              and methods.is_active = true
        )
    );

create policy "Platform admins can insert method steps"
    on public.method_steps
    for insert
    to authenticated
    with check (private.is_platform_admin());

create policy "Platform admins can update method steps"
    on public.method_steps
    for update
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

create policy "Platform admins can delete method steps"
    on public.method_steps
    for delete
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Authenticated users can read active method resources" on public.method_resources;
drop policy if exists "Platform admins can insert method resources" on public.method_resources;
drop policy if exists "Platform admins can update method resources" on public.method_resources;
drop policy if exists "Platform admins can delete method resources" on public.method_resources;

create policy "Authenticated users can read active method resources"
    on public.method_resources
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or (
            is_active = true
            and exists (
                select 1
                from public.methods
                where methods.id = method_resources.method_id
                  and methods.is_active = true
            )
        )
    );

create policy "Platform admins can insert method resources"
    on public.method_resources
    for insert
    to authenticated
    with check (private.is_platform_admin());

create policy "Platform admins can update method resources"
    on public.method_resources
    for update
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

create policy "Platform admins can delete method resources"
    on public.method_resources
    for delete
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Authenticated users can read active notation output schemas" on public.notation_output_schemas;
drop policy if exists "Platform admins can insert notation output schemas" on public.notation_output_schemas;
drop policy if exists "Platform admins can update notation output schemas" on public.notation_output_schemas;
drop policy if exists "Platform admins can delete notation output schemas" on public.notation_output_schemas;

create policy "Authenticated users can read active notation output schemas"
    on public.notation_output_schemas
    for select
    to authenticated
    using (is_active = true or private.is_platform_admin());

create policy "Platform admins can insert notation output schemas"
    on public.notation_output_schemas
    for insert
    to authenticated
    with check (private.is_platform_admin());

create policy "Platform admins can update notation output schemas"
    on public.notation_output_schemas
    for update
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

create policy "Platform admins can delete notation output schemas"
    on public.notation_output_schemas
    for delete
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Users can read their own memberships" on public.organization_members;
drop policy if exists "Managers can read organization memberships" on public.organization_members;
drop policy if exists "Platform admins can insert organization members" on public.organization_members;
drop policy if exists "Platform admins can update organization members" on public.organization_members;
drop policy if exists "Platform admins can delete organization members" on public.organization_members;

create policy "Users can read their own memberships"
    on public.organization_members
    for select
    to authenticated
    using (user_id = (select auth.uid()) or private.is_platform_admin());

create policy "Managers can read organization memberships"
    on public.organization_members
    for select
    to authenticated
    using (private.has_active_organization_role(organization_id, array['manager'::public.organization_role]));

create policy "Platform admins can insert organization members"
    on public.organization_members
    for insert
    to authenticated
    with check (private.is_platform_admin());

create policy "Platform admins can update organization members"
    on public.organization_members
    for update
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

create policy "Platform admins can delete organization members"
    on public.organization_members
    for delete
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Organization members can read groups" on public.groups;
drop policy if exists "Platform admins can create groups" on public.groups;
drop policy if exists "Platform admins can update groups" on public.groups;
drop policy if exists "Platform admins can delete groups" on public.groups;

create policy "Organization members can read groups"
    on public.groups
    for select
    to authenticated
    using (private.has_active_organization_membership(organization_id));

create policy "Platform admins can create groups"
    on public.groups
    for insert
    to authenticated
    with check (private.is_platform_admin());

create policy "Platform admins can update groups"
    on public.groups
    for update
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

create policy "Platform admins can delete groups"
    on public.groups
    for delete
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Organization members can read group members" on public.group_members;
drop policy if exists "Platform admins can create group members" on public.group_members;
drop policy if exists "Platform admins can delete group members" on public.group_members;

create policy "Organization members can read group members"
    on public.group_members
    for select
    to authenticated
    using (user_id = (select auth.uid()) or private.can_read_group(group_id));

create policy "Platform admins can create group members"
    on public.group_members
    for insert
    to authenticated
    with check (private.is_platform_admin());

create policy "Platform admins can delete group members"
    on public.group_members
    for delete
    to authenticated
    using (private.is_platform_admin());

notify pgrst, 'reload schema';
