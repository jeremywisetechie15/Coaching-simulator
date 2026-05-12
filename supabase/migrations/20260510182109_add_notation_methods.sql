create table if not exists public.notation_methods (
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

create unique index if not exists notation_methods_one_default_idx
  on public.notation_methods (is_default)
  where is_default = true;

create table if not exists public.notation_method_steps (
  id uuid primary key default gen_random_uuid(),
  method_id uuid not null references public.notation_methods(id) on delete cascade,
  step_order integer not null check (step_order between 1 and 4),
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

create table if not exists public.notation_method_files (
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

alter table public.scenarios
  add column if not exists notation_method_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scenarios_notation_method_id_fkey'
      and conrelid = 'public.scenarios'::regclass
  ) then
    alter table public.scenarios
      add constraint scenarios_notation_method_id_fkey
      foreign key (notation_method_id)
      references public.notation_methods(id)
      on delete set null
      not valid;
  end if;
end $$;

alter table public.scenarios
  validate constraint scenarios_notation_method_id_fkey;

create index if not exists notation_method_steps_method_id_idx
  on public.notation_method_steps(method_id);

create index if not exists notation_method_files_method_id_idx
  on public.notation_method_files(method_id);

create index if not exists scenarios_notation_method_id_idx
  on public.scenarios(notation_method_id);

alter table public.notation_methods enable row level security;
alter table public.notation_method_steps enable row level security;
alter table public.notation_method_files enable row level security;

grant select on table public.notation_methods to authenticated;
grant select on table public.notation_method_steps to authenticated;
grant select on table public.notation_method_files to authenticated;

grant select, insert, update, delete on table public.notation_methods to service_role;
grant select, insert, update, delete on table public.notation_method_steps to service_role;
grant select, insert, update, delete on table public.notation_method_files to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notation_methods'
      and policyname = 'Authenticated users can read active notation methods'
  ) then
    create policy "Authenticated users can read active notation methods"
      on public.notation_methods
      for select
      to authenticated
      using (is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notation_method_steps'
      and policyname = 'Authenticated users can read active notation method steps'
  ) then
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
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notation_method_files'
      and policyname = 'Authenticated users can read active notation method files'
  ) then
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
  end if;
end $$;

with prompt_ids as (
  select
    (
      select id
      from public.prompts
      where title = 'notation.synthese'
      order by created_at desc nulls last
      limit 1
    ) as synthese_id,
    (
      select id
      from public.prompts
      where title = 'notation.methodo'
      order by created_at desc nulls last
      limit 1
    ) as methodo_id,
    (
      select id
      from public.prompts
      where title = 'notation.discours'
      order by created_at desc nulls last
      limit 1
    ) as discours_id,
    (
      select id
      from public.prompts
      where title = 'notation.transcription'
      order by created_at desc nulls last
      limit 1
    ) as transcription_id
),
method_upsert as (
  insert into public.notation_methods (
    code,
    name,
    version,
    description,
    is_active,
    is_default,
    prompt_synthese_id,
    prompt_methodo_id,
    prompt_discours_id,
    prompt_transcription_id
  )
  select
    'acdc',
    'Methode AC/DC',
    'v1',
    'Methode actuelle Accueillir, Cadrer, Decouvrir, Confirmer',
    true,
    true,
    synthese_id,
    methodo_id,
    discours_id,
    transcription_id
  from prompt_ids
  on conflict (code, version) do update set
    name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active,
    is_default = excluded.is_default,
    prompt_synthese_id = excluded.prompt_synthese_id,
    prompt_methodo_id = excluded.prompt_methodo_id,
    prompt_discours_id = excluded.prompt_discours_id,
    prompt_transcription_id = excluded.prompt_transcription_id,
    updated_at = now()
  returning id
)
insert into public.notation_method_steps (
  method_id,
  step_order,
  step_key,
  code,
  title,
  weight,
  aliases
)
select id, 1, 'accueillir', 'A', 'Accueillir', 0.07, array['accueillir', 'accueil'] from method_upsert
union all
select id, 2, 'cadrer', 'C', 'Cadrer', 0.08, array['cadrer', 'cadrage'] from method_upsert
union all
select id, 3, 'decouvrir', 'D', 'Decouvrir', 0.70, array['decouvrir', 'decouverte'] from method_upsert
union all
select id, 4, 'confirmer', 'C', 'Confirmer', 0.15, array['confirmer', 'confirmation'] from method_upsert
on conflict (method_id, step_order) do update set
  step_key = excluded.step_key,
  code = excluded.code,
  title = excluded.title,
  weight = excluded.weight,
  aliases = excluded.aliases,
  updated_at = now();

with method as (
  select id
  from public.notation_methods
  where code = 'acdc'
    and version = 'v1'
)
insert into public.notation_method_files (
  method_id,
  bucket,
  path,
  label,
  file_type,
  sort_order,
  is_active
)
select
  id,
  'notation_pdf',
  'criteres_v1.pdf',
  'Criteres AC/DC v1',
  'pdf',
  1,
  true
from method
on conflict (method_id, bucket, path) do update set
  label = excluded.label,
  file_type = excluded.file_type,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

update public.scenarios
set notation_method_id = notation_methods.id
from public.notation_methods
where notation_methods.code = 'acdc'
  and notation_methods.version = 'v1'
  and scenarios.notation_method_id is null;
