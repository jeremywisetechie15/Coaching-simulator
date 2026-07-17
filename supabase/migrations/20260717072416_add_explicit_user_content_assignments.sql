create table if not exists public.scenario_user_assignments (
    scenario_id uuid not null references public.scenarios(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    assigned_by uuid references public.profiles(id) on delete set null,
    assigned_at timestamptz not null default now(),
    primary key (scenario_id, user_id)
);

create table if not exists public.quiz_user_assignments (
    quiz_id uuid not null references public.quizzes(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    assigned_by uuid references public.profiles(id) on delete set null,
    assigned_at timestamptz not null default now(),
    primary key (quiz_id, user_id)
);

create index if not exists scenario_user_assignments_user_id_idx
    on public.scenario_user_assignments(user_id, assigned_at desc);
create index if not exists scenario_user_assignments_assigned_by_idx
    on public.scenario_user_assignments(assigned_by)
    where assigned_by is not null;

create index if not exists quiz_user_assignments_user_id_idx
    on public.quiz_user_assignments(user_id, assigned_at desc);
create index if not exists quiz_user_assignments_assigned_by_idx
    on public.quiz_user_assignments(assigned_by)
    where assigned_by is not null;

alter table public.scenario_user_assignments enable row level security;
alter table public.quiz_user_assignments enable row level security;

revoke all on table public.scenario_user_assignments from public, anon, authenticated;
revoke all on table public.quiz_user_assignments from public, anon, authenticated;

grant select, insert, delete on table public.scenario_user_assignments to service_role;
grant select, insert, delete on table public.quiz_user_assignments to service_role;

drop policy if exists "Users can read their scenario assignments"
    on public.scenario_user_assignments;

drop policy if exists "Users can read their quiz assignments"
    on public.quiz_user_assignments;

create or replace function private.has_scenario_user_assignment(
    p_scenario_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select (select auth.uid()) is not null and exists (
        select 1
        from public.scenario_user_assignments assignment
        where assignment.scenario_id = p_scenario_id
          and assignment.user_id = (select auth.uid())
    );
$$;

create or replace function private.has_quiz_user_assignment(
    p_quiz_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select (select auth.uid()) is not null and (
        exists (
            select 1
            from public.quiz_user_assignments assignment
            where assignment.quiz_id = p_quiz_id
              and assignment.user_id = (select auth.uid())
        )
        or exists (
            select 1
            from public.scenario_quizzes scenario_quiz
            join public.scenario_user_assignments assignment
              on assignment.scenario_id = scenario_quiz.scenario_id
            join public.scenarios scenario
              on scenario.id = scenario_quiz.scenario_id
            where scenario_quiz.quiz_id = p_quiz_id
              and assignment.user_id = (select auth.uid())
              and scenario.is_active = true
              and scenario.status = 'published'::public.content_status
        )
        or exists (
            select 1
            from public.scenario_user_assignments assignment
            join public.scenarios scenario
              on scenario.id = assignment.scenario_id
            join public.quizzes method_quiz
              on method_quiz.id = p_quiz_id
             and method_quiz.method_id = scenario.method_id
             and method_quiz.quiz_kind = 'method_knowledge'
            where assignment.user_id = (select auth.uid())
              and scenario.is_active = true
              and scenario.status = 'published'::public.content_status
              and method_quiz.is_active = true
              and method_quiz.status = 'published'::public.content_status
        )
    );
$$;

revoke all on function private.has_scenario_user_assignment(uuid) from public;
revoke all on function private.has_quiz_user_assignment(uuid) from public;
grant execute on function private.has_scenario_user_assignment(uuid) to authenticated, service_role;
grant execute on function private.has_quiz_user_assignment(uuid) to authenticated, service_role;

drop policy if exists "Authenticated users can read scoped published scenarios"
    on public.scenarios;
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
                or private.has_scenario_user_assignment(id)
            )
        )
    );

drop policy if exists "Authenticated users can read scoped published quizzes"
    on public.quizzes;
create policy "Authenticated users can read scoped published quizzes"
    on public.quizzes
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
                or private.has_quiz_user_assignment(id)
            )
        )
    );

drop policy if exists "Authenticated users can read scoped scenario resources"
    on public.scenario_resources;
create policy "Authenticated users can read scoped scenario resources"
    on public.scenario_resources
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or (
            is_active = true
            and exists (
                select 1
                from public.scenarios
                where scenarios.id = scenario_resources.scenario_id
                  and scenarios.is_active = true
                  and scenarios.status = 'published'::public.content_status
                  and (
                      scenarios.visibility_scope = 'public'
                      or (
                          scenarios.visibility_scope = 'organization'
                          and scenarios.organization_id is not null
                          and private.has_active_organization_membership(scenarios.organization_id)
                      )
                      or (
                          scenarios.visibility_scope = 'group'
                          and scenarios.group_id is not null
                          and private.can_read_group(scenarios.group_id)
                      )
                      or (
                          scenarios.visibility_scope = 'user'
                          and scenarios.assigned_user_id = (select auth.uid())
                      )
                      or private.has_scenario_user_assignment(scenarios.id)
                  )
            )
        )
    );

drop policy if exists "Authenticated users can read scoped scenario resource files"
    on storage.objects;
create policy "Authenticated users can read scoped scenario resource files"
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'resource_scenarios'
        and exists (
            select 1
            from public.scenario_resources
            join public.scenarios on scenarios.id = scenario_resources.scenario_id
            where scenario_resources.bucket = storage.objects.bucket_id
              and scenario_resources.path = storage.objects.name
              and scenario_resources.is_active = true
              and scenarios.is_active = true
              and scenarios.status = 'published'::public.content_status
              and (
                  private.is_platform_admin()
                  or scenarios.visibility_scope = 'public'
                  or (
                      scenarios.visibility_scope = 'organization'
                      and scenarios.organization_id is not null
                      and private.has_active_organization_membership(scenarios.organization_id)
                  )
                  or (
                      scenarios.visibility_scope = 'group'
                      and scenarios.group_id is not null
                      and private.can_read_group(scenarios.group_id)
                  )
                  or (
                      scenarios.visibility_scope = 'user'
                      and scenarios.assigned_user_id = (select auth.uid())
                  )
                  or private.has_scenario_user_assignment(scenarios.id)
              )
        )
    );

comment on table public.scenario_user_assignments is
    'Explicit many-to-many roleplay assignments. They grant access without changing the scenario base visibility.';
comment on table public.quiz_user_assignments is
    'Explicit many-to-many quiz assignments. Quizzes linked to an explicitly assigned scenario are also accessible.';

notify pgrst, 'reload schema';
