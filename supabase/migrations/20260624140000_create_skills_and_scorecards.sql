-- Skills and scorecards source of truth.
-- Skills keep a text id to stay compatible with existing quiz competence_id columns.

create table if not exists public.skills (
    id text primary key,
    name text not null,
    description text,
    category text not null,
    domain text,
    objective text,
    functions text[] not null default '{}',
    status public.content_status not null default 'draft'::public.content_status,
    is_active boolean not null default true,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint skills_id_check check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    constraint skills_category_check check (category in ('Métier', 'Comportementale', 'Transversale'))
);

create index if not exists skills_status_active_idx
    on public.skills(status, is_active);

create index if not exists skills_category_idx
    on public.skills(category);

create index if not exists skills_domain_idx
    on public.skills(domain);

create table if not exists public.skill_dimension_items (
    id uuid primary key default gen_random_uuid(),
    skill_id text not null references public.skills(id) on update cascade on delete cascade,
    dimension text not null,
    label text not null,
    item_order integer not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint skill_dimension_items_dimension_check check (dimension in ('savoir', 'savoir_faire', 'savoir_etre')),
    constraint skill_dimension_items_item_order_check check (item_order >= 1),
    constraint skill_dimension_items_label_check check (length(btrim(label)) > 0),
    constraint skill_dimension_items_id_skill_dimension_key unique (id, skill_id, dimension)
);

create index if not exists skill_dimension_items_skill_id_idx
    on public.skill_dimension_items(skill_id);

create index if not exists skill_dimension_items_dimension_idx
    on public.skill_dimension_items(dimension);

alter table public.quiz_questions
    add column if not exists dimension_item_id uuid;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'quiz_step_competencies_competence_id_fkey'
    ) then
        alter table public.quiz_step_competencies
            add constraint quiz_step_competencies_competence_id_fkey
            foreign key (competence_id)
            references public.skills(id)
            on update cascade
            on delete restrict
            not valid;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'quiz_questions_competence_id_fkey'
    ) then
        alter table public.quiz_questions
            add constraint quiz_questions_competence_id_fkey
            foreign key (competence_id)
            references public.skills(id)
            on update cascade
            on delete restrict
            not valid;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'quiz_questions_dimension_item_skill_fkey'
    ) then
        alter table public.quiz_questions
            add constraint quiz_questions_dimension_item_skill_fkey
            foreign key (dimension_item_id, competence_id, dimension)
            references public.skill_dimension_items(id, skill_id, dimension)
            on update cascade
            on delete restrict
            not valid;
    end if;
end $$;

create table if not exists public.scorecards (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    domain text,
    category text,
    level text,
    method_id uuid not null references public.methods(id) on delete restrict,
    visibility_scope text not null default 'public',
    organization_id uuid references public.organizations(id) on delete set null,
    status public.content_status not null default 'draft'::public.content_status,
    is_active boolean not null default true,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint scorecards_visibility_scope_check check (visibility_scope in ('public', 'organization')),
    constraint scorecards_organization_required_for_private_check check (
        visibility_scope = 'public' or organization_id is not null
    )
);

create index if not exists scorecards_method_id_idx
    on public.scorecards(method_id);

create index if not exists scorecards_status_active_idx
    on public.scorecards(status, is_active);

create index if not exists scorecards_visibility_scope_idx
    on public.scorecards(visibility_scope, organization_id);

create table if not exists public.scorecard_steps (
    id uuid primary key default gen_random_uuid(),
    scorecard_id uuid not null references public.scorecards(id) on delete cascade,
    method_step_id uuid not null references public.method_steps(id) on delete restrict,
    step_order integer not null,
    name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint scorecard_steps_step_order_check check (step_order >= 1),
    constraint scorecard_steps_scorecard_order_key unique (scorecard_id, step_order),
    constraint scorecard_steps_scorecard_method_step_key unique (scorecard_id, method_step_id)
);

create index if not exists scorecard_steps_scorecard_id_idx
    on public.scorecard_steps(scorecard_id);

create index if not exists scorecard_steps_method_step_id_idx
    on public.scorecard_steps(method_step_id);

create table if not exists public.scorecard_criteria (
    id uuid primary key default gen_random_uuid(),
    scorecard_step_id uuid not null references public.scorecard_steps(id) on delete cascade,
    criterion_order integer not null,
    criterion_key text not null,
    expected_evidence text not null,
    skill_id text not null references public.skills(id) on update cascade on delete restrict,
    dimension text not null,
    dimension_item_id uuid references public.skill_dimension_items(id) on delete restrict,
    max_points integer not null,
    ai_instruction text,
    verbatim text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint scorecard_criteria_criterion_order_check check (criterion_order >= 1),
    constraint scorecard_criteria_dimension_check check (dimension in ('savoir', 'savoir_faire', 'savoir_etre')),
    constraint scorecard_criteria_max_points_check check (max_points >= 1),
    constraint scorecard_criteria_step_order_key unique (scorecard_step_id, criterion_order),
    constraint scorecard_criteria_dimension_item_skill_fkey
        foreign key (dimension_item_id, skill_id, dimension)
        references public.skill_dimension_items(id, skill_id, dimension)
        on update cascade
        on delete restrict
);

