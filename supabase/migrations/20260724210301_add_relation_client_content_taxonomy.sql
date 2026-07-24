begin;

alter table public.methods
    drop constraint if exists methods_domain_check,
    drop constraint if exists methods_category_domain_check;

alter table public.methods
    add constraint methods_domain_check
        check (
            domain is null
            or domain in (
                'Commercial',
                'Relation client',
                'Management',
                'Communication',
                'Ressources humaines'
            )
        )
        not valid,
    add constraint methods_category_domain_check
        check (
            category is null
            or (
                domain is not null
                and (
                    (
                        domain = 'Commercial'
                        and category in (
                            'Prospection',
                            'Négociation',
                            'Vente',
                            'Recommandation',
                            'Prise de rendez-vous'
                        )
                    )
                    or (
                        domain = 'Relation client'
                        and category in (
                            'Gestion des conflits',
                            'Accueil client'
                        )
                    )
                    or (
                        domain = 'Management'
                        and category in (
                            'Entretien de Remobilisation',
                            'Feedback',
                            'Pilotage'
                        )
                    )
                    or (
                        domain = 'Communication'
                        and category in (
                            'Prise de parole',
                            'Communication écrite',
                            'Gestion des conflits'
                        )
                    )
                    or (
                        domain = 'Ressources humaines'
                        and category in (
                            'Recrutement',
                            'Onboarding'
                        )
                    )
                )
            )
        )
        not valid;

alter table public.skills
    drop constraint if exists skills_domain_check,
    drop constraint if exists skills_category_domain_check;

alter table public.skills
    add constraint skills_domain_check
        check (
            domain is null
            or domain in (
                'Commercial',
                'Relation client',
                'Management',
                'Communication',
                'Ressources humaines'
            )
        )
        not valid,
    add constraint skills_category_domain_check
        check (
            category is null
            or (
                domain is not null
                and (
                    (
                        domain = 'Commercial'
                        and category in (
                            'Prospection',
                            'Négociation',
                            'Vente',
                            'Recommandation',
                            'Prise de rendez-vous'
                        )
                    )
                    or (
                        domain = 'Relation client'
                        and category in (
                            'Gestion des conflits',
                            'Accueil client'
                        )
                    )
                    or (
                        domain = 'Management'
                        and category in (
                            'Entretien de Remobilisation',
                            'Feedback',
                            'Pilotage'
                        )
                    )
                    or (
                        domain = 'Communication'
                        and category in (
                            'Prise de parole',
                            'Communication écrite',
                            'Gestion des conflits'
                        )
                    )
                    or (
                        domain = 'Ressources humaines'
                        and category in (
                            'Recrutement',
                            'Onboarding'
                        )
                    )
                )
            )
        )
        not valid;

alter table public.coaches
    drop constraint if exists coaches_expertise_domain_check;

alter table public.coaches
    add constraint coaches_expertise_domain_check
        check (
            expertise_domain is null
            or expertise_domain in (
                'Commercial',
                'Relation client',
                'Management',
                'Communication',
                'Ressources humaines'
            )
        )
        not valid;

alter table public.methods validate constraint methods_domain_check;
alter table public.methods validate constraint methods_category_domain_check;
alter table public.skills validate constraint skills_domain_check;
alter table public.skills validate constraint skills_category_domain_check;
alter table public.coaches validate constraint coaches_expertise_domain_check;

comment on constraint methods_domain_check on public.methods is
    'Restricts method domains to the shared application content taxonomy.';
comment on constraint methods_category_domain_check on public.methods is
    'Ensures each optional method category belongs to a selected valid domain.';
comment on constraint skills_domain_check on public.skills is
    'Restricts skill domains to the shared application content taxonomy.';
comment on constraint skills_category_domain_check on public.skills is
    'Ensures each optional skill category belongs to a selected valid domain.';
comment on constraint coaches_expertise_domain_check on public.coaches is
    'Restricts coach expertise domains to the shared application content taxonomy.';

notify pgrst, 'reload schema';

commit;
