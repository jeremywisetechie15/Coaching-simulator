-- Skills visibility targeting.
-- Competences no longer carry a business objective; visibility follows the shared
-- public / organization / group / user content scope model.

alter table public.skills
    add column if not exists visibility_scope text not null default 'public',
    add column if not exists organization_id uuid references public.organizations(id) on delete set null,
    add column if not exists group_id uuid references public.groups(id) on delete set null,
    add column if not exists assigned_user_id uuid references public.profiles(id) on delete set null;

alter table public.skills
    drop column if exists objective;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'skills_visibility_scope_check'
    ) then
        alter table public.skills
            add constraint skills_visibility_scope_check
            check (visibility_scope in ('public', 'organization', 'group', 'user'));
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'skills_organization_required_for_private_check'
    ) then
        alter table public.skills
            add constraint skills_organization_required_for_private_check
            check (visibility_scope <> 'organization' or organization_id is not null);
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'skills_group_required_for_group_scope_check'
    ) then
        alter table public.skills
            add constraint skills_group_required_for_group_scope_check
            check (visibility_scope <> 'group' or group_id is not null);
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'skills_user_required_for_user_scope_check'
    ) then
        alter table public.skills
            add constraint skills_user_required_for_user_scope_check
            check (visibility_scope <> 'user' or assigned_user_id is not null);
    end if;
end $$;

create index if not exists skills_visibility_scope_idx
    on public.skills(visibility_scope, organization_id, group_id, assigned_user_id);

drop policy if exists "Authenticated users can read visible skills" on public.skills;
create policy "Authenticated users can read visible skills"
    on public.skills
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or (
            is_active = true
            and status = 'published'::public.content_status
            and (
                visibility_scope = 'public'
                or (
                    visibility_scope = 'organization'
                    and organization_id is not null
                    and private.has_active_organization_membership(organization_id)
                )
                or (
                    visibility_scope = 'group'
                    and group_id is not null
                    and private.can_read_group(group_id)
                )
                or (
                    visibility_scope = 'user'
                    and assigned_user_id = (select auth.uid())
                )
            )
        )
    );

drop policy if exists "Authenticated users can read visible skill dimension items" on public.skill_dimension_items;
create policy "Authenticated users can read visible skill dimension items"
    on public.skill_dimension_items
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.skills
            where skills.id = skill_dimension_items.skill_id
        )
    );

notify pgrst, 'reload schema';