create index if not exists scorecard_criteria_scorecard_step_id_idx
    on public.scorecard_criteria(scorecard_step_id);

create index if not exists scorecard_criteria_skill_id_idx
    on public.scorecard_criteria(skill_id);

drop trigger if exists skills_set_updated_at on public.skills;
create trigger skills_set_updated_at
before update on public.skills
for each row execute function public.set_updated_at();

drop trigger if exists skill_dimension_items_set_updated_at on public.skill_dimension_items;
create trigger skill_dimension_items_set_updated_at
before update on public.skill_dimension_items
for each row execute function public.set_updated_at();

drop trigger if exists scorecards_set_updated_at on public.scorecards;
create trigger scorecards_set_updated_at
before update on public.scorecards
for each row execute function public.set_updated_at();

drop trigger if exists scorecard_steps_set_updated_at on public.scorecard_steps;
create trigger scorecard_steps_set_updated_at
before update on public.scorecard_steps
for each row execute function public.set_updated_at();

drop trigger if exists scorecard_criteria_set_updated_at on public.scorecard_criteria;
create trigger scorecard_criteria_set_updated_at
before update on public.scorecard_criteria
for each row execute function public.set_updated_at();

drop table if exists pg_temp.skill_seed;
create temporary table skill_seed (data jsonb) on commit drop;

