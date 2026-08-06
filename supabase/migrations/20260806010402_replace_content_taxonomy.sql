-- Replace the legacy five-domain taxonomy with the client taxonomy.
-- Existing labels are migrated before the new checks are installed.

alter table public.skills
    drop constraint if exists skills_category_domain_check,
    drop constraint if exists skills_domain_check;

alter table public.methods
    drop constraint if exists methods_category_domain_check,
    drop constraint if exists methods_domain_check;

alter table public.scenarios
    drop constraint if exists scenarios_category_domain_check,
    drop constraint if exists scenarios_domain_check,
    drop constraint if exists scenarios_published_learner_role_check;

alter table public.scorecards
    drop constraint if exists scorecards_category_domain_check,
    drop constraint if exists scorecards_domain_check;

alter table public.quizzes
    drop constraint if exists quizzes_categories_domain_check,
    drop constraint if exists quizzes_domain_check;

alter table public.coaches
    drop constraint if exists coaches_expertise_domain_check;

do $migration$
declare
    target_table text;
begin
    foreach target_table in array array['skills', 'methods', 'scorecards', 'scenarios']
    loop
        execute format(
            $update$
                update public.%I
                set
                    category = case
                        when domain = 'Commercial' and category = 'Négociation'
                            then 'Négociation commerciale'
                        when domain = 'Commercial' and category = 'Recommandation'
                            then 'Recommandation Client'
                        when domain = 'Relation client' and category = 'Accueil client'
                            then 'Accueil et posture relationnelle'
                        when domain = 'Relation client' and category = 'Gestion des conflits'
                            then 'Gestion des clients difficiles'
                        when domain = 'Communication' and category = 'Communication écrite'
                            then 'Communication orale et écrite'
                        when domain = 'Communication' and category = 'Prise de parole'
                            then 'Prise de parole et storytelling'
                        when domain = 'Communication' and category = 'Gestion des conflits'
                            then 'Gestion des conflits et médiation'
                        when domain = 'Management' and category = 'Pilotage'
                            then 'Pilotage de la performance'
                        when domain = 'Ressources humaines' and category = 'Recrutement'
                            then 'Recrutement et marque employeur'
                        when domain = 'Ressources humaines' and category = 'Onboarding'
                            then 'Intégration des collaborateurs'
                        else category
                    end,
                    domain = case domain
                        when 'Commercial' then 'Commerce et développement commercial'
                        when 'Relation client' then 'Relation client et expérience client'
                        when 'Management' then 'Management, stratégie et transformation'
                        when 'Communication' then 'Communication et efficacité relationnelle'
                        when 'Ressources humaines'
                            then 'Ressources humaines et développement des compétences'
                        else domain
                    end
                where domain in (
                    'Commercial',
                    'Relation client',
                    'Management',
                    'Communication',
                    'Ressources humaines'
                )
            $update$,
            target_table
        );
    end loop;
end
$migration$;

update public.quizzes as quiz
set
    categories = coalesce(
        (
            select array_agg(
                case
                    when quiz.domain = 'Commercial' and item.category = 'Négociation'
                        then 'Négociation commerciale'
                    when quiz.domain = 'Commercial' and item.category = 'Recommandation'
                        then 'Recommandation Client'
                    when quiz.domain = 'Relation client' and item.category = 'Accueil client'
                        then 'Accueil et posture relationnelle'
                    when quiz.domain = 'Relation client' and item.category = 'Gestion des conflits'
                        then 'Gestion des clients difficiles'
                    when quiz.domain = 'Communication' and item.category = 'Communication écrite'
                        then 'Communication orale et écrite'
                    when quiz.domain = 'Communication' and item.category = 'Prise de parole'
                        then 'Prise de parole et storytelling'
                    when quiz.domain = 'Communication' and item.category = 'Gestion des conflits'
                        then 'Gestion des conflits et médiation'
                    when quiz.domain = 'Management' and item.category = 'Pilotage'
                        then 'Pilotage de la performance'
                    when quiz.domain = 'Ressources humaines' and item.category = 'Recrutement'
                        then 'Recrutement et marque employeur'
                    when quiz.domain = 'Ressources humaines' and item.category = 'Onboarding'
                        then 'Intégration des collaborateurs'
                    else item.category
                end
                order by item.ordinality
            )
            from unnest(quiz.categories) with ordinality as item(category, ordinality)
        ),
        array[]::text[]
    ),
    domain = case quiz.domain
        when 'Commercial' then 'Commerce et développement commercial'
        when 'Relation client' then 'Relation client et expérience client'
        when 'Management' then 'Management, stratégie et transformation'
        when 'Communication' then 'Communication et efficacité relationnelle'
        when 'Ressources humaines'
            then 'Ressources humaines et développement des compétences'
        else quiz.domain
    end
where quiz.domain in (
    'Commercial',
    'Relation client',
    'Management',
    'Communication',
    'Ressources humaines'
);

