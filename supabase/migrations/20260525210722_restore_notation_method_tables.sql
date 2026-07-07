-- Restore notation as its own bounded context and keep learning methods separate.
-- The preceding migration copied the notation records into generic method tables;
-- this migration preserves those generic records and recreates physical notation tables.
begin;

drop trigger if exists scenarios_sync_method_ids on public.scenarios;
drop function if exists public.sync_scenario_method_ids();

alter table public.scenarios
    drop constraint if exists scenarios_notation_method_id_fkey;

drop view if exists public.notation_method_files;
drop view if exists public.notation_method_steps;
drop view if exists public.notation_methods;

create table public.notation_methods (
    id uuid primary key default gen_random_uuid(),
    code text not null,
    name text not null,
    version text not null default 'v1',
    description text,
    is_active boolean not null default true,
    is_default boolean not null default false,
    prompt_synthese_id uuid references public.prompts(id) on delete set null,
    prompt_methodo_id uuid references public.prompts(id) on delete set null,
    prompt_discours_id uuid references public.prompts(id) on delete set null,
    prompt_transcription_id uuid references public.prompts(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint notation_methods_code_version_key unique (code, version)
);

insert into public.notation_methods (
    id,
    code,
    name,
    version,
    description,
    is_active,
    is_default,
    prompt_synthese_id,
    prompt_methodo_id,
    prompt_discours_id,
    prompt_transcription_id,
    created_at,
    updated_at
)
select
    id,
    code,
    name,
    version,
    description,
    is_active,
    is_default,
    prompt_synthese_id,
    prompt_methodo_id,
    prompt_discours_id,
    prompt_transcription_id,
    created_at,
    updated_at
from public.methods;

create unique index notation_methods_one_default_idx
    on public.notation_methods (is_default)
    where is_default = true;

create table public.notation_method_steps (
    id uuid primary key default gen_random_uuid(),
    method_id uuid not null references public.notation_methods(id) on delete cascade,
    step_order integer not null check (step_order > 0),
    step_key text not null,
    code text not null,
    title text not null,
    weight numeric(6, 5) not null check (weight >= 0 and weight <= 1),
    aliases text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint notation_method_steps_method_order_key unique (method_id, step_order),
    constraint notation_method_steps_method_step_key unique (method_id, step_key)
);

insert into public.notation_method_steps (
    id,
    method_id,
    step_order,
    step_key,
    code,
    title,
    weight,
    aliases,
    created_at,
    updated_at
)
select
    id,
    method_id,
    step_order,
    step_key,
    code,
    title,
    weight,
    aliases,
    created_at,
    updated_at
from public.method_steps;

create index notation_method_steps_method_id_idx
    on public.notation_method_steps(method_id);

create table public.notation_method_files (
    id uuid primary key default gen_random_uuid(),
    method_id uuid not null references public.notation_methods(id) on delete cascade,
    bucket text not null,
    path text not null,
    label text,
    file_type text not null default 'pdf',
    sort_order integer not null default 1,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint notation_method_files_method_bucket_path_key unique (method_id, bucket, path)
);

insert into public.notation_method_files (
    id,
    method_id,
    bucket,
    path,
    label,
    file_type,
    sort_order,
    is_active,
    created_at,
    updated_at
)
select
    id,
    method_id,
    bucket,
    path,
    label,
    resource_type,
    sort_order,
    is_active,
    created_at,
    updated_at
from public.method_resources
where bucket is not null
  and path is not null;

create index notation_method_files_method_id_idx
    on public.notation_method_files(method_id);

alter table public.notation_methods enable row level security;
alter table public.notation_method_steps enable row level security;
alter table public.notation_method_files enable row level security;

grant select on table public.notation_methods to authenticated;
grant select on table public.notation_method_steps to authenticated;
grant select on table public.notation_method_files to authenticated;

grant select, insert, update, delete on table public.notation_methods to service_role;
grant select, insert, update, delete on table public.notation_method_steps to service_role;
grant select, insert, update, delete on table public.notation_method_files to service_role;

create policy "Authenticated users can read active notation methods"
    on public.notation_methods
    for select
    to authenticated
    using (is_active = true);

create policy "Authenticated users can read active notation method steps"
    on public.notation_method_steps
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.notation_methods
            where notation_methods.id = notation_method_steps.method_id
              and notation_methods.is_active = true
        )
    );

create policy "Authenticated users can read active notation method files"
    on public.notation_method_files
    for select
    to authenticated
    using (
        is_active = true
        and exists (
            select 1
            from public.notation_methods
            where notation_methods.id = notation_method_files.method_id
              and notation_methods.is_active = true
        )
    );

alter table public.methods
    add column notation_method_id uuid;
update public.methods
set notation_method_id = id
where exists (
    select 1
    from public.notation_methods
    where notation_methods.id = methods.id
);
alter table public.methods
    add constraint methods_notation_method_id_fkey
    foreign key (notation_method_id)
    references public.notation_methods(id)
    on delete set null
    not valid;
alter table public.methods validate constraint methods_notation_method_id_fkey;
create index methods_notation_method_id_idx on public.methods(notation_method_id);

alter table public.method_steps
    add column notation_step_id uuid,
    alter column step_key drop not null,
    alter column code drop not null,
    alter column weight drop not null;
update public.method_steps
set notation_step_id = id
where exists (
    select 1
    from public.notation_method_steps
    where notation_method_steps.id = method_steps.id
);
alter table public.method_steps
    add constraint method_steps_notation_step_id_fkey
    foreign key (notation_step_id)
    references public.notation_method_steps(id)
    on delete set null
    not valid;
alter table public.method_steps validate constraint method_steps_notation_step_id_fkey;
create index method_steps_notation_step_id_idx on public.method_steps(notation_step_id);

alter table public.method_resources
    add column notation_file_id uuid;
update public.method_resources
set notation_file_id = id
where exists (
    select 1
    from public.notation_method_files
    where notation_method_files.id = method_resources.id
);
alter table public.method_resources
    add constraint method_resources_notation_file_id_fkey
    foreign key (notation_file_id)
    references public.notation_method_files(id)
    on delete set null
    not valid;
alter table public.method_resources validate constraint method_resources_notation_file_id_fkey;
create index method_resources_notation_file_id_idx on public.method_resources(notation_file_id);

alter table public.scenarios
    add constraint scenarios_notation_method_id_fkey
    foreign key (notation_method_id)
    references public.notation_methods(id)
    on delete set null
    not valid;
alter table public.scenarios validate constraint scenarios_notation_method_id_fkey;

comment on column public.methods.notation_method_id is
    'Optional scoring configuration used when a learning method is evaluated.';
comment on column public.scenarios.notation_method_id is
    'Notation configuration used for evaluation of the scenario.';

commit;
