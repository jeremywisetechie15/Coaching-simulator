-- Add organization groups and optional user memberships.
create table if not exists public.groups (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    name text not null,
    description text,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint groups_status_check check (status = any (array['active', 'archived']))
);

create unique index if not exists groups_organization_lower_name_key
    on public.groups (organization_id, lower(name));

create index if not exists groups_organization_id_idx
    on public.groups(organization_id);

create table if not exists public.group_members (
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    assigned_at timestamptz not null default now(),
    primary key (group_id, user_id)
);

create index if not exists group_members_user_id_idx
    on public.group_members(user_id);

create or replace function public.touch_groups_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists groups_touch_updated_at on public.groups;
create trigger groups_touch_updated_at
before update on public.groups
for each row execute function public.touch_groups_updated_at();

create or replace function public.current_user_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.platform_role = 'admin'
    );
$$;

create or replace function public.current_user_has_active_organization_membership(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select public.current_user_is_platform_admin()
        or exists (
            select 1
            from public.organization_members
            where organization_members.user_id = auth.uid()
              and organization_members.organization_id = target_organization_id
              and organization_members.status = 'active'
        );
$$;

create or replace function public.current_user_can_read_group(target_group_id uuid)
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
          and public.current_user_has_active_organization_membership(groups.organization_id)
    );
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

grant select, insert, update, delete on table public.groups to authenticated, service_role;
grant select, insert, update, delete on table public.group_members to authenticated, service_role;
grant execute on function public.current_user_is_platform_admin() to authenticated, service_role;
grant execute on function public.current_user_has_active_organization_membership(uuid) to authenticated, service_role;
grant execute on function public.current_user_can_read_group(uuid) to authenticated, service_role;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'groups'
          and policyname = 'Organization members can read groups'
    ) then
        create policy "Organization members can read groups"
            on public.groups
            for select
            to authenticated
            using (public.current_user_has_active_organization_membership(organization_id));
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'groups'
          and policyname = 'Platform admins can create groups'
    ) then
        create policy "Platform admins can create groups"
            on public.groups
            for insert
            to authenticated
            with check (public.current_user_is_platform_admin());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'groups'
          and policyname = 'Platform admins can update groups'
    ) then
        create policy "Platform admins can update groups"
            on public.groups
            for update
            to authenticated
            using (public.current_user_is_platform_admin())
            with check (public.current_user_is_platform_admin());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'groups'
          and policyname = 'Platform admins can delete groups'
    ) then
        create policy "Platform admins can delete groups"
            on public.groups
            for delete
            to authenticated
            using (public.current_user_is_platform_admin());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'group_members'
          and policyname = 'Organization members can read group members'
    ) then
        create policy "Organization members can read group members"
            on public.group_members
            for select
            to authenticated
            using (
                user_id = auth.uid()
                or public.current_user_can_read_group(group_id)
            );
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'group_members'
          and policyname = 'Platform admins can create group members'
    ) then
        create policy "Platform admins can create group members"
            on public.group_members
            for insert
            to authenticated
            with check (public.current_user_is_platform_admin());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'group_members'
          and policyname = 'Platform admins can delete group members'
    ) then
        create policy "Platform admins can delete group members"
            on public.group_members
            for delete
            to authenticated
            using (public.current_user_is_platform_admin());
    end if;
end $$;