update public.coaches
set expertise_domain = case expertise_domain
    when 'Commercial' then 'Commerce et développement commercial'
    when 'Relation client' then 'Relation client et expérience client'
    when 'Management' then 'Management, stratégie et transformation'
    when 'Communication' then 'Communication et efficacité relationnelle'
    when 'Ressources humaines'
        then 'Ressources humaines et développement des compétences'
    else expertise_domain
end
where expertise_domain in (
    'Commercial',
    'Relation client',
    'Management',
    'Communication',
    'Ressources humaines'
);

create or replace function public.is_valid_content_domain(candidate_domain text)
returns boolean
language sql
immutable
strict
set search_path = ''
as $function$
    select candidate_domain = any (array[
        'Management, stratégie et transformation',
        'Commerce et développement commercial',
        'Marketing et communication de marque',
        'Relation client et expérience client',
        'Communication et efficacité relationnelle',
        'Ressources humaines et développement des compétences',
        'Développement personnel et efficacité professionnelle',
        'Finance, droit, conformité et maîtrise des risques',
        'Performance opérationnelle et fonctions support',
        'Numérique, data et technologies',
        'RSE, environnement, santé et qualité de vie au travail'
    ]::text[])
$function$;

create or replace function public.is_valid_content_category(
    candidate_domain text,
    candidate_category text
)
returns boolean
language sql
immutable
strict
set search_path = ''
as $function$
    select case candidate_domain
        when 'Management, stratégie et transformation' then candidate_category = any (array[
            'Management des équipes',
            'Leadership et engagement',
            'Management transversal et à distance',
            'Management individuel',
            'Pilotage de la performance',
            'Conduite du changement',
            'Gestion de projet et de programme',
            'Agilité et gestion de produit',
            'Innovation et créativité',
            'Délégation',
            'Entretien de Remobilisation',
            'Feedback'
        ]::text[])
        when 'Commerce et développement commercial' then candidate_category = any (array[
            'Prise de rendez-vous',
            'Entretien vente-conseil',
            'Entretien Suivi et Satisfaction',
            'Proposition et Argumentation commerciale',
            'Rebond commercial et ventes additionnelles',
            'Négociation commerciale',
            'Traitement des objections',
            'Techniques de closing',
            'Recommandation Client',
            'Réseaux et prescripteurs',
            'Prospection',
            'Vente'
        ]::text[])
        when 'Marketing et communication de marque' then candidate_category = any (array[
            'Études de marché et veille concurrentielle',
            'Marketing stratégique',
            'Segmentation, ciblage et positionnement',
            'Marketing de l’offre, des produits et des services',
            'Politique tarifaire',
            'Marketing opérationnel',
            'Marketing digital et acquisition',
            'Marketing de contenu et réseaux sociaux',
            'Communication de marque et institutionnelle',
            'Communication interne, relations presse et événementiel'
        ]::text[])
        when 'Relation client et expérience client' then candidate_category = any (array[
            'Accueil et posture relationnelle',
            'Connaissance et culture client',
            'Écoute, conseil et personnalisation',
            'Parcours et expérience client',
            'Relation client à distance et omnicanale',
            'Qualité de service',
            'Satisfaction et fidélisation',
            'Gestion des réclamations et insatisfactions',
            'Gestion des clients difficiles',
            'Customer Success'
        ]::text[])
        when 'Communication et efficacité relationnelle' then candidate_category = any (array[
            'Communication orale et écrite',
            'Écoute, questionnement et reformulation',
            'Assertivité et communication non violente',
            'Prise de parole et storytelling',
            'Animation de réunions et conduite d’entretiens',
            'Communication managériale et collective',
            'Communication interculturelle',
            'Influence et persuasion',
            'Gestion des conflits et médiation',
            'Communication de crise'
        ]::text[])
        when 'Ressources humaines et développement des compétences' then candidate_category = any (array[
            'Recrutement et marque employeur',
            'Intégration des collaborateurs',
            'Gestion des emplois, talents et mobilités',
            'Évaluation de la performance',
            'Rémunération et avantages sociaux',
            'Droit social et relations sociales',
            'Diversité, inclusion et handicap',
            'Ingénierie de formation et pédagogique',
            'Animation, tutorat et transmission',
            'Coaching et mentorat'
        ]::text[])
        when 'Développement personnel et efficacité professionnelle' then candidate_category = any (array[
            'Gestion du temps et des priorités',
            'Organisation et gestion de la charge de travail',
            'Connaissance de soi et confiance en soi',
            'Intelligence émotionnelle',
            'Gestion du stress et résilience',
            'Adaptabilité et autonomie',
            'Esprit critique et prise de décision',
            'Résolution de problèmes et créativité',
            'Coopération et travail en équipe',
            'Gestion de carrière et posture professionnelle'
        ]::text[])
        when 'Finance, droit, conformité et maîtrise des risques' then candidate_category = any (array[
            'Comptabilité',
            'Finance et analyse financière',
            'Trésorerie, budget et contrôle de gestion',
            'Fiscalité',
            'Droit des affaires, contrats et propriété intellectuelle',
            'Conformité, éthique et déontologie',
            'Prévention de la fraude et lutte contre le blanchiment',
            'Gestion des risques et contrôle interne',
            'Audit',
            'Protection des données et RGPD'
        ]::text[])
        when 'Performance opérationnelle et fonctions support' then candidate_category = any (array[
            'Management de la qualité',
            'Amélioration continue et Lean management',
            'Gestion des processus et des opérations',
            'Résolution de problèmes opérationnels',
            'Achats, sourcing et négociation fournisseurs',
            'Gestion des fournisseurs et achats responsables',
            'Approvisionnement et supply chain',
            'Stocks et logistique',
            'Gestion administrative et documentaire',
            'Accueil, secrétariat et services généraux'
        ]::text[])
        when 'Numérique, data et technologies' then candidate_category = any (array[
            'Culture et transformation numériques',
            'Bureautique et outils collaboratifs',
            'Intelligence artificielle générative et prompting',
            'Agents IA et automatisation',
            'Analyse de données et statistiques',
            'Business intelligence et visualisation',
            'Gouvernance et qualité des données',
            'Développement informatique',
            'Systèmes d’information, cloud et réseaux',
            'Cybersécurité'
        ]::text[])
        when 'RSE, environnement, santé et qualité de vie au travail' then candidate_category = any (array[
            'Stratégie et gouvernance RSE',
            'Développement durable et réglementation',
            'Climat, bilan carbone et décarbonation',
            'Biodiversité',
            'Économie circulaire, écoconception et déchets',
            'Énergie et sobriété',
            'Achats responsables et finance durable',
            'Reporting de durabilité',
            'Santé, sécurité et prévention des risques professionnels',
            'QVCT, risques psychosociaux et bien-être au travail'
        ]::text[])
        else false
    end
