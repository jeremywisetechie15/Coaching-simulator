import type { ContentStatus } from "@/features/content/domain";

export const SKILL_CATEGORIES = ["Métier", "Comportementale", "Transversale"] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/**
 * Définition complète d'une compétence, relevée 1:1 depuis le prototype Figma
 * (page Compétences → détail). Tous les champs sont remplis pour préparer la
 * future migration DB. Les % d'« État de la compétence » du site sont de la
 * progression apprenant (dynamique) et ne font donc PAS partie de la définition.
 */
export interface SkillDimensions {
    /** Savoir — « Knowledge requis » */
    savoir: string[];
    /** Savoir-faire — « Dimensions pratiques » */
    savoir_faire: string[];
    /** Savoir-être — « Dimensions comportementales » */
    savoir_etre: string[];
}

export type SkillDimension = keyof SkillDimensions;

export interface SkillItem {
    id: string;
    name: string;
    /** Type sur le site : Métier / Comportementale / Transversale. */
    category: SkillCategory;
    /** Domaine affiché dans le détail (Commercial / Méthode ACDC). */
    domain: string;
    /** Méthode / étape source dont est issue la compétence (groupe dans le sélecteur). */
    objective: string;
    /** Statut sur le site (« Actif »). */
    isActive: boolean;
    description: string;
    /** Fonctions associées (Sales, Marketing, Customer Success, Leadership, …). */
    functions: string[];
    dimensions: SkillDimensions;
}

/** Libellés des 3 dimensions tels qu'affichés sur le site (identiques pour toutes les compétences). */
export const SKILL_DIMENSIONS = ["savoir", "savoir_faire", "savoir_etre"] as const;

export const SKILL_DIMENSION_LABELS: Record<SkillDimension, string> = {
    savoir: "Knowledge requis",
    savoir_faire: "Dimensions pratiques",
    savoir_etre: "Dimensions comportementales",
};

/** Niveaux de maîtrise d'une compétence (du plus faible au plus élevé). */
export const SKILL_LEVELS = ["Faible", "À renforcer", "En progression", "Maîtrisées"] as const;

export type SkillLevel = (typeof SKILL_LEVELS)[number];

/** Déduit le niveau de maîtrise à partir d'un score (0-100). */
export function getSkillLevel(score: number): SkillLevel {
    if (score >= 80) return "Maîtrisées";
    if (score >= 60) return "En progression";
    if (score >= 40) return "À renforcer";
    return "Faible";
}

export interface SkillDimensionItem {
    dimension: SkillDimension;
    id: string;
    isActive: boolean;
    label: string;
    order: number;
    skillId: string;
}

export interface SkillListItem {
    category: SkillCategory;
    description: string;
    domain: string;
    functions: string[];
    id: string;
    isActive: boolean;
    name: string;
    objective: string;
    status: ContentStatus;
}

export interface SkillDetail extends SkillListItem {
    dimensionItems: SkillDimensionItem[];
}

export interface SkillOption {
    dimensionItems: SkillDimensionItem[];
    id: string;
    name: string;
    objective: string;
}

const COMMERCIAL = "Commercial";
const ACDC = "Méthode ACDC";

const RDV = "Prise de rendez-vous prospect qualifié";
const ACCUEILLIR = "Méthode AC/DC - Étape Accueillir";
const CADRER = "Méthode AC/DC - Étape Cadrer";
const DECOUVRIR = "Méthode AC/DC - Étape Découvrir";
const CONFIRMER = "Méthode AC/DC - Étape Confirmer";
const TRANSVERSE = "Méthode AC/DC - Compétence Transverse";

