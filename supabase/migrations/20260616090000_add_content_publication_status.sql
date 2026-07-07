do $$
begin
    create type public.content_status as enum ('draft', 'published', 'archived');
exception
    when duplicate_object then null;
end $$;

grant usage on type public.content_status to anon, authenticated, service_role;

alter table public.scenarios
    add column if not exists status public.content_status;
alter table public.personas
    add column if not exists status public.content_status;
alter table public.coaches
    add column if not exists status public.content_status;
alter table public.methods
    add column if not exists status public.content_status;
alter table public.notation_methods
    add column if not exists status public.content_status;
alter table public.prompts
    add column if not exists status public.content_status;
alter table public.notation_output_schemas
    add column if not exists status public.content_status;

update public.scenarios set status = 'published'::public.content_status where status is null;
update public.personas set status = 'published'::public.content_status where status is null;
update public.coaches set status = 'published'::public.content_status where status is null;
update public.methods set status = 'published'::public.content_status where status is null;
update public.notation_methods set status = 'published'::public.content_status where status is null;
update public.prompts set status = 'published'::public.content_status where status is null;
update public.notation_output_schemas set status = 'published'::public.content_status where status is null;

alter table public.scenarios
    alter column status set default 'draft'::public.content_status,
    alter column status set not null;
alter table public.personas
    alter column status set default 'draft'::public.content_status,
    alter column status set not null;
alter table public.coaches
    alter column status set default 'draft'::public.content_status,
    alter column status set not null;
alter table public.methods
    alter column status set default 'draft'::public.content_status,
    alter column status set not null;
alter table public.notation_methods
    alter column status set default 'draft'::public.content_status,
    alter column status set not null;
alter table public.prompts
    alter column status set default 'draft'::public.content_status,
    alter column status set not null;
alter table public.notation_output_schemas
    alter column status set default 'draft'::public.content_status,
    alter column status set not null;

comment on type public.content_status is
    'Publication lifecycle for admin-managed content: draft, published, archived.';
comment on column public.scenarios.status is
    'Publication status for roleplay scenarios.';
comment on column public.personas.status is
    'Publication status for personas used by scenarios.';
comment on column public.coaches.status is
    'Publication status for AI coaches.';
comment on column public.methods.status is
    'Publication status for learning methods and playbooks.';
comment on column public.notation_methods.status is
    'Publication status for notation methods.';
comment on column public.prompts.status is
    'Publication status for admin-managed prompts.';
comment on column public.notation_output_schemas.status is
    'Publication status for notation output schemas.';

drop policy if exists "Public can read scenarios" on public.scenarios;
drop policy if exists "Public can read published scenarios" on public.scenarios;
drop policy if exists "Platform admins can read all scenarios" on public.scenarios;
create policy "Public can read published scenarios"
    on public.scenarios
    for select
    to public
    using (status = 'published'::public.content_status);
create policy "Platform admins can read all scenarios"
    on public.scenarios
    for select
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Public can read personas" on public.personas;
drop policy if exists "Public can read published personas" on public.personas;
drop policy if exists "Platform admins can read all personas" on public.personas;
create policy "Public can read published personas"
    on public.personas
    for select
    to public
    using (status = 'published'::public.content_status);
create policy "Platform admins can read all personas"
    on public.personas
    for select
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Coaches are viewable by everyone" on public.coaches;
drop policy if exists "Public can read published coaches" on public.coaches;
drop policy if exists "Platform admins can read all coaches" on public.coaches;
create policy "Public can read published coaches"
    on public.coaches
    for select
    to public
    using (status = 'published'::public.content_status);
create policy "Platform admins can read all coaches"
    on public.coaches
    for select
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Authenticated users can read prompts" on public.prompts;
drop policy if exists "Authenticated users can read published prompts" on public.prompts;
create policy "Authenticated users can read published prompts"
    on public.prompts
    for select
    to authenticated
    using (
        status = 'published'::public.content_status
        or private.is_platform_admin()
    );

drop policy if exists "Authenticated users can read active methods" on public.methods;
drop policy if exists "Authenticated users can read published active methods" on public.methods;
create policy "Authenticated users can read published active methods"
    on public.methods
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or (
            is_active = true
            and status = 'published'::public.content_status
        )
    );

drop policy if exists "Authenticated users can read active method steps" on public.method_steps;
drop policy if exists "Authenticated users can read published method steps" on public.method_steps;
create policy "Authenticated users can read published method steps"
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
              and methods.status = 'published'::public.content_status
        )
    );

drop policy if exists "Authenticated users can read active method resources" on public.method_resources;
drop policy if exists "Authenticated users can read published method resources" on public.method_resources;
create policy "Authenticated users can read published method resources"
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
                  and methods.status = 'published'::public.content_status
            )
        )
    );

drop policy if exists "Authenticated users can read active notation methods" on public.notation_methods;
drop policy if exists "Authenticated users can read published active notation methods" on public.notation_methods;
create policy "Authenticated users can read published active notation methods"
    on public.notation_methods
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or (
            is_active = true
            and status = 'published'::public.content_status
        )
    );

drop policy if exists "Authenticated users can read active notation method steps" on public.notation_method_steps;
drop policy if exists "Authenticated users can read published notation method steps" on public.notation_method_steps;
create policy "Authenticated users can read published notation method steps"
    on public.notation_method_steps
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or exists (
            select 1
            from public.notation_methods
            where notation_methods.id = notation_method_steps.method_id
              and notation_methods.is_active = true
              and notation_methods.status = 'published'::public.content_status
        )
    );

drop policy if exists "Authenticated users can read active notation method files" on public.notation_method_files;
drop policy if exists "Authenticated users can read published notation method files" on public.notation_method_files;
create policy "Authenticated users can read published notation method files"
    on public.notation_method_files
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or (
            is_active = true
            and exists (
                select 1
                from public.notation_methods
                where notation_methods.id = notation_method_files.method_id
                  and notation_methods.is_active = true
                  and notation_methods.status = 'published'::public.content_status
            )
        )
    );

drop policy if exists "Authenticated users can read active notation output schemas" on public.notation_output_schemas;
drop policy if exists "Authenticated users can read published active notation output schemas" on public.notation_output_schemas;
create policy "Authenticated users can read published active notation output schemas"
    on public.notation_output_schemas
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or (
            is_active = true
            and status = 'published'::public.content_status
        )
    );
