alter table public.personas
    add column if not exists age integer,
    add column if not exists industry text,
    add column if not exists employee_count integer,
    add column if not exists annual_revenue text,
    add column if not exists company_description text,
    add column if not exists disc_profile text,
    add column if not exists children_count integer,
    add column if not exists diploma text,
    add column if not exists marital_status text,
    add column if not exists nationality text,
    add column if not exists residence_country text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'personas_age_check'
          and conrelid = 'public.personas'::regclass
    ) then
        alter table public.personas
            add constraint personas_age_check
            check (age is null or (age >= 0 and age <= 130))
            not valid;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'personas_employee_count_check'
          and conrelid = 'public.personas'::regclass
    ) then
        alter table public.personas
            add constraint personas_employee_count_check
            check (employee_count is null or employee_count >= 0)
            not valid;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'personas_children_count_check'
          and conrelid = 'public.personas'::regclass
    ) then
        alter table public.personas
            add constraint personas_children_count_check
            check (children_count is null or children_count >= 0)
            not valid;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'personas_disc_profile_check'
          and conrelid = 'public.personas'::regclass
    ) then
        alter table public.personas
            add constraint personas_disc_profile_check
            check (
                disc_profile is null
                or disc_profile in ('Dominant', 'Influent', 'Stable', 'Consciencieux', 'Inconnu')
            )
            not valid;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'personas_industry_check'
          and conrelid = 'public.personas'::regclass
    ) then
        alter table public.personas
            add constraint personas_industry_check
            check (
                industry is null
                or industry in (
                    'Nettoyage industriel',
                    'Restauration',
                    'Profession libérale santé',
                    'Technologie',
                    'Services informatiques',
                    'Commerce',
                    'Industrie',
                    'Conseil',
                    'Finance',
                    'Immobilier',
                    'Autre'
                )
            )
            not valid;
    end if;
end $$;

alter table public.personas validate constraint personas_age_check;
alter table public.personas validate constraint personas_employee_count_check;
alter table public.personas validate constraint personas_children_count_check;
alter table public.personas validate constraint personas_disc_profile_check;
alter table public.personas validate constraint personas_industry_check;

comment on column public.personas.age is
    'Persona age used to enrich roleplay context.';
comment on column public.personas.industry is
    'Business sector for the persona company.';
comment on column public.personas.employee_count is
    'Approximate employee count for the persona company.';
comment on column public.personas.annual_revenue is
    'Free-text annual revenue for the persona company.';
comment on column public.personas.company_description is
    'Free-text company description for the persona.';
comment on column public.personas.disc_profile is
    'DISC profile for persona behavior: Dominant, Influent, Stable, Consciencieux or Inconnu.';
comment on column public.personas.children_count is
    'Persona number of children.';
comment on column public.personas.diploma is
    'Persona diploma or education.';
comment on column public.personas.marital_status is
    'Persona marital status.';
comment on column public.personas.nationality is
    'Persona nationality.';
comment on column public.personas.residence_country is
    'Persona country of residence.';