insert into skill_seed (data)
values ($skills$[
  {
    "id": "acces-decideur",
    "name": "Accès au décideur",
    "description": "Capacité à identifier, atteindre et obtenir un accès direct au bon interlocuteur malgré les filtres organisationnels, en formulant une demande claire, légitime et efficace.",
    "category": "Métier",
    "domain": "Commercial",
    "objective": "Prise de rendez-vous prospect qualifié",
    "functions": [
      "Sales"
    ],
    "dimensions": {
      "savoir": [
        "Comprendre les différents rôles du standard et les logiques de filtrage.",
        "Connaître les formulations efficaces pour demander une mise en relation.",
        "Connaître les objections types du standard et les réponses adaptées.",
        "Identifier les erreurs d'ouverture qui réduisent les chances d'accès."
      ],
      "savoir_faire": [
        "Formuler une demande de mise en relation claire, concise et directe.",
        "Répondre sans hésitation aux questions du standard.",
        "Conclure chaque réponse par un call-to-action explicite.",
        "Proposer une alternative crédible en cas de barrage."
      ],
      "savoir_etre": [
        "Adopter un ton assuré sans agressivité.",
        "Faire preuve de directivité mesurée.",
        "Rester courtois et professionnel.",
        "Dégager une énergie positive et une bonne fluidité d'élocution."
      ]
    }
  },
  {
    "id": "presentation-structuree",
    "name": "Présentation structurée",
    "description": "Capacité à se présenter de manière claire, crédible et structurée dès les premières secondes d'un échange, en donnant immédiatement un cadre professionnel et un motif d'appel compréhensible pour l'interlocuteur.",
    "category": "Métier",
    "domain": "Commercial",
    "objective": "Prise de rendez-vous prospect qualifié",
    "functions": [
      "Sales",
      "Customer Success"
    ],
    "dimensions": {
      "savoir": [
        "Connaître la structure d'une bonne accroche professionnelle.",
        "Connaître son script d'appel adapté au contexte du prospect.",
        "Identifier les erreurs d'ouverture trop longues, floues ou génériques.",
        "Comprendre les éléments qui renforcent légitimité et crédibilité."
      ],
      "savoir_faire": [
        "Se présenter en moins de 30 secondes avec une structure logique.",
        "Énoncer clairement son identité, son entreprise et son rôle.",
        "Vérifier la disponibilité de l'interlocuteur au bon moment.",
        "Relier rapidement l'appel à un enjeu ou à une proposition de valeur."
      ],
      "savoir_etre": [
        "Inspirer assurance dès les premiers mots.",
        "Dégager une crédibilité perçue cohérente avec son rôle.",
        "Adopter une posture professionnelle stable.",
        "Garder une prise de parole fluide, posée et légitime."
      ]
    }
  },
  {
    "id": "creation-interet-immediat",
    "name": "Création d'intérêt immédiat",
    "description": "Capacité à capter rapidement l'attention du prospect et à susciter son intérêt en mettant en avant un enjeu, un bénéfice ou une question pertinente qui donne envie de poursuivre l'échange.",
    "category": "Métier",
    "domain": "Commercial",
    "objective": "Prise de rendez-vous prospect qualifié",
    "functions": [
      "Sales",
      "Marketing"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les leviers d'intérêt : gain, risque, opportunité, pain point.",
        "Connaître les questions qui déclenchent engagement et curiosité.",
        "Comprendre ce qui capte l'attention dès le début d'un échange.",
        "Identifier les angles les plus pertinents selon le profil prospect."
      ],
      "savoir_faire": [
        "Poser une question engageante ou formuler une affirmation impactante.",
        "Utiliser la technique du permission-based au bon moment.",
        "Mettre en avant un bénéfice concret ou un résultat visible.",
        "Adapter le message au profil et au contexte du prospect."
      ],
      "savoir_etre": [
        "Faire preuve de curiosité authentique.",
        "Montrer une écoute active dès les premières secondes.",
        "Dégager du dynamisme sans surjouer.",
        "Donner une impression d'intérêt sincère pour le prospect."
      ]
    }
  },
  {
    "id": "gestion-objections",
    "name": "Gestion des objections",
    "description": "Capacité à identifier, comprendre et traiter efficacement les objections du prospect en écoutant, en reformulant et en répondant de manière structurée afin de maintenir la dynamique de l'échange.",
    "category": "Métier",
    "domain": "Commercial",
    "objective": "Prise de rendez-vous prospect qualifié",
    "functions": [
      "Sales",
      "Customer Success"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les principales familles d'objections.",
        "Connaître les réponses types aux objections récurrentes.",
        "Connaître les questions de faille permettant de creuser l'objection.",
        "Maîtriser une méthode structurée de traitement des objections."
      ],
      "savoir_faire": [
        "Accueillir l'objection sans la contester trop vite.",
        "Reformuler et approfondir le point de blocage.",
        "Répondre avec un argument structuré et adapté.",
        "Reproposer le rendez-vous en lien avec la valeur apportée."
      ],
      "savoir_etre": [
        "Rester calme face au refus.",
        "Éviter toute posture défensive.",
        "Faire preuve de persévérance maîtrisée.",
        "Maintenir une posture professionnelle stable."
      ]
    }
  },
  {
    "id": "posture-persuasive",
    "name": "Posture persuasive",
    "description": "Capacité à transmettre conviction, assurance et impact relationnel dans son discours afin de renforcer l'adhésion du prospect grâce à une communication crédible, fluide et engageante.",
    "category": "Comportementale",
    "domain": "Commercial",
    "objective": "Prise de rendez-vous prospect qualifié",
    "functions": [
      "Sales",
      "Leadership"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les principes clés de persuasion.",
        "Comprendre l'impact du ton, du rythme et du choix des mots.",
        "Identifier les formulations qui renforcent la conviction.",
        "Reconnaître les marqueurs de discours hésitant ou affaiblissant."
      ],
      "savoir_faire": [
        "Utiliser un vocabulaire affirmatif et orienté impact.",
        "Employer des silences tactiques après un argument fort.",
        "Adapter son débit à celui du prospect.",
        "Éviter les formulations hésitantes ou affaiblissantes."
      ],
      "savoir_etre": [
        "Dégager de la conviction dans la voix et le discours.",
        "Inspirer une assurance stable.",
        "Conserver une bonne stabilité émotionnelle.",
        "Renforcer son impact relationnel par une présence crédible."
      ]
    }
  },
  {
    "id": "closing-rendez-vous",
    "name": "Closing du rendez-vous",
    "description": "Capacité à transformer l'échange en engagement concret en proposant explicitement un rendez-vous, au bon moment, avec une formulation claire, directe et orientée vers l'action.",
    "category": "Métier",
    "domain": "Commercial",
    "objective": "Prise de rendez-vous prospect qualifié",
    "functions": [
      "Sales"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les principales techniques de closing.",
        "Comprendre l'importance d'une demande explicite.",
        "Identifier le bon moment pour proposer un rendez-vous.",
        "Connaître les formulations qui facilitent la décision."
      ],
      "savoir_faire": [
        "Formuler une proposition de rendez-vous claire et directe.",
        "Utiliser une alternative de temporalité ou de créneaux.",
        "Proposer des options concrètes et précises.",
        "Gérer le silence après la proposition."
      ],
      "savoir_etre": [
        "Faire preuve d'assertivité.",
        "Montrer de la confiance dans la demande.",
        "Adopter une posture claire et décisionnelle.",
        "Rester à l'aise au moment de solliciter l'engagement."
      ]
    }
  },
  {
    "id": "securisation-rendez-vous",
    "name": "Sécurisation du rendez-vous",
    "description": "Capacité à confirmer, formaliser et fiabiliser le rendez-vous obtenu en validant les éléments logistiques et les conditions nécessaires à sa bonne tenue, afin de réduire le risque d'annulation ou d'imprécision.",
    "category": "Métier",
    "domain": "Commercial",
    "objective": "Prise de rendez-vous prospect qualifié",
    "functions": [
      "Sales",
      "Customer Success"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les éléments à confirmer pour fiabiliser un rendez-vous.",
        "Comprendre ce qui fragilise un rendez-vous pris.",
        "Identifier les informations nécessaires à la bonne préparation du rendez-vous.",
        "Savoir quels éléments logistiques doivent être validés."
      ],
      "savoir_faire": [
        "Reformuler et valider clairement les modalités du rendez-vous.",
        "Confirmer date, heure, format, participants et durée.",
        "Préciser les éléments utiles à la bonne tenue du rendez-vous.",
        "Vérifier le canal de confirmation et les coordonnées nécessaires."
      ],
      "savoir_etre": [
        "Faire preuve de rigueur.",
        "Adopter une attitude professionnelle jusqu'à la fin.",
        "Montrer un vrai sens du détail.",
        "Sécuriser l'engagement sans lourdeur ni confusion."
      ]
    }
  },
  {
    "id": "preparation-commerciale",
    "name": "Préparation commerciale",
    "description": "Capacité à préparer efficacement un entretien commercial en recherchant les informations clés sur le prospect, son entreprise, son secteur et ses enjeux potentiels.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Accueillir",
    "functions": [
      "Sales"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les sources d'information pertinentes pour préparer un entretien commercial (LinkedIn, site web entreprise...).",
        "Identifier les enjeux clés d'un secteur ou d'une entreprise.",
        "Comprendre l'importance de la préparation dans la réussite commerciale."
      ],
      "savoir_faire": [
        "Rechercher et analyser les informations sur le prospect et son entreprise.",
        "Identifier les points d'accroche et les enjeux business potentiels.",
        "Préparer des questions et des arguments adaptés au contexte."
      ],
      "savoir_etre": [
        "Être rigoureux et anticiper.",
        "Être curieux professionnellement.",
        "Être proactif."
      ]
    }
  },
  {
    "id": "creation-relation",
    "name": "Création de relation",
    "description": "Capacité à établir rapidement une relation de confiance avec l'interlocuteur dès les premiers échanges, en créant un climat propice à l'échange.",
    "category": "Comportementale",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Accueillir",
    "functions": [
      "Sales",
      "Customer Success"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les techniques de création de rapport.",
        "Comprendre les éléments qui favorisent la confiance.",
        "Identifier les signaux d'ouverture de l'interlocuteur."
      ],
      "savoir_faire": [
        "Adopter une posture d'écoute et d'ouverture dès le début.",
        "Utiliser des techniques de synchronisation verbale et non-verbale.",
        "Créer un climat de confiance propice à l'échange."
      ],
      "savoir_etre": [
        "Être empathique et authentique.",
        "Être intéressé sincèrement par l'interlocuteur.",
        "Être bienveillant."
      ]
    }
  },
  {
    "id": "credibilite-personnelle",
    "name": "Crédibilité personnelle",
    "description": "Capacité à inspirer confiance par sa posture, son expertise et son professionnalisme, en démontrant sa légitimité à mener l'entretien.",
    "category": "Comportementale",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Accueillir",
    "functions": [
      "Sales",
      "Leadership"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les éléments qui renforcent la crédibilité personnelle.",
        "Comprendre l'impact de la posture et du discours sur la perception.",
        "Identifier les marqueurs d'expertise dans son domaine."
      ],
      "savoir_faire": [
        "Adopter une posture professionnelle assurée.",
        "Démontrer son expertise de façon naturelle et contextuelle.",
        "Utiliser un vocabulaire professionnel adapté."
      ],
      "savoir_etre": [
        "Être assuré sans arrogance.",
        "Être professionnel constamment.",
        "Inspirer confiance par sa présence."
      ]
    }
  },
  {
    "id": "credibilite-societe",
    "name": "Crédibilité société",
    "description": "Capacité à valoriser son entreprise, ses références et sa proposition de valeur de façon crédible pour renforcer la confiance du prospect.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Accueillir",
    "functions": [
      "Sales",
      "Marketing"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les éléments de différenciation de son entreprise.",
        "Maîtriser les références et cas clients pertinents.",
        "Comprendre la proposition de valeur selon les segments."
      ],
      "savoir_faire": [
        "Présenter l'entreprise de façon concise et impactante.",
        "Utiliser des références clients pertinentes au bon moment.",
        "Adapter le discours entreprise au contexte du prospect."
      ],
      "savoir_etre": [
        "Être convaincu dans la valorisation.",
        "Être fier professionnellement sans exagération.",
        "Être un ambassadeur crédible."
      ]
    }
  },
  {
    "id": "cadrage-echange",
    "name": "Cadrage de l'échange",
    "description": "Capacité à poser le cadre de l'entretien en clarifiant l'objectif, le déroulé et les attentes mutuelles pour sécuriser l'engagement du prospect dans le processus.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Cadrer",
    "functions": [
      "Sales",
      "Customer Success"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les éléments d'un cadrage efficace.",
        "Comprendre l'importance du cadrage pour la suite de l'entretien.",
        "Identifier les attentes du prospect à clarifier."
      ],
      "savoir_faire": [
        "Présenter l'objectif et le déroulé de l'entretien clairement.",
        "Valider l'accord du prospect sur le cadre proposé.",
        "Adapter le cadrage selon le temps disponible et le contexte."
      ],
      "savoir_etre": [
        "Être clair et structuré.",
        "Être leader dans la conduite de l'entretien.",
        "Être directif de façon mesurée."
      ]
    }
  },
  {
    "id": "comprehension-business",
    "name": "Compréhension business du client",
    "description": "Capacité à comprendre le modèle économique, les enjeux business et le contexte stratégique du client pour identifier les opportunités de création de valeur.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Découvrir",
    "functions": [
      "Sales",
      "Customer Success"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les indicateurs business clés par secteur.",
        "Comprendre les modèles économiques courants.",
        "Identifier les enjeux stratégiques typiques."
      ],
      "savoir_faire": [
        "Poser des questions pour comprendre le modèle économique.",
        "Identifier les priorités business et les contraintes.",
        "Relier les enjeux business à la proposition de valeur."
      ],
      "savoir_etre": [
        "Être curieux du business.",
        "Avoir une vision stratégique.",
        "Adopter une posture conseil."
      ]
    }
  },
  {
    "id": "questionnement-consultatif",
    "name": "Questionnement consultatif",
    "description": "Capacité à poser des questions ouvertes, stratégiques et structurées pour faire émerger les besoins, enjeux et opportunités du client.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Découvrir",
    "functions": [
      "Sales",
      "Customer Success"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les types de questions consultatives (ouvertes, SPIN, MEDDIC...).",
        "Maîtriser les techniques de questionnement.",
        "Comprendre la progression logique du questionnement."
      ],
      "savoir_faire": [
        "Poser des questions ouvertes et stratégiques.",
        "Structurer le questionnement de façon logique.",
        "Adapter les questions selon les réponses obtenues."
      ],
      "savoir_etre": [
        "Être curieux professionnellement.",
        "Être intéressé sincèrement par les réponses.",
        "Adopter une posture d'écoute active."
      ]
    }
  },
  {
    "id": "ecoute-active-reformulation",
    "name": "Écoute active et reformulation intermédiaire",
    "description": "Capacité à écouter activement les réponses du client et à reformuler régulièrement pour valider la compréhension et approfondir les points clés.",
    "category": "Comportementale",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Découvrir",
    "functions": [
      "Sales",
      "Customer Success",
      "Leadership"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les techniques d'écoute active.",
        "Comprendre l'importance de la reformulation.",
        "Identifier les moments clés pour reformuler."
      ],
      "savoir_faire": [
        "Pratiquer l'écoute active sans interrompre.",
        "Reformuler les points clés régulièrement.",
        "Valider la compréhension avant d'approfondir."
      ],
      "savoir_etre": [
        "Être empathique et attentif.",
        "Être intéressé sincèrement par les réponses.",
        "Adopter une posture d'ouverture."
      ]
    }
  },
  {
    "id": "posture-challenger",
    "name": "Posture Challenger",
    "description": "Capacité à challenger respectueusement les croyances et hypothèses du client pour faire émerger de nouvelles perspectives et opportunités.",
    "category": "Comportementale",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Découvrir",
    "functions": [
      "Sales",
      "Leadership"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les principes du Challenger Sale.",
        "Comprendre quand et comment challenger.",
        "Identifier les croyances limitantes à challenger."
      ],
      "savoir_faire": [
        "Challenger respectueusement les hypothèses du client.",
        "Apporter de nouvelles perspectives avec tact.",
        "Équilibrer challenge et empathie."
      ],
      "savoir_etre": [
        "Être assertif de façon mesurée.",
        "Être confiant dans son expertise.",
        "Adopter une posture de conseil."
      ]
    }
  },
  {
    "id": "diagnostic-problemes-impacts",
    "name": "Diagnostic des problèmes et impacts",
    "description": "Capacité à identifier et qualifier les problèmes du client ainsi que leurs impacts business pour construire un diagnostic partagé.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Découvrir",
    "functions": [
      "Sales",
      "Customer Success"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les méthodologies de diagnostic.",
        "Comprendre les types d'impacts business (coûts, temps, qualité...).",
        "Identifier les problèmes récurrents par secteur."
      ],
      "savoir_faire": [
        "Identifier et qualifier les problèmes du client.",
        "Quantifier les impacts business.",
        "Construire un diagnostic partagé et validé."
      ],
      "savoir_etre": [
        "Être analytique et rigoureux.",
        "Être empathique face aux problèmes.",
        "Adopter une posture de consultant."
      ]
    }
  },
  {
    "id": "identification-besoins-gains",
    "name": "Identification des besoins et gains attendus",
    "description": "Capacité à identifier les besoins explicites et implicites du client ainsi que les gains attendus d'une solution pour construire la valeur perçue.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Découvrir",
    "functions": [
      "Sales",
      "Customer Success"
    ],
    "dimensions": {
      "savoir": [
        "Connaître la différence entre besoins explicites et implicites.",
        "Comprendre les types de gains attendus (efficacité, croissance, réduction coûts).",
        "Identifier les critères de valeur par secteur."
      ],
      "savoir_faire": [
        "Faire émerger les besoins implicites par le questionnement.",
        "Quantifier les gains attendus avec le client.",
        "Prioriser les besoins selon leur impact business."
      ],
      "savoir_etre": [
        "Être à l'écoute et perspicace.",
        "Être empathique face aux besoins.",
        "Adopter une posture orientée valeur."
      ]
    }
  },
  {
    "id": "construction-pre-achat",
    "name": "Construction du pré-achat",
    "description": "Capacité à faire émerger chez le client une vision claire de la solution et de ses bénéfices avant même de présenter formellement l'offre.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Découvrir",
    "functions": [
      "Sales"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les techniques de construction de vision.",
        "Comprendre le concept de pré-achat mental.",
        "Identifier les signaux d'adhésion à la vision."
      ],
      "savoir_faire": [
        "Faire projeter le client dans la solution idéale.",
        "Co-construire la vision avec le client.",
        "Valider l'adhésion avant de présenter l'offre."
      ],
      "savoir_etre": [
        "Être pédagogue et créatif.",
        "Être enthousiaste de façon mesurée.",
        "Adopter une posture de co-construction."
      ]
    }
  },
  {
    "id": "exploration-freins",
    "name": "Exploration des freins",
    "description": "Capacité à identifier et explorer les freins potentiels à l'achat de façon proactive pour les traiter en amont du closing.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Découvrir",
    "functions": [
      "Sales"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les freins courants à l'achat par secteur.",
        "Comprendre la différence entre freins et objections.",
        "Identifier les signaux de freins non exprimés."
      ],
      "savoir_faire": [
        "Questionner proactivement sur les freins potentiels.",
        "Faire exprimer les craintes et réticences.",
        "Traiter les freins identifiés avant le closing."
      ],
      "savoir_etre": [
        "Être ouvert et non-jugeant.",
        "Être empathique face aux freins.",
        "Adopter une posture rassurante."
      ]
    }
  },
  {
    "id": "analyse-processus-decision",
    "name": "Analyse du processus de décision",
    "description": "Capacité à comprendre et cartographier le processus de décision du client, les acteurs impliqués et les étapes de validation.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Découvrir",
    "functions": [
      "Sales"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les questions clés pour cartographier la décision.",
        "Comprendre les rôles décisionnels (décideur, influenceur, utilisateur).",
        "Identifier les étapes de validation typiques."
      ],
      "savoir_faire": [
        "Questionner sur le processus de décision.",
        "Identifier tous les acteurs impliqués et leur rôle.",
        "Cartographier les étapes de validation nécessaires."
      ],
      "savoir_etre": [
        "Être curieux stratégiquement.",
        "Être tactique dans l'exploration.",
        "Adopter une posture de partenaire."
      ]
    }
  },
  {
    "id": "analyse-concurrence-existant",
    "name": "Analyse de la concurrence et de l'existant",
    "description": "Capacité à identifier et analyser les solutions concurrentes ou existantes du client pour construire un positionnement différenciant.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Découvrir",
    "functions": [
      "Sales",
      "Marketing"
    ],
    "dimensions": {
      "savoir": [
        "Connaître le paysage concurrentiel de son marché.",
        "Comprendre les forces et faiblesses des concurrents.",
        "Identifier les éléments de différenciation."
      ],
      "savoir_faire": [
        "Questionner sur les solutions existantes et concurrentes.",
        "Identifier les points de satisfaction et d'insatisfaction.",
        "Construire un positionnement différenciant."
      ],
      "savoir_etre": [
        "Être objectif et respectueux.",
        "Être confiant dans sa proposition.",
        "Adopter une posture comparative éthique."
      ]
    }
  },
  {
    "id": "identification-motivations-achat",
    "name": "Identification des motivations d'achat",
    "description": "Capacité à identifier les motivations profondes (rationnelles et émotionnelles) qui guident la décision d'achat du client.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Découvrir",
    "functions": [
      "Sales"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les types de motivations d'achat (SONCAS...).",
        "Comprendre la différence entre motivations rationnelles et émotionnelles.",
        "Identifier les signaux de motivations non exprimées."
      ],
      "savoir_faire": [
        "Faire émerger les motivations par le questionnement.",
        "Identifier les motivations dominantes.",
        "Adapter le discours aux motivations identifiées."
      ],
      "savoir_etre": [
        "Être empathique et fin.",
        "Être à l'écoute des signaux faibles.",
        "Adopter une posture de compréhension profonde."
      ]
    }
  },
  {
    "id": "validation-diagnostic-accord",
    "name": "Validation du diagnostic et accord pour avancer",
    "description": "Capacité à synthétiser le diagnostic partagé, valider l'alignement avec le client et obtenir son accord pour avancer vers la solution.",
    "category": "Métier",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Étape Confirmer",
    "functions": [
      "Sales",
      "Customer Success"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les éléments d'un diagnostic partagé complet.",
        "Comprendre l'importance de la validation avant la proposition.",
        "Identifier les signaux d'accord et de réserve du client."
      ],
      "savoir_faire": [
        "Synthétiser le diagnostic de façon structurée.",
        "Valider l'alignement point par point avec le client.",
        "Obtenir un accord explicite pour avancer."
      ],
      "savoir_etre": [
        "Être clair et synthétique.",
        "Être rigoureux dans la validation.",
        "Adopter une posture de co-construction."
      ]
    }
  },
  {
    "id": "pilotage-entretien",
    "name": "Pilotage de l'entretien",
    "description": "Capacité à conduire l'entretien commercial de façon structurée, en gérant le temps, les transitions et la progression vers l'objectif.",
    "category": "Transversale",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Compétence Transverse",
    "functions": [
      "Sales",
      "Customer Success",
      "Leadership"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les étapes clés d'un entretien commercial.",
        "Comprendre les techniques de gestion du temps.",
        "Identifier les signaux pour ajuster le pilotage."
      ],
      "savoir_faire": [
        "Structurer et conduire l'entretien de façon fluide.",
        "Gérer le temps et les transitions entre étapes.",
        "Recentrer l'échange vers l'objectif si nécessaire."
      ],
      "savoir_etre": [
        "Être leader et assertif.",
        "Être flexible dans la conduite.",
        "Adopter une posture de guide."
      ]
    }
  },
  {
    "id": "communication-professionnelle",
    "name": "Communication professionnelle",
    "description": "Capacité à communiquer de façon claire, structurée et professionnelle tout au long de l'entretien, en adaptant son style au contexte et à l'interlocuteur.",
    "category": "Transversale",
    "domain": "Méthode ACDC",
    "objective": "Méthode AC/DC - Compétence Transverse",
    "functions": [
      "Sales",
      "Customer Success",
      "Leadership",
      "Marketing"
    ],
    "dimensions": {
      "savoir": [
        "Connaître les principes de communication professionnelle.",
        "Comprendre l'impact du verbal et du non-verbal.",
        "Identifier les styles de communication par profil."
      ],
      "savoir_faire": [
        "Communiquer de façon claire et structurée.",
        "Adapter son style de communication à l'interlocuteur.",
        "Utiliser un vocabulaire professionnel adapté."
      ],
      "savoir_etre": [
        "Être clair et précis.",
        "Être flexible dans sa communication.",
        "Adopter une posture professionnelle constante."
      ]
    }
  }
]$skills$::jsonb);

