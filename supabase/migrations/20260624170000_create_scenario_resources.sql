-- Dedicated private bucket and resource table for roleplay scenario files.

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'resource_scenarios',
    'resource_scenarios',
    false,
    262144000,
    array[
        'application/msword',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/mpeg',
        'audio/mp4',
        'audio/ogg',
        'audio/wav',
        'image/jpeg',
        'image/png',
        'image/webp',
        'text/csv',
        'text/markdown',
        'text/plain',
        'text/x-markdown',
        'video/mp4',
        'video/quicktime',
        'video/webm'
    ]::text[]
)
on conflict (id) do update
set
    allowed_mime_types = excluded.allowed_mime_types,
    file_size_limit = excluded.file_size_limit,
    name = excluded.name,
    public = excluded.public;

create table if not exists public.scenario_resources (
    id uuid primary key default gen_random_uuid(),
    scenario_id uuid not null references public.scenarios(id) on delete cascade,
    bucket text,
    path text,
    label text not null,
    resource_type text not null default 'document',
    external_url text,
    sort_order integer not null default 1,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint scenario_resources_resource_type_check
        check (resource_type in ('document', 'image', 'video', 'audio', 'link')),
    constraint scenario_resources_sort_order_check check (sort_order >= 1),
    constraint scenario_resources_location_check check (
        nullif(btrim(coalesce(external_url, '')), '') is not null
        or (
            nullif(btrim(coalesce(bucket, '')), '') is not null
            and nullif(btrim(coalesce(path, '')), '') is not null
        )
    )
);

create unique index if not exists scenario_resources_scenario_order_key
    on public.scenario_resources(scenario_id, sort_order);

create unique index if not exists scenario_resources_scenario_bucket_path_key
    on public.scenario_resources(scenario_id, bucket, path)
    where bucket is not null
      and path is not null;

create index if not exists scenario_resources_scenario_id_idx
    on public.scenario_resources(scenario_id);

drop trigger if exists scenario_resources_set_updated_at on public.scenario_resources;
create trigger scenario_resources_set_updated_at
before update on public.scenario_resources
for each row execute function public.set_updated_at();

alter table public.scenario_resources enable row level security;

revoke all on table public.scenario_resources from anon, authenticated;

grant select on table public.scenario_resources to anon, authenticated, service_role;
grant insert, update, delete on table public.scenario_resources to authenticated, service_role;

drop policy if exists "Public can read public scenario resources" on public.scenario_resources;
create policy "Public can read public scenario resources"
    on public.scenario_resources
    for select
    to public
    using (
        is_active = true
        and exists (
            select 1
            from public.scenarios
            where scenarios.id = scenario_resources.scenario_id
              and scenarios.is_active = true
              and scenarios.status = 'published'::public.content_status
              and scenarios.visibility_scope = 'public'
        )
    );

drop policy if exists "Authenticated users can read scoped scenario resources" on public.scenario_resources;
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
                  )
            )
        )
    );

drop policy if exists "Platform admins can mutate scenario resources" on public.scenario_resources;
create policy "Platform admins can mutate scenario resources"
    on public.scenario_resources
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Public can read public scenario resource files" on storage.objects;
create policy "Public can read public scenario resource files"
    on storage.objects
    for select
    to public
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
              and scenarios.visibility_scope = 'public'
        )
    );

drop policy if exists "Authenticated users can read scoped scenario resource files" on storage.objects;
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
              )
        )
    );

comment on table public.scenario_resources is
    'Files and links attached to roleplay scenarios.';
comment on column public.scenario_resources.bucket is
    'Storage bucket for uploaded scenario resources. Default application bucket is resource_scenarios.';

notify pgrst, 'reload schema';
