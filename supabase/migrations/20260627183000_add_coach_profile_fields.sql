alter table public.coaches
    add column if not exists expertise_domain text,
    add column if not exists coaching_style text,
    add column if not exists disc_profile text,
    add column if not exists diploma text,
    add column if not exists certifications text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'coaches_expertise_domain_check'
          and conrelid = 'public.coaches'::regclass
    ) then
        alter table public.coaches
            add constraint coaches_expertise_domain_check
            check (
                expertise_domain is null
                or expertise_domain in ('Commercial', 'Management', 'Communication', 'Ressources humaines')
            )
            not valid;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'coaches_coaching_style_check'
          and conrelid = 'public.coaches'::regclass
    ) then
        alter table public.coaches
            add constraint coaches_coaching_style_check
            check (
                coaching_style is null
                or coaching_style in ('Optimiste', 'Réaliste', 'Exigeant')
            )
            not valid;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'coaches_disc_profile_check'
          and conrelid = 'public.coaches'::regclass
    ) then
        alter table public.coaches
            add constraint coaches_disc_profile_check
            check (
                disc_profile is null
                or disc_profile in ('Dominant', 'Influent', 'Stable', 'Consciencieux')
            )
            not valid;
    end if;
end $$;

alter table public.coaches validate constraint coaches_expertise_domain_check;
alter table public.coaches validate constraint coaches_coaching_style_check;
alter table public.coaches validate constraint coaches_disc_profile_check;

comment on column public.coaches.expertise_domain is
    'Coach expertise domain from the shared content taxonomy.';
comment on column public.coaches.coaching_style is
    'Coach style: Optimiste, Réaliste or Exigeant.';
comment on column public.coaches.disc_profile is
    'Coach DISC profile: Dominant, Influent, Stable or Consciencieux.';
comment on column public.coaches.diploma is
    'Coach diploma or education.';
comment on column public.coaches.certifications is
    'Coach certifications.';
