alter table public.methods
    drop constraint if exists methods_category_domain_check;

alter table public.methods
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
                    domain = 'Communication'
                    and category in (
                        'Prise de parole',
                        'Communication écrite',
                        'Gestion des conflits'
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

alter table public.methods validate constraint methods_category_domain_check;

comment on constraint methods_category_domain_check on public.methods is
    'Ensures each optional method category belongs to a selected valid domain.';