with seed as (
    select parsed.*
    from skill_seed
    cross join lateral jsonb_to_recordset(skill_seed.data) as parsed(
        id text,
        name text,
        description text,
        category text,
        domain text,
        objective text,
        functions jsonb,
        dimensions jsonb
    )
)
insert into public.skills (id, name, description, category, domain, objective, functions, status, is_active)
select
    seed.id,
    seed.name,
    seed.description,
    seed.category,
    seed.domain,
    seed.objective,
    array(select jsonb_array_elements_text(coalesce(seed.functions, '[]'::jsonb))),
    'published'::public.content_status,
    true
from seed
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    category = excluded.category,
    domain = excluded.domain,
    objective = excluded.objective,
    functions = excluded.functions,
    status = excluded.status,
    is_active = excluded.is_active;

with seed as (
    select parsed.*
    from skill_seed
    cross join lateral jsonb_to_recordset(skill_seed.data) as parsed(
        id text,
        dimensions jsonb
    )
),
dimension_items as (
    select
        seed.id as skill_id,
        dimensions.key as dimension,
        item.label,
        item.item_order::integer as item_order
    from seed
    cross join lateral jsonb_each(coalesce(seed.dimensions, '{}'::jsonb)) as dimensions(key, labels)
    cross join lateral jsonb_array_elements_text(dimensions.labels) with ordinality as item(label, item_order)
)
insert into public.skill_dimension_items (skill_id, dimension, label, item_order)
select
    dimension_items.skill_id,
    dimension_items.dimension,
    dimension_items.label,
    dimension_items.item_order
