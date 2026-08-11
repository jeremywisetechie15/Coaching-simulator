alter table public.personas
    add column if not exists sex_code text,
    add column if not exists pcs_group_code text,
    add column if not exists activity_sector_code text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'personas_sex_code_check'
          and conrelid = 'public.personas'::regclass
    ) then
        alter table public.personas
            add constraint personas_sex_code_check
            check (sex_code is null or sex_code in ('female', 'male'))
            not valid;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'personas_pcs_group_code_check'
          and conrelid = 'public.personas'::regclass
    ) then
        alter table public.personas
            add constraint personas_pcs_group_code_check
            check (pcs_group_code is null or pcs_group_code in ('1', '2', '3', '4', '5', '6', '7', '8'))
            not valid;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'personas_activity_sector_code_check'
          and conrelid = 'public.personas'::regclass
    ) then
        alter table public.personas
            add constraint personas_activity_sector_code_check
            check (
                activity_sector_code is null
                or activity_sector_code in (
                    'AGR', 'EXT', 'IND', 'ENE', 'BTP', 'COM', 'AUT',
                    'TRL', 'THR', 'TIC', 'MED', 'BFA', 'IMM', 'CST',
                    'JUR', 'RDI', 'ADM', 'EDU', 'SAN', 'SAP', 'PUA',
                    'ESS', 'CUL', 'SPO', 'DEF', 'ENV', 'SER', 'INT'
                )
            )
            not valid;
    end if;
end $$;

update public.personas
set activity_sector_code = case industry
    when 'Nettoyage industriel' then 'ADM'
    when 'Restauration' then 'THR'
    when 'Profession libérale santé' then 'SAN'
    when 'Technologie' then 'TIC'
    when 'Services informatiques' then 'TIC'
    when 'Commerce' then 'COM'
    when 'Industrie' then 'IND'
    when 'Conseil' then 'CST'
    when 'Finance' then 'BFA'
    when 'Immobilier' then 'IMM'
    when 'Autre' then 'SER'
    else null
end
where activity_sector_code is null
  and industry is not null;

alter table public.personas validate constraint personas_sex_code_check;
alter table public.personas validate constraint personas_pcs_group_code_check;
alter table public.personas validate constraint personas_activity_sector_code_check;

comment on column public.personas.sex_code is
    'Optional stable persona sex code: female or male.';
comment on column public.personas.pcs_group_code is
    'Optional aggregated PCS 2003 group code from 1 to 8.';
comment on column public.personas.activity_sector_code is
    'Stable activity-sector code shared with profiles and roleplays.';
comment on column public.personas.industry is
    'Deprecated legacy persona activity-sector label. Use activity_sector_code.';