$function$;

create or replace function public.are_valid_content_categories(
    candidate_domain text,
    candidate_categories text[]
)
returns boolean
language sql
immutable
set search_path = ''
as $function$
    select case
        when candidate_categories is null then false
        when cardinality(candidate_categories) = 0 then true
        when candidate_domain is null then false
        else coalesce(
            (
                select bool_and(public.is_valid_content_category(candidate_domain, category))
                from unnest(candidate_categories) as category
            ),
            false
        )
    end
$function$;

comment on function public.is_valid_content_domain(text)
    is 'Validates a displayed domain label against the canonical content taxonomy.';
comment on function public.is_valid_content_category(text, text)
    is 'Validates a displayed category label within its canonical content domain.';
comment on function public.are_valid_content_categories(text, text[])
    is 'Validates every displayed category label within a canonical content domain.';

alter table public.skills
    add constraint skills_domain_check
        check (domain is null or public.is_valid_content_domain(domain)) not valid,
    add constraint skills_category_domain_check
        check (
            category is null
            or (domain is not null and public.is_valid_content_category(domain, category))
        ) not valid;

alter table public.methods
    add constraint methods_domain_check
        check (domain is null or public.is_valid_content_domain(domain)) not valid,
    add constraint methods_category_domain_check
        check (
            category is null
            or (domain is not null and public.is_valid_content_category(domain, category))
        ) not valid;

alter table public.scenarios
    add constraint scenarios_domain_check
        check (domain is null or public.is_valid_content_domain(domain)) not valid,
    add constraint scenarios_category_domain_check
        check (
            category is null
            or (domain is not null and public.is_valid_content_category(domain, category))
        ) not valid,
    add constraint scenarios_published_learner_role_check
        check (
            status <> 'published'
            or nullif(btrim(learner_role), '') is not null
        ) not valid;

alter table public.scorecards
    add constraint scorecards_domain_check
        check (domain is null or public.is_valid_content_domain(domain)) not valid,
    add constraint scorecards_category_domain_check
        check (
            category is null
            or (domain is not null and public.is_valid_content_category(domain, category))
        ) not valid;

alter table public.quizzes
    add constraint quizzes_domain_check
        check (domain is null or public.is_valid_content_domain(domain)) not valid,
    add constraint quizzes_categories_domain_check
        check (public.are_valid_content_categories(domain, categories)) not valid;

alter table public.coaches
    add constraint coaches_expertise_domain_check
        check (
            expertise_domain is null
            or public.is_valid_content_domain(expertise_domain)
        ) not valid;

alter table public.skills
    validate constraint skills_domain_check,
    validate constraint skills_category_domain_check;

alter table public.methods
    validate constraint methods_domain_check,
    validate constraint methods_category_domain_check;

alter table public.scenarios
    validate constraint scenarios_domain_check,
    validate constraint scenarios_category_domain_check;

alter table public.scorecards
    validate constraint scorecards_domain_check,
    validate constraint scorecards_category_domain_check;

alter table public.quizzes
    validate constraint quizzes_domain_check,
    validate constraint quizzes_categories_domain_check;

alter table public.coaches
    validate constraint coaches_expertise_domain_check;
