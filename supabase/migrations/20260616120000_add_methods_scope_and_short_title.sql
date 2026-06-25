-- Add organization-aware visibility to learning methods and compact step titles.
-- This intentionally does not touch notation_methods: notation remains a separate bounded context.

alter table public.methods
    add column if not exists domain text,
    add column if not exists scope text not null default 'public',
    add column if not exists organization_id uuid references public.organizations(id) on delete restrict;

alter table public.method_steps
    add column if not exists short_title text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'methods_scope_check'
          and conrelid = 'public.methods'::regclass
    ) then
        alter table public.methods
            add constraint methods_scope_check
            check (scope in ('public', 'organization')) not valid;
        alter table public.methods validate constraint methods_scope_check;
    end if;
end $$;

create index if not exists methods_scope_status_idx
    on public.methods(scope, status, is_active);

create index if not exists methods_organization_id_idx
    on public.methods(organization_id);

comment on column public.methods.domain is
    'Business domain used to classify a learning method independently from its category.';
comment on column public.methods.scope is
    'Visibility scope for learning methods: public Maia Coach content or organization-private content.';
comment on column public.methods.organization_id is
    'Organization owning the method when scope = organization.';
comment on column public.method_steps.short_title is
    'Short display title for compact method step summaries.';

drop policy if exists "Authenticated users can read active methods" on public.methods;
drop policy if exists "Authenticated users can read published active methods" on public.methods;
drop policy if exists "Authenticated users can read scoped published methods" on public.methods;

create policy "Authenticated users can read scoped published methods"
    on public.methods
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or (
            is_active = true
            and status = 'published'::public.content_status
            and (
                scope = 'public'
                or (
                    scope = 'organization'
                    and organization_id is not null
                    and private.has_active_organization_membership(organization_id)
                )
            )
        )
    );

drop policy if exists "Authenticated users can read active method steps" on public.method_steps;
drop policy if exists "Authenticated users can read published method steps" on public.method_steps;
drop policy if exists "Authenticated users can read scoped published method steps" on public.method_steps;

create policy "Authenticated users can read scoped published method steps"
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
              and (
                  methods.scope = 'public'
                  or (
                      methods.scope = 'organization'
                      and methods.organization_id is not null
                      and private.has_active_organization_membership(methods.organization_id)
                  )
              )
        )
    );

drop policy if exists "Authenticated users can read active method resources" on public.method_resources;
drop policy if exists "Authenticated users can read published method resources" on public.method_resources;
drop policy if exists "Authenticated users can read scoped published method resources" on public.method_resources;

create policy "Authenticated users can read scoped published method resources"
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
                  and (
                      methods.scope = 'public'
                      or (
                          methods.scope = 'organization'
                          and methods.organization_id is not null
                          and private.has_active_organization_membership(methods.organization_id)
                      )
                  )
            )
        )
    );

notify pgrst, 'reload schema';
