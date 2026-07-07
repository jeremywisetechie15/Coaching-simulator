-- Roleplay CRUD source of truth.
-- Existing sessions already reference public.scenarios, so roleplays are persisted as scenarios.

alter table public.scenarios
    add column if not exists coach_id uuid references public.coaches(id) on delete set null,
    add column if not exists scorecard_id uuid references public.scorecards(id) on delete set null,
    add column if not exists domain text,
    add column if not exists category text,
    add column if not exists disc_profile text,
    add column if not exists context text,
    add column if not exists objective text,
    add column if not exists obstacles text,
    add column if not exists visibility_scope text not null default 'public',
    add column if not exists organization_id uuid references public.organizations(id) on delete set null,
    add column if not exists group_id uuid references public.groups(id) on delete set null,
    add column if not exists assigned_user_id uuid references public.profiles(id) on delete set null,
    add column if not exists is_active boolean not null default true;

update public.scenarios
set is_active = false
where status = 'archived'::public.content_status;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'scenarios_visibility_scope_check'
          and conrelid = 'public.scenarios'::regclass
    ) then
        alter table public.scenarios
            add constraint scenarios_visibility_scope_check
            check (visibility_scope in ('public', 'organization', 'group', 'user'))
            not valid;
        alter table public.scenarios validate constraint scenarios_visibility_scope_check;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'scenarios_organization_required_for_private_check'
          and conrelid = 'public.scenarios'::regclass
    ) then
        alter table public.scenarios
            add constraint scenarios_organization_required_for_private_check
            check (visibility_scope = 'public' or organization_id is not null or visibility_scope = 'user')
            not valid;
        alter table public.scenarios validate constraint scenarios_organization_required_for_private_check;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'scenarios_group_required_for_group_scope_check'
          and conrelid = 'public.scenarios'::regclass
    ) then
        alter table public.scenarios
            add constraint scenarios_group_required_for_group_scope_check
            check (visibility_scope <> 'group' or group_id is not null)
            not valid;
        alter table public.scenarios validate constraint scenarios_group_required_for_group_scope_check;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'scenarios_user_required_for_user_scope_check'
          and conrelid = 'public.scenarios'::regclass
    ) then
        alter table public.scenarios
            add constraint scenarios_user_required_for_user_scope_check
            check (visibility_scope <> 'user' or assigned_user_id is not null)
            not valid;
        alter table public.scenarios validate constraint scenarios_user_required_for_user_scope_check;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'scenarios_disc_profile_check'
          and conrelid = 'public.scenarios'::regclass
    ) then
        alter table public.scenarios
            add constraint scenarios_disc_profile_check
            check (
                disc_profile is null
                or disc_profile in ('Dominant', 'Influent', 'Stable', 'Consciencieux')
            )
            not valid;
        alter table public.scenarios validate constraint scenarios_disc_profile_check;
    end if;
end $$;

create index if not exists scenarios_status_active_idx
    on public.scenarios(status, is_active);

create index if not exists scenarios_method_id_idx
    on public.scenarios(method_id);

create index if not exists scenarios_coach_id_idx
    on public.scenarios(coach_id);

create index if not exists scenarios_scorecard_id_idx
    on public.scenarios(scorecard_id);

create index if not exists scenarios_visibility_scope_idx
    on public.scenarios(visibility_scope, organization_id, group_id, assigned_user_id);

create table if not exists public.scenario_quizzes (
    scenario_id uuid not null references public.scenarios(id) on delete cascade,
    quiz_id uuid not null references public.quizzes(id) on delete restrict,
    sort_order integer not null,
    participation text not null default 'optional',
    created_at timestamptz not null default now(),
    primary key (scenario_id, quiz_id),
    constraint scenario_quizzes_sort_order_check check (sort_order >= 1),
    constraint scenario_quizzes_participation_check check (participation in ('optional', 'mandatory')),
    constraint scenario_quizzes_scenario_order_key unique (scenario_id, sort_order)
);

create index if not exists scenario_quizzes_scenario_id_idx
    on public.scenario_quizzes(scenario_id);

create index if not exists scenario_quizzes_quiz_id_idx
    on public.scenario_quizzes(quiz_id);

drop trigger if exists scenarios_set_updated_at on public.scenarios;
create trigger scenarios_set_updated_at
before update on public.scenarios
for each row execute function public.set_updated_at();

alter table public.scenarios enable row level security;
alter table public.scenario_quizzes enable row level security;

revoke all on table public.scenarios from anon, authenticated;
revoke all on table public.scenario_quizzes from anon, authenticated;

grant select on table public.scenarios to anon, authenticated, service_role;
grant insert, update, delete on table public.scenarios to authenticated, service_role;
grant select on table public.scenario_quizzes to anon, authenticated, service_role;
grant insert, update, delete on table public.scenario_quizzes to authenticated, service_role;

drop policy if exists "Public can read scenarios" on public.scenarios;
drop policy if exists "Public can read published scenarios" on public.scenarios;
drop policy if exists "Platform admins can read all scenarios" on public.scenarios;
drop policy if exists "Public can read public published scenarios" on public.scenarios;
create policy "Public can read public published scenarios"
    on public.scenarios
    for select
    to public
    using (
        is_active = true
        and status = 'published'::public.content_status
        and visibility_scope = 'public'
    );

drop policy if exists "Authenticated users can read scoped published scenarios" on public.scenarios;
create policy "Authenticated users can read scoped published scenarios"
    on public.scenarios
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

drop policy if exists "Platform admins can insert scenarios" on public.scenarios;
create policy "Platform admins can insert scenarios"
    on public.scenarios
    for insert
    to authenticated
    with check (private.is_platform_admin());

drop policy if exists "Platform admins can update scenarios" on public.scenarios;
create policy "Platform admins can update scenarios"
    on public.scenarios
    for update
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Platform admins can delete scenarios" on public.scenarios;
create policy "Platform admins can delete scenarios"
    on public.scenarios
    for delete
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Public can read visible scenario quizzes" on public.scenario_quizzes;
create policy "Public can read visible scenario quizzes"
    on public.scenario_quizzes
    for select
    to public
    using (
        exists (
            select 1
            from public.scenarios
            where scenarios.id = scenario_quizzes.scenario_id
        )
    );

drop policy if exists "Platform admins can mutate scenario quizzes" on public.scenario_quizzes;
create policy "Platform admins can mutate scenario quizzes"
    on public.scenario_quizzes
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

comment on table public.scenarios is
    'Roleplay scenarios. Kept as scenarios because sessions already reference this table.';
comment on table public.scenario_quizzes is
    'Many-to-many association between roleplay scenarios and quizzes.';
comment on column public.scenarios.scorecard_id is
    'Optional scorecard used by notation/evaluation for this roleplay.';
comment on column public.scenarios.visibility_scope is
    'Visibility target for roleplays: public, organization, group or user.';

notify pgrst, 'reload schema';
