alter table public.profiles
    add column if not exists activity_sector_code text;

comment on column public.profiles.activity_sector_code is
    'Stable code of the user activity sector; labels are defined by the application catalog.';

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'profiles_activity_sector_code_check'
          and conrelid = 'public.profiles'::regclass
    ) then
        alter table public.profiles
            add constraint profiles_activity_sector_code_check
            check (
                activity_sector_code is null
                or activity_sector_code in (
                    'AGR', 'EXT', 'IND', 'ENE', 'BTP', 'COM', 'AUT',
                    'TRL', 'THR', 'TIC', 'MED', 'BFA', 'IMM', 'CST',
                    'JUR', 'RDI', 'ADM', 'EDU', 'SAN', 'SAP', 'PUA',
                    'ESS', 'CUL', 'SPO', 'DEF', 'ENV', 'SER', 'INT'
                )
            ) not valid;
    end if;
end
$$;

alter table public.profiles
    validate constraint profiles_activity_sector_code_check;

grant update (activity_sector_code)
on table public.profiles
to authenticated;