from dimension_items
where not exists (
    select 1
    from public.skill_dimension_items existing
    where existing.skill_id = dimension_items.skill_id
      and existing.dimension = dimension_items.dimension
      and existing.label = dimension_items.label
);

drop table if exists pg_temp.skill_seed;

alter table public.skills enable row level security;
alter table public.skill_dimension_items enable row level security;
alter table public.scorecards enable row level security;
alter table public.scorecard_steps enable row level security;
alter table public.scorecard_criteria enable row level security;

revoke all privileges on table public.skills from anon;
revoke all privileges on table public.skill_dimension_items from anon;
revoke all privileges on table public.scorecards from anon;
revoke all privileges on table public.scorecard_steps from anon;
revoke all privileges on table public.scorecard_criteria from anon;

revoke all privileges on table public.skills from authenticated;
revoke all privileges on table public.skill_dimension_items from authenticated;
revoke all privileges on table public.scorecards from authenticated;
revoke all privileges on table public.scorecard_steps from authenticated;
revoke all privileges on table public.scorecard_criteria from authenticated;

grant select, insert, update, delete on table public.skills to authenticated;
grant select, insert, update, delete on table public.skill_dimension_items to authenticated;
grant select, insert, update, delete on table public.scorecards to authenticated;
grant select, insert, update, delete on table public.scorecard_steps to authenticated;
grant select, insert, update, delete on table public.scorecard_criteria to authenticated;

