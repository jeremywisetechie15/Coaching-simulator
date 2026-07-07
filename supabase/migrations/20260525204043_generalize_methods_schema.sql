-- Generalize notation methods so the same records can power learning content and scoring.
alter table public.notation_methods rename to methods;
alter table public.notation_method_steps rename to method_steps;
alter table public.notation_method_files rename to method_resources;

alter table public.methods rename constraint notation_methods_pkey to methods_pkey;
alter table public.methods rename constraint notation_methods_code_version_key to methods_code_version_key;
alter table public.methods rename constraint notation_methods_prompt_synthese_id_fkey to methods_prompt_synthese_id_fkey;
alter table public.methods rename constraint notation_methods_prompt_methodo_id_fkey to methods_prompt_methodo_id_fkey;
alter table public.methods rename constraint notation_methods_prompt_discours_id_fkey to methods_prompt_discours_id_fkey;
alter table public.methods rename constraint notation_methods_prompt_transcription_id_fkey to methods_prompt_transcription_id_fkey;
alter index public.notation_methods_one_default_idx rename to methods_one_default_idx;

alter table public.method_steps rename constraint notation_method_steps_pkey to method_steps_pkey;
alter table public.method_steps rename constraint notation_method_steps_method_id_fkey to method_steps_method_id_fkey;
alter table public.method_steps rename constraint notation_method_steps_method_order_key to method_steps_method_order_key;
alter table public.method_steps rename constraint notation_method_steps_method_step_key to method_steps_method_step_key;
alter table public.method_steps rename constraint notation_method_steps_weight_check to method_steps_weight_check;
alter index public.notation_method_steps_method_id_idx rename to method_steps_method_id_idx;

alter table public.method_resources rename constraint notation_method_files_pkey to method_resources_pkey;
alter table public.method_resources rename constraint notation_method_files_method_id_fkey to method_resources_method_id_fkey;
alter table public.method_resources rename constraint notation_method_files_method_bucket_path_key to method_resources_method_bucket_path_key;
alter index public.notation_method_files_method_id_idx rename to method_resources_method_id_idx;

do $$
begin
    if exists (
        select 1 from pg_policies
        where schemaname = 'public'
            and tablename = 'methods'
            and policyname = 'Authenticated users can read active notation methods'
    ) then
        alter policy "Authenticated users can read active notation methods"
            on public.methods rename to "Authenticated users can read active methods";
    end if;

    if exists (
        select 1 from pg_policies
        where schemaname = 'public'
            and tablename = 'method_steps'
            and policyname = 'Authenticated users can read active notation method steps'
    ) then
        alter policy "Authenticated users can read active notation method steps"
            on public.method_steps rename to "Authenticated users can read active method steps";
    end if;

    if exists (
        select 1 from pg_policies
        where schemaname = 'public'
            and tablename = 'method_resources'
            and policyname = 'Authenticated users can read active notation method files'
    ) then
        alter policy "Authenticated users can read active notation method files"
            on public.method_resources rename to "Authenticated users can read active method resources";
    end if;
end $$;

alter table public.methods
    add column subtitle text,
    add column category text,
    add column tag text,
    add column reading_time_minutes integer,
    add column business_objective text,
    add column objectives text[] not null default '{}',
    add column challenges text[] not null default '{}',
    add column created_by uuid references public.profiles(id) on delete set null;

alter table public.methods
    add constraint methods_reading_time_minutes_check
    check (reading_time_minutes is null or reading_time_minutes >= 0) not valid;
alter table public.methods validate constraint methods_reading_time_minutes_check;

alter table public.method_steps
    drop constraint notation_method_steps_step_order_check,
    add column summary text,
    add column icon text,
    add column takeaway text,
    add column objectives text[] not null default '{}',
    add column best_practices text[] not null default '{}',
    add column pitfalls text[] not null default '{}',
    add column posture text[] not null default '{}',
    add column verbatims text[] not null default '{}';

alter table public.method_steps
    add constraint method_steps_step_order_check check (step_order > 0) not valid,
    add constraint method_steps_icon_check
        check (icon is null or icon = any (array['phone', 'message', 'shield', 'check'])) not valid;
alter table public.method_steps validate constraint method_steps_step_order_check;
alter table public.method_steps validate constraint method_steps_icon_check;

alter table public.method_resources
    rename column file_type to resource_type;
alter table public.method_resources
    alter column bucket drop not null,
    alter column path drop not null,
    add column step_id uuid references public.method_steps(id) on delete cascade,
    add column external_url text,
    add column duration_seconds integer;

alter table public.method_resources
    add constraint method_resources_location_check
        check ((bucket is not null and path is not null) or external_url is not null) not valid,
    add constraint method_resources_duration_seconds_check
        check (duration_seconds is null or duration_seconds >= 0) not valid;
alter table public.method_resources validate constraint method_resources_location_check;
alter table public.method_resources validate constraint method_resources_duration_seconds_check;

-- Keep the historical scenario column synchronized while older app revisions are still running.
alter table public.scenarios
    add column method_id uuid;
update public.scenarios
set method_id = notation_method_id
where method_id is null;
alter table public.scenarios
    add constraint scenarios_method_id_fkey
    foreign key (method_id) references public.methods(id) on delete set null not valid;
alter table public.scenarios validate constraint scenarios_method_id_fkey;
create index scenarios_method_id_idx on public.scenarios(method_id);

create function public.sync_scenario_method_ids()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op = 'INSERT' then
        if new.method_id is null then
            new.method_id := new.notation_method_id;
        else
            new.notation_method_id := new.method_id;
        end if;
    elsif new.method_id is distinct from old.method_id then
        new.notation_method_id := new.method_id;
    elsif new.notation_method_id is distinct from old.notation_method_id then
        new.method_id := new.notation_method_id;
    end if;

    return new;
end;
$$;

create trigger scenarios_sync_method_ids
before insert or update of method_id, notation_method_id
on public.scenarios
for each row execute function public.sync_scenario_method_ids();

comment on column public.scenarios.notation_method_id is
    'Compatibility column synchronized with method_id during the generic methods migration.';

-- Compatibility views keep already deployed API revisions functional during rollout.
create view public.notation_methods
with (security_invoker = true)
as
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

create view public.notation_method_steps
with (security_invoker = true)
as
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

create view public.notation_method_files
with (security_invoker = true)
as
select
    id,
    method_id,
    bucket,
    path,
    label,
    resource_type as file_type,
    sort_order,
    is_active,
    created_at,
    updated_at
from public.method_resources;

grant select on public.notation_methods, public.notation_method_steps, public.notation_method_files
    to authenticated, service_role;