export const skills: SkillItem[] = [
    {
        id: "acces-decideur",
        name: "Accès au décideur",
        category: "Métier",
        domain: COMMERCIAL,
        objective: RDV,
        isActive: true,
        description:
            "Capacité à identifier, atteindre et obtenir un accès direct au bon interlocuteur malgré les filtres organisationnels, en formulant une demande claire, légitime et efficace.",
        functions: ["Sales"],
        dimensions: {
            savoir: [
                "Comprendre les différents rôles du standard et les logiques de filtrage.",
                "Connaître les formulations efficaces pour demander une mise en relation.",
                "Connaître les objections types du standard et les réponses adaptées.",
                "Identifier les erreurs d'ouverture qui réduisent les chances d'accès.",
            ],
            savoir_faire: [
                "Formuler une demande de mise en relation claire, concise et directe.",
                "Répondre sans hésitation aux questions du standard.",
                "Conclure chaque réponse par un call-to-action explicite.",
                "Proposer une alternative crédible en cas de barrage.",
            ],
            savoir_etre: [
                "Adopter un ton assuré sans agressivité.",
                "Faire preuve de directivité mesurée.",
                "Rester courtois et professionnel.",
                "Dégager une énergie positive et une bonne fluidité d'élocution.",
            ],
        },
    },
    {
        id: "presentation-structuree",
        name: "Présentation structurée",
        category: "Métier",
        domain: COMMERCIAL,
        objective: RDV,
        isActive: true,
        description:
            "Capacité à se présenter de manière claire, crédible et structurée dès les premières secondes d'un échange, en donnant immédiatement un cadre professionnel et un motif d'appel compréhensible pour l'interlocuteur.",
        functions: ["Sales", "Customer Success"],
        dimensions: {
            savoir: [
                "Connaître la structure d'une bonne accroche professionnelle.",
                "Connaître son script d'appel adapté au contexte du prospect.",
                "Identifier les erreurs d'ouverture trop longues, floues ou génériques.",
                "Comprendre les éléments qui renforcent légitimité et crédibilité.",
            ],
            savoir_faire: [
                "Se présenter en moins de 30 secondes avec une structure logique.",
                "Énoncer clairement son identité, son entreprise et son rôle.",
                "Vérifier la disponibilité de l'interlocuteur au bon moment.",
                "Relier rapidement l'appel à un enjeu ou à une proposition de valeur.",
            ],
            savoir_etre: [
                "Inspirer assurance dès les premiers mots.",
                "Dégager une crédibilité perçue cohérente avec son rôle.",
                "Adopter une posture professionnelle stable.",
                "Garder une prise de parole fluide, posée et légitime.",
            ],
        },
    },
    {
        id: "creation-interet-immediat",
        name: "Création d'intérêt immédiat",
        category: "Métier",
        domain: COMMERCIAL,
        objective: RDV,
        isActive: true,
        description:
            "Capacité à capter rapidement l'attention du prospect et à susciter son intérêt en mettant en avant un enjeu, un bénéfice ou une question pertinente qui donne envie de poursuivre l'échange.",
        functions: ["Sales", "Marketing"],
        dimensions: {
            savoir: [
                "Connaître les leviers d'intérêt : gain, risque, opportunité, pain point.",
                "Connaître les questions qui déclenchent engagement et curiosité.",
                "Comprendre ce qui capte l'attention dès le début d'un échange.",
                "Identifier les angles les plus pertinents selon le profil prospect.",
            ],
            savoir_faire: [
                "Poser une question engageante ou formuler une affirmation impactante.",
                "Utiliser la technique du permission-based au bon moment.",
                "Mettre en avant un bénéfice concret ou un résultat visible.",
                "Adapter le message au profil et au contexte du prospect.",
            ],
            savoir_etre: [
                "Faire preuve de curiosité authentique.",
                "Montrer une écoute active dès les premières secondes.",
                "Dégager du dynamisme sans surjouer.",
                "Donner une impression d'intérêt sincère pour le prospect.",
            ],
        },
    },
    {
        id: "gestion-objections",
        name: "Gestion des objections",
        category: "Métier",
        domain: COMMERCIAL,
        objective: RDV,
        isActive: true,
        description:
            "Capacité à identifier, comprendre et traiter efficacement les objections du prospect en écoutant, en reformulant et en répondant de manière structurée afin de maintenir la dynamique de l'échange.",
        functions: ["Sales", "Customer Success"],
        dimensions: {
            savoir: [
                "Connaître les principales familles d'objections.",
                "Connaître les réponses types aux objections récurrentes.",
                "Connaître les questions de faille permettant de creuser l'objection.",
                "Maîtriser une méthode structurée de traitement des objections.",
            ],
            savoir_faire: [
                "Accueillir l'objection sans la contester trop vite.",
                "Reformuler et approfondir le point de blocage.",
                "Répondre avec un argument structuré et adapté.",
                "Reproposer le rendez-vous en lien avec la valeur apportée.",
            ],
            savoir_etre: [
                "Rester calme face au refus.",
                "Éviter toute posture défensive.",
                "Faire preuve de persévérance maîtrisée.",
                "Maintenir une posture professionnelle stable.",
            ],
        },
    },
    {
        id: "posture-persuasive",
        name: "Posture persuasive",
        category: "Comportementale",
        domain: COMMERCIAL,
        objective: RDV,
        isActive: true,
        description:
            "Capacité à transmettre conviction, assurance et impact relationnel dans son discours afin de renforcer l'adhésion du prospect grâce à une communication crédible, fluide et engageante.",
        functions: ["Sales", "Leadership"],
        dimensions: {
            savoir: [
                "Connaître les principes clés de persuasion.",
                "Comprendre l'impact du ton, du rythme et du choix des mots.",
                "Identifier les formulations qui renforcent la conviction.",
                "Reconnaître les marqueurs de discours hésitant ou affaiblissant.",
            ],
            savoir_faire: [
                "Utiliser un vocabulaire affirmatif et orienté impact.",
                "Employer des silences tactiques après un argument fort.",
                "Adapter son débit à celui du prospect.",
                "Éviter les formulations hésitantes ou affaiblissantes.",
            ],
            savoir_etre: [
                "Dégager de la conviction dans la voix et le discours.",
                "Inspirer une assurance stable.",
                "Conserver une bonne stabilité émotionnelle.",
                "Renforcer son impact relationnel par une présence crédible.",
            ],
        },
    },
    {
        id: "closing-rendez-vous",
        name: "Closing du rendez-vous",
        category: "Métier",
        domain: COMMERCIAL,
        objective: RDV,
        isActive: true,
        description:
            "Capacité à transformer l'échange en engagement concret en proposant explicitement un rendez-vous, au bon moment, avec une formulation claire, directe et orientée vers l'action.",
        functions: ["Sales"],
        dimensions: {
            savoir: [
                "Connaître les principales techniques de closing.",
                "Comprendre l'importance d'une demande explicite.",
                "Identifier le bon moment pour proposer un rendez-vous.",
                "Connaître les formulations qui facilitent la décision.",
            ],
            savoir_faire: [
                "Formuler une proposition de rendez-vous claire et directe.",
                "Utiliser une alternative de temporalité ou de créneaux.",
                "Proposer des options concrètes et précises.",
                "Gérer le silence après la proposition.",
            ],
            savoir_etre: [
                "Faire preuve d'assertivité.",
                "Montrer de la confiance dans la demande.",
                "Adopter une posture claire et décisionnelle.",
                "Rester à l'aise au moment de solliciter l'engagement.",
            ],
        },
    },
    {
        id: "securisation-rendez-vous",
        name: "Sécurisation du rendez-vous",
        category: "Métier",
        domain: COMMERCIAL,
        objective: RDV,
        isActive: true,
        description:
            "Capacité à confirmer, formaliser et fiabiliser le rendez-vous obtenu en validant les éléments logistiques et les conditions nécessaires à sa bonne tenue, afin de réduire le risque d'annulation ou d'imprécision.",
        functions: ["Sales", "Customer Success"],
        dimensions: {
            savoir: [
                "Connaître les éléments à confirmer pour fiabiliser un rendez-vous.",
                "Comprendre ce qui fragilise un rendez-vous pris.",
                "Identifier les informations nécessaires à la bonne préparation du rendez-vous.",
                "Savoir quels éléments logistiques doivent être validés.",
            ],
            savoir_faire: [
                "Reformuler et valider clairement les modalités du rendez-vous.",
                "Confirmer date, heure, format, participants et durée.",
                "Préciser les éléments utiles à la bonne tenue du rendez-vous.",
                "Vérifier le canal de confirmation et les coordonnées nécessaires.",
            ],
            savoir_etre: [
                "Faire preuve de rigueur.",
                "Adopter une attitude professionnelle jusqu'à la fin.",
                "Montrer un vrai sens du détail.",
                "Sécuriser l'engagement sans lourdeur ni confusion.",
            ],
        },
    },
    {
        id: "preparation-commerciale",
        name: "Préparation commerciale",
        category: "Métier",
        domain: ACDC,
        objective: ACCUEILLIR,
        isActive: true,
        description:
            "Capacité à préparer efficacement un entretien commercial en recherchant les informations clés sur le prospect, son entreprise, son secteur et ses enjeux potentiels.",
        functions: ["Sales"],
        dimensions: {
            savoir: [
                "Connaître les sources d'information pertinentes pour préparer un entretien commercial (LinkedIn, site web entreprise...).",
                "Identifier les enjeux clés d'un secteur ou d'une entreprise.",
                "Comprendre l'importance de la préparation dans la réussite commerciale.",
            ],
            savoir_faire: [
                "Rechercher et analyser les informations sur le prospect et son entreprise.",
                "Identifier les points d'accroche et les enjeux business potentiels.",
                "Préparer des questions et des arguments adaptés au contexte.",
            ],
            savoir_etre: ["Être rigoureux et anticiper.", "Être curieux professionnellement.", "Être proactif."],
        },
    },
    {
        id: "creation-relation",
        name: "Création de relation",
        category: "Comportementale",
        domain: ACDC,
        objective: ACCUEILLIR,
        isActive: true,
        description:
            "Capacité à établir rapidement une relation de confiance avec l'interlocuteur dès les premiers échanges, en créant un climat propice à l'échange.",
        functions: ["Sales", "Customer Success"],
        dimensions: {
            savoir: [
                "Connaître les techniques de création de rapport.",
                "Comprendre les éléments qui favorisent la confiance.",
                "Identifier les signaux d'ouverture de l'interlocuteur.",
            ],
            savoir_faire: [
                "Adopter une posture d'écoute et d'ouverture dès le début.",
                "Utiliser des techniques de synchronisation verbale et non-verbale.",
                "Créer un climat de confiance propice à l'échange.",
            ],
            savoir_etre: [
                "Être empathique et authentique.",
                "Être intéressé sincèrement par l'interlocuteur.",
                "Être bienveillant.",
            ],
        },
    },
    {
        id: "credibilite-personnelle",
        name: "Crédibilité personnelle",
        category: "Comportementale",
        domain: ACDC,
        objective: ACCUEILLIR,
        isActive: true,
        description:
            "Capacité à inspirer confiance par sa posture, son expertise et son professionnalisme, en démontrant sa légitimité à mener l'entretien.",
        functions: ["Sales", "Leadership"],
        dimensions: {
            savoir: [
                "Connaître les éléments qui renforcent la crédibilité personnelle.",
                "Comprendre l'impact de la posture et du discours sur la perception.",
                "Identifier les marqueurs d'expertise dans son domaine.",
            ],
            savoir_faire: [
                "Adopter une posture professionnelle assurée.",
                "Démontrer son expertise de façon naturelle et contextuelle.",
                "Utiliser un vocabulaire professionnel adapté.",
            ],
            savoir_etre: [
                "Être assuré sans arrogance.",
                "Être professionnel constamment.",
                "Inspirer confiance par sa présence.",
            ],
        },
    },
    {
        id: "credibilite-societe",
        name: "Crédibilité société",
        category: "Métier",
        domain: ACDC,
        objective: ACCUEILLIR,
        isActive: true,
        description:
            "Capacité à valoriser son entreprise, ses références et sa proposition de valeur de façon crédible pour renforcer la confiance du prospect.",
        functions: ["Sales", "Marketing"],
        dimensions: {
            savoir: [
                "Connaître les éléments de différenciation de son entreprise.",
                "Maîtriser les références et cas clients pertinents.",
                "Comprendre la proposition de valeur selon les segments.",
            ],
            savoir_faire: [
                "Présenter l'entreprise de façon concise et impactante.",
                "Utiliser des références clients pertinentes au bon moment.",
                "Adapter le discours entreprise au contexte du prospect.",
            ],
            savoir_etre: [
                "Être convaincu dans la valorisation.",
                "Être fier professionnellement sans exagération.",
                "Être un ambassadeur crédible.",
            ],
        },
    },
    {
        id: "cadrage-echange",
        name: "Cadrage de l'échange",
        category: "Métier",
        domain: ACDC,
        objective: CADRER,
        isActive: true,
        description:
            "Capacité à poser le cadre de l'entretien en clarifiant l'objectif, le déroulé et les attentes mutuelles pour sécuriser l'engagement du prospect dans le processus.",
        functions: ["Sales", "Customer Success"],
        dimensions: {
            savoir: [
                "Connaître les éléments d'un cadrage efficace.",
                "Comprendre l'importance du cadrage pour la suite de l'entretien.",
                "Identifier les attentes du prospect à clarifier.",
            ],
            savoir_faire: [
                "Présenter l'objectif et le déroulé de l'entretien clairement.",
                "Valider l'accord du prospect sur le cadre proposé.",
                "Adapter le cadrage selon le temps disponible et le contexte.",
            ],
            savoir_etre: [
                "Être clair et structuré.",
                "Être leader dans la conduite de l'entretien.",
                "Être directif de façon mesurée.",
            ],
        },
    },
    {
        id: "comprehension-business",
        name: "Compréhension business du client",
        category: "Métier",
        domain: ACDC,
        objective: DECOUVRIR,
        isActive: true,
        description:
            "Capacité à comprendre le modèle économique, les enjeux business et le contexte stratégique du client pour identifier les opportunités de création de valeur.",
        functions: ["Sales", "Customer Success"],
        dimensions: {
            savoir: [
                "Connaître les indicateurs business clés par secteur.",
                "Comprendre les modèles économiques courants.",
                "Identifier les enjeux stratégiques typiques.",
            ],
            savoir_faire: [
                "Poser des questions pour comprendre le modèle économique.",
                "Identifier les priorités business et les contraintes.",
                "Relier les enjeux business à la proposition de valeur.",
            ],
            savoir_etre: ["Être curieux du business.", "Avoir une vision stratégique.", "Adopter une posture conseil."],
        },
    },
    {
        id: "questionnement-consultatif",
        name: "Questionnement consultatif",
        category: "Métier",
        domain: ACDC,
        objective: DECOUVRIR,
        isActive: true,
        description:
            "Capacité à poser des questions ouvertes, stratégiques et structurées pour faire émerger les besoins, enjeux et opportunités du client.",
        functions: ["Sales", "Customer Success"],
        dimensions: {
            savoir: [
                "Connaître les types de questions consultatives (ouvertes, SPIN, MEDDIC...).",
                "Maîtriser les techniques de questionnement.",
                "Comprendre la progression logique du questionnement.",
            ],
            savoir_faire: [
                "Poser des questions ouvertes et stratégiques.",
                "Structurer le questionnement de façon logique.",
                "Adapter les questions selon les réponses obtenues.",
            ],
            savoir_etre: [
                "Être curieux professionnellement.",
                "Être intéressé sincèrement par les réponses.",
                "Adopter une posture d'écoute active.",
            ],
        },
    },
    {
        id: "ecoute-active-reformulation",
        name: "Écoute active et reformulation intermédiaire",
        category: "Comportementale",
        domain: ACDC,
        objective: DECOUVRIR,
        isActive: true,
        description:
            "Capacité à écouter activement les réponses du client et à reformuler régulièrement pour valider la compréhension et approfondir les points clés.",
        functions: ["Sales", "Customer Success", "Leadership"],
        dimensions: {
            savoir: [
                "Connaître les techniques d'écoute active.",
                "Comprendre l'importance de la reformulation.",
                "Identifier les moments clés pour reformuler.",
            ],
            savoir_faire: [
                "Pratiquer l'écoute active sans interrompre.",
                "Reformuler les points clés régulièrement.",
                "Valider la compréhension avant d'approfondir.",
            ],
            savoir_etre: [
                "Être empathique et attentif.",
                "Être intéressé sincèrement par les réponses.",
                "Adopter une posture d'ouverture.",
            ],
        },
    },
    {
        id: "posture-challenger",
        name: "Posture Challenger",
        category: "Comportementale",
        domain: ACDC,
        objective: DECOUVRIR,
        isActive: true,
        description:
            "Capacité à challenger respectueusement les croyances et hypothèses du client pour faire émerger de nouvelles perspectives et opportunités.",
        functions: ["Sales", "Leadership"],
        dimensions: {
            savoir: [
                "Connaître les principes du Challenger Sale.",
                "Comprendre quand et comment challenger.",
                "Identifier les croyances limitantes à challenger.",
            ],
            savoir_faire: [
                "Challenger respectueusement les hypothèses du client.",
                "Apporter de nouvelles perspectives avec tact.",
                "Équilibrer challenge et empathie.",
            ],
            savoir_etre: [
                "Être assertif de façon mesurée.",
                "Être confiant dans son expertise.",
                "Adopter une posture de conseil.",
            ],
        },
    },
    {
        id: "diagnostic-problemes-impacts",
        name: "Diagnostic des problèmes et impacts",
        category: "Métier",
        domain: ACDC,
        objective: DECOUVRIR,
        isActive: true,
        description:
            "Capacité à identifier et qualifier les problèmes du client ainsi que leurs impacts business pour construire un diagnostic partagé.",
        functions: ["Sales", "Customer Success"],
        dimensions: {
            savoir: [
                "Connaître les méthodologies de diagnostic.",
                "Comprendre les types d'impacts business (coûts, temps, qualité...).",
                "Identifier les problèmes récurrents par secteur.",
            ],
            savoir_faire: [
                "Identifier et qualifier les problèmes du client.",
                "Quantifier les impacts business.",
                "Construire un diagnostic partagé et validé.",
            ],
            savoir_etre: [
                "Être analytique et rigoureux.",
                "Être empathique face aux problèmes.",
                "Adopter une posture de consultant.",
            ],
        },
    },
    {
        id: "identification-besoins-gains",
        name: "Identification des besoins et gains attendus",
        category: "Métier",
        domain: ACDC,
        objective: DECOUVRIR,
        isActive: true,
        description:
            "Capacité à identifier les besoins explicites et implicites du client ainsi que les gains attendus d'une solution pour construire la valeur perçue.",
        functions: ["Sales", "Customer Success"],
        dimensions: {
            savoir: [
                "Connaître la différence entre besoins explicites et implicites.",
                "Comprendre les types de gains attendus (efficacité, croissance, réduction coûts).",
                "Identifier les critères de valeur par secteur.",
            ],
            savoir_faire: [
                "Faire émerger les besoins implicites par le questionnement.",
                "Quantifier les gains attendus avec le client.",
                "Prioriser les besoins selon leur impact business.",
            ],
            savoir_etre: [
                "Être à l'écoute et perspicace.",
                "Être empathique face aux besoins.",
                "Adopter une posture orientée valeur.",
            ],
        },
    },
    {
        id: "construction-pre-achat",
        name: "Construction du pré-achat",
        category: "Métier",
        domain: ACDC,
        objective: DECOUVRIR,
        isActive: true,
        description:
            "Capacité à faire émerger chez le client une vision claire de la solution et de ses bénéfices avant même de présenter formellement l'offre.",
        functions: ["Sales"],
        dimensions: {
            savoir: [
                "Connaître les techniques de construction de vision.",
                "Comprendre le concept de pré-achat mental.",
                "Identifier les signaux d'adhésion à la vision.",
            ],
            savoir_faire: [
                "Faire projeter le client dans la solution idéale.",
                "Co-construire la vision avec le client.",
                "Valider l'adhésion avant de présenter l'offre.",
            ],
            savoir_etre: [
                "Être pédagogue et créatif.",
                "Être enthousiaste de façon mesurée.",
                "Adopter une posture de co-construction.",
            ],
        },
    },
    {
        id: "exploration-freins",
        name: "Exploration des freins",
        category: "Métier",
        domain: ACDC,
        objective: DECOUVRIR,
        isActive: true,
        description:
            "Capacité à identifier et explorer les freins potentiels à l'achat de façon proactive pour les traiter en amont du closing.",
        functions: ["Sales"],
        dimensions: {
            savoir: [
                "Connaître les freins courants à l'achat par secteur.",
                "Comprendre la différence entre freins et objections.",
                "Identifier les signaux de freins non exprimés.",
            ],
            savoir_faire: [
                "Questionner proactivement sur les freins potentiels.",
                "Faire exprimer les craintes et réticences.",
                "Traiter les freins identifiés avant le closing.",
            ],
            savoir_etre: [
                "Être ouvert et non-jugeant.",
                "Être empathique face aux freins.",
                "Adopter une posture rassurante.",
            ],
        },
    },
    {
        id: "analyse-processus-decision",
        name: "Analyse du processus de décision",
        category: "Métier",
        domain: ACDC,
        objective: DECOUVRIR,
        isActive: true,
        description:
            "Capacité à comprendre et cartographier le processus de décision du client, les acteurs impliqués et les étapes de validation.",
        functions: ["Sales"],
        dimensions: {
            savoir: [
                "Connaître les questions clés pour cartographier la décision.",
                "Comprendre les rôles décisionnels (décideur, influenceur, utilisateur).",
                "Identifier les étapes de validation typiques.",
            ],
            savoir_faire: [
                "Questionner sur le processus de décision.",
                "Identifier tous les acteurs impliqués et leur rôle.",
                "Cartographier les étapes de validation nécessaires.",
            ],
            savoir_etre: [
                "Être curieux stratégiquement.",
                "Être tactique dans l'exploration.",
                "Adopter une posture de partenaire.",
            ],
        },
    },
    {
        id: "analyse-concurrence-existant",
        name: "Analyse de la concurrence et de l'existant",
        category: "Métier",
        domain: ACDC,
        objective: DECOUVRIR,
        isActive: true,
        description:
            "Capacité à identifier et analyser les solutions concurrentes ou existantes du client pour construire un positionnement différenciant.",
        functions: ["Sales", "Marketing"],
        dimensions: {
            savoir: [
                "Connaître le paysage concurrentiel de son marché.",
                "Comprendre les forces et faiblesses des concurrents.",
                "Identifier les éléments de différenciation.",
            ],
            savoir_faire: [
                "Questionner sur les solutions existantes et concurrentes.",
                "Identifier les points de satisfaction et d'insatisfaction.",
                "Construire un positionnement différenciant.",
            ],
            savoir_etre: [
                "Être objectif et respectueux.",
                "Être confiant dans sa proposition.",
                "Adopter une posture comparative éthique.",
            ],
        },
    },
    {
        id: "identification-motivations-achat",
        name: "Identification des motivations d'achat",
        category: "Métier",
        domain: ACDC,
        objective: DECOUVRIR,
        isActive: true,
        description:
            "Capacité à identifier les motivations profondes (rationnelles et émotionnelles) qui guident la décision d'achat du client.",
        functions: ["Sales"],
        dimensions: {
            savoir: [
                "Connaître les types de motivations d'achat (SONCAS...).",
                "Comprendre la différence entre motivations rationnelles et émotionnelles.",
                "Identifier les signaux de motivations non exprimées.",
            ],
            savoir_faire: [
                "Faire émerger les motivations par le questionnement.",
                "Identifier les motivations dominantes.",
                "Adapter le discours aux motivations identifiées.",
            ],
            savoir_etre: [
                "Être empathique et fin.",
                "Être à l'écoute des signaux faibles.",
                "Adopter une posture de compréhension profonde.",
            ],
        },
    },
    {
        id: "validation-diagnostic-accord",
        name: "Validation du diagnostic et accord pour avancer",
        category: "Métier",
        domain: ACDC,
        objective: CONFIRMER,
        isActive: true,
        description:
            "Capacité à synthétiser le diagnostic partagé, valider l'alignement avec le client et obtenir son accord pour avancer vers la solution.",
        functions: ["Sales", "Customer Success"],
        dimensions: {
            savoir: [
                "Connaître les éléments d'un diagnostic partagé complet.",
                "Comprendre l'importance de la validation avant la proposition.",
                "Identifier les signaux d'accord et de réserve du client.",
            ],
            savoir_faire: [
                "Synthétiser le diagnostic de façon structurée.",
                "Valider l'alignement point par point avec le client.",
                "Obtenir un accord explicite pour avancer.",
            ],
            savoir_etre: [
                "Être clair et synthétique.",
                "Être rigoureux dans la validation.",
                "Adopter une posture de co-construction.",
            ],
        },
    },
    {
        id: "pilotage-entretien",
        name: "Pilotage de l'entretien",
        category: "Transversale",
        domain: ACDC,
        objective: TRANSVERSE,
        isActive: true,
        description:
            "Capacité à conduire l'entretien commercial de façon structurée, en gérant le temps, les transitions et la progression vers l'objectif.",
        functions: ["Sales", "Customer Success", "Leadership"],
        dimensions: {
            savoir: [
                "Connaître les étapes clés d'un entretien commercial.",
                "Comprendre les techniques de gestion du temps.",
                "Identifier les signaux pour ajuster le pilotage.",
            ],
            savoir_faire: [
                "Structurer et conduire l'entretien de façon fluide.",
                "Gérer le temps et les transitions entre étapes.",
                "Recentrer l'échange vers l'objectif si nécessaire.",
            ],
            savoir_etre: [
                "Être leader et assertif.",
                "Être flexible dans la conduite.",
                "Adopter une posture de guide.",
            ],
        },
    },
    {
        id: "communication-professionnelle",
        name: "Communication professionnelle",
        category: "Transversale",
        domain: ACDC,
        objective: TRANSVERSE,
        isActive: true,
        description:
            "Capacité à communiquer de façon claire, structurée et professionnelle tout au long de l'entretien, en adaptant son style au contexte et à l'interlocuteur.",
        functions: ["Sales", "Customer Success", "Leadership", "Marketing"],
        dimensions: {
            savoir: [
                "Connaître les principes de communication professionnelle.",
                "Comprendre l'impact du verbal et du non-verbal.",
                "Identifier les styles de communication par profil.",
            ],
            savoir_faire: [
                "Communiquer de façon claire et structurée.",
                "Adapter son style de communication à l'interlocuteur.",
                "Utiliser un vocabulaire professionnel adapté.",
            ],
            savoir_etre: [
                "Être clair et précis.",
                "Être flexible dans sa communication.",
                "Adopter une posture professionnelle constante.",
            ],
        },
    },
];

export const skillCategoryStyles: Record<SkillCategory, { bg: string; border: string; text: string }> = {
    Métier: { bg: "#EFF6FF", border: "#93C5FD", text: "#2563EB" },
    Comportementale: { bg: "#FAF5FF", border: "#D8B4FE", text: "#9333EA" },
    Transversale: { bg: "#ECFDF5", border: "#6EE7B7", text: "#059669" },
};

export const skillDomainOptions = ["Tous les domaines", "Commercial", "Méthode ACDC"];

export const skillTypeOptions = ["Tous les types", "Métier", "Comportementale", "Transversale"];

export const skillFunctionOptions = [
    "Toutes les fonctions",
    "Sales",
    "Marketing",
    "Customer Success",
    "Product",
    "Operations",
    "Finance",
    "HR",
    "Leadership",
];

export const skillObjectiveOptions = [
    "Tous les objectifs",
    "Prise de rendez-vous prospect qualifié",
    "Méthode AC/DC - Étape Accueillir",
    "Méthode AC/DC - Étape Cadrer",
    "Méthode AC/DC - Étape Découvrir",
    "Méthode AC/DC - Étape Confirmer",
    "Méthode AC/DC - Compétence Transverse",
];