grant select, insert, update, delete on table public.skills to service_role;
grant select, insert, update, delete on table public.skill_dimension_items to service_role;
grant select, insert, update, delete on table public.scorecards to service_role;
grant select, insert, update, delete on table public.scorecard_steps to service_role;
grant select, insert, update, delete on table public.scorecard_criteria to service_role;

drop policy if exists "Authenticated users can read visible skills" on public.skills;
create policy "Authenticated users can read visible skills"
    on public.skills
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or (
            is_active = true
            and status = 'published'::public.content_status
        )
    );

drop policy if exists "Platform admins can mutate skills" on public.skills;
create policy "Platform admins can mutate skills"
    on public.skills
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Authenticated users can read visible skill dimension items" on public.skill_dimension_items;
create policy "Authenticated users can read visible skill dimension items"
    on public.skill_dimension_items
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.skills
            where skills.id = skill_dimension_items.skill_id
        )
    );

drop policy if exists "Platform admins can mutate skill dimension items" on public.skill_dimension_items;
create policy "Platform admins can mutate skill dimension items"
    on public.skill_dimension_items
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Authenticated users can read visible scorecards" on public.scorecards;
create policy "Authenticated users can read visible scorecards"
    on public.scorecards
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or (
            is_active = true
            and status = 'published'::public.content_status
            and (
                visibility_scope = 'public'
                or (
                    visibility_scope = 'organization'
                    and organization_id is not null
                    and private.has_active_organization_membership(organization_id)
                )
            )
        )
    );

drop policy if exists "Platform admins can mutate scorecards" on public.scorecards;
create policy "Platform admins can mutate scorecards"
    on public.scorecards
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Authenticated users can read visible scorecard steps" on public.scorecard_steps;
create policy "Authenticated users can read visible scorecard steps"
    on public.scorecard_steps
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.scorecards
            where scorecards.id = scorecard_steps.scorecard_id
        )
    );

drop policy if exists "Platform admins can mutate scorecard steps" on public.scorecard_steps;
create policy "Platform admins can mutate scorecard steps"
    on public.scorecard_steps
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Authenticated users can read visible scorecard criteria" on public.scorecard_criteria;
create policy "Authenticated users can read visible scorecard criteria"
    on public.scorecard_criteria
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.scorecard_steps
            where scorecard_steps.id = scorecard_criteria.scorecard_step_id
        )
    );

drop policy if exists "Platform admins can mutate scorecard criteria" on public.scorecard_criteria;
create policy "Platform admins can mutate scorecard criteria"
    on public.scorecard_criteria
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());
