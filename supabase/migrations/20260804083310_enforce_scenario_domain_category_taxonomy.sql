begin;

alter table public.scenarios
    add constraint scenarios_domain_check
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
    add constraint scenarios_category_domain_check
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

alter table public.scenarios validate constraint scenarios_domain_check;
alter table public.scenarios validate constraint scenarios_category_domain_check;

comment on constraint scenarios_domain_check on public.scenarios is
    'Restricts scenario domains to the shared application content taxonomy.';
comment on constraint scenarios_category_domain_check on public.scenarios is
    'Ensures each optional scenario category belongs to the selected valid domain.';

notify pgrst, 'reload schema';

commit;
