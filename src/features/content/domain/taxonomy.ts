/**
 * Source unique de vérité (SSOT) pour la taxonomie des contenus.
 *
 * Les codes sont les identifiants stables de la nomenclature. Les libellés sont
 * les valeurs affichées dans l'interface et échangées dans les fichiers JSON.
 * Toutes les listes dérivées doivent être construites depuis ce catalogue.
 */

export const CONTENT_TAXONOMY = [
    {
        categories: [
            { code: "D01-C01", label: "Management des équipes" },
            { code: "D01-C02", label: "Leadership et engagement" },
            { code: "D01-C03", label: "Management transversal et à distance" },
            { code: "D01-C04", label: "Management individuel" },
            { code: "D01-C05", label: "Pilotage de la performance" },
            { code: "D01-C06", label: "Conduite du changement" },
            { code: "D01-C07", label: "Gestion de projet et de programme" },
            { code: "D01-C08", label: "Agilité et gestion de produit" },
            { code: "D01-C09", label: "Innovation et créativité" },
            { code: "D01-C10", label: "Délégation" },
            { code: "D01-C11", label: "Entretien de Remobilisation" },
            { code: "D01-C12", label: "Feedback" },
        ],
        code: "D01",
        label: "Management, stratégie et transformation",
    },
    {
        categories: [
            { code: "D02-C01", label: "Prise de rendez-vous" },
            { code: "D02-C02", label: "Entretien vente-conseil" },
            { code: "D02-C03", label: "Entretien Suivi et Satisfaction" },
            { code: "D02-C04", label: "Proposition et Argumentation commerciale" },
            { code: "D02-C05", label: "Rebond commercial et ventes additionnelles" },
            { code: "D02-C06", label: "Négociation commerciale" },
            { code: "D02-C07", label: "Traitement des objections" },
            { code: "D02-C08", label: "Techniques de closing" },
            { code: "D02-C09", label: "Recommandation Client" },
            { code: "D02-C10", label: "Réseaux et prescripteurs" },
            { code: "D02-C11", label: "Prospection" },
            { code: "D02-C12", label: "Vente" },
        ],
        code: "D02",
        label: "Commerce et développement commercial",
    },
    {
        categories: [
            { code: "D03-C01", label: "Études de marché et veille concurrentielle" },
            { code: "D03-C02", label: "Marketing stratégique" },
            { code: "D03-C03", label: "Segmentation, ciblage et positionnement" },
            { code: "D03-C04", label: "Marketing de l’offre, des produits et des services" },
            { code: "D03-C05", label: "Politique tarifaire" },
            { code: "D03-C06", label: "Marketing opérationnel" },
            { code: "D03-C07", label: "Marketing digital et acquisition" },
            { code: "D03-C08", label: "Marketing de contenu et réseaux sociaux" },
            { code: "D03-C09", label: "Communication de marque et institutionnelle" },
            { code: "D03-C10", label: "Communication interne, relations presse et événementiel" },
        ],
        code: "D03",
        label: "Marketing et communication de marque",
    },
    {
        categories: [
            { code: "D04-C01", label: "Accueil et posture relationnelle" },
            { code: "D04-C02", label: "Connaissance et culture client" },
            { code: "D04-C03", label: "Écoute, conseil et personnalisation" },
            { code: "D04-C04", label: "Parcours et expérience client" },
            { code: "D04-C05", label: "Relation client à distance et omnicanale" },
            { code: "D04-C06", label: "Qualité de service" },
            { code: "D04-C07", label: "Satisfaction et fidélisation" },
            { code: "D04-C08", label: "Gestion des réclamations et insatisfactions" },
            { code: "D04-C09", label: "Gestion des clients difficiles" },
            { code: "D04-C10", label: "Customer Success" },
        ],
        code: "D04",
        label: "Relation client et expérience client",
    },
    {
        categories: [
            { code: "D05-C01", label: "Communication orale et écrite" },
            { code: "D05-C02", label: "Écoute, questionnement et reformulation" },
            { code: "D05-C03", label: "Assertivité et communication non violente" },
            { code: "D05-C04", label: "Prise de parole et storytelling" },
            { code: "D05-C05", label: "Animation de réunions et conduite d’entretiens" },
            { code: "D05-C06", label: "Communication managériale et collective" },
            { code: "D05-C07", label: "Communication interculturelle" },
            { code: "D05-C08", label: "Influence et persuasion" },
            { code: "D05-C09", label: "Gestion des conflits et médiation" },
            { code: "D05-C10", label: "Communication de crise" },
        ],
        code: "D05",
        label: "Communication et efficacité relationnelle",
    },
    {
        categories: [
            { code: "D06-C01", label: "Recrutement et marque employeur" },
            { code: "D06-C02", label: "Intégration des collaborateurs" },
            { code: "D06-C03", label: "Gestion des emplois, talents et mobilités" },
            { code: "D06-C04", label: "Évaluation de la performance" },
            { code: "D06-C05", label: "Rémunération et avantages sociaux" },
            { code: "D06-C06", label: "Droit social et relations sociales" },
            { code: "D06-C07", label: "Diversité, inclusion et handicap" },
            { code: "D06-C08", label: "Ingénierie de formation et pédagogique" },
            { code: "D06-C09", label: "Animation, tutorat et transmission" },
            { code: "D06-C10", label: "Coaching et mentorat" },
        ],
        code: "D06",
        label: "Ressources humaines et développement des compétences",
    },
    {
        categories: [
            { code: "D07-C01", label: "Gestion du temps et des priorités" },
            { code: "D07-C02", label: "Organisation et gestion de la charge de travail" },
            { code: "D07-C03", label: "Connaissance de soi et confiance en soi" },
            { code: "D07-C04", label: "Intelligence émotionnelle" },
            { code: "D07-C05", label: "Gestion du stress et résilience" },
            { code: "D07-C06", label: "Adaptabilité et autonomie" },
            { code: "D07-C07", label: "Esprit critique et prise de décision" },
            { code: "D07-C08", label: "Résolution de problèmes et créativité" },
            { code: "D07-C09", label: "Coopération et travail en équipe" },
            { code: "D07-C10", label: "Gestion de carrière et posture professionnelle" },
        ],
        code: "D07",
        label: "Développement personnel et efficacité professionnelle",
    },
    {
        categories: [
            { code: "D08-C01", label: "Comptabilité" },
            { code: "D08-C02", label: "Finance et analyse financière" },
            { code: "D08-C03", label: "Trésorerie, budget et contrôle de gestion" },
            { code: "D08-C04", label: "Fiscalité" },
            { code: "D08-C05", label: "Droit des affaires, contrats et propriété intellectuelle" },
            { code: "D08-C06", label: "Conformité, éthique et déontologie" },
            { code: "D08-C07", label: "Prévention de la fraude et lutte contre le blanchiment" },
            { code: "D08-C08", label: "Gestion des risques et contrôle interne" },
            { code: "D08-C09", label: "Audit" },
            { code: "D08-C10", label: "Protection des données et RGPD" },
        ],
        code: "D08",
        label: "Finance, droit, conformité et maîtrise des risques",
    },
    {
        categories: [
            { code: "D09-C01", label: "Management de la qualité" },
            { code: "D09-C02", label: "Amélioration continue et Lean management" },
            { code: "D09-C03", label: "Gestion des processus et des opérations" },
            { code: "D09-C04", label: "Résolution de problèmes opérationnels" },
            { code: "D09-C05", label: "Achats, sourcing et négociation fournisseurs" },
            { code: "D09-C06", label: "Gestion des fournisseurs et achats responsables" },
            { code: "D09-C07", label: "Approvisionnement et supply chain" },
            { code: "D09-C08", label: "Stocks et logistique" },
            { code: "D09-C09", label: "Gestion administrative et documentaire" },
            { code: "D09-C10", label: "Accueil, secrétariat et services généraux" },
        ],
        code: "D09",
        label: "Performance opérationnelle et fonctions support",
    },
    {
        categories: [
            { code: "D10-C01", label: "Culture et transformation numériques" },
            { code: "D10-C02", label: "Bureautique et outils collaboratifs" },
            { code: "D10-C03", label: "Intelligence artificielle générative et prompting" },
            { code: "D10-C04", label: "Agents IA et automatisation" },
            { code: "D10-C05", label: "Analyse de données et statistiques" },
            { code: "D10-C06", label: "Business intelligence et visualisation" },
            { code: "D10-C07", label: "Gouvernance et qualité des données" },
            { code: "D10-C08", label: "Développement informatique" },
            { code: "D10-C09", label: "Systèmes d’information, cloud et réseaux" },
            { code: "D10-C10", label: "Cybersécurité" },
        ],
        code: "D10",
        label: "Numérique, data et technologies",
    },
    {
        categories: [
            { code: "D11-C01", label: "Stratégie et gouvernance RSE" },
            { code: "D11-C02", label: "Développement durable et réglementation" },
            { code: "D11-C03", label: "Climat, bilan carbone et décarbonation" },
            { code: "D11-C04", label: "Biodiversité" },
            { code: "D11-C05", label: "Économie circulaire, écoconception et déchets" },
            { code: "D11-C06", label: "Énergie et sobriété" },
            { code: "D11-C07", label: "Achats responsables et finance durable" },
            { code: "D11-C08", label: "Reporting de durabilité" },
            { code: "D11-C09", label: "Santé, sécurité et prévention des risques professionnels" },
            { code: "D11-C10", label: "QVCT, risques psychosociaux et bien-être au travail" },
        ],
        code: "D11",
        label: "RSE, environnement, santé et qualité de vie au travail",
    },
] as const;

export type ContentTaxonomyDomain = (typeof CONTENT_TAXONOMY)[number];
export type ContentDomainCode = ContentTaxonomyDomain["code"];
export type ContentDomain = ContentTaxonomyDomain["label"];
export type ContentTaxonomyCategory = ContentTaxonomyDomain["categories"][number];
export type ContentCategoryCode = ContentTaxonomyCategory["code"];
export type ContentCategory = ContentTaxonomyCategory["label"];

export const CONTENT_DOMAINS = CONTENT_TAXONOMY.map(({ label }) => label) as [
    ContentDomain,
    ...ContentDomain[],
];

export const CONTENT_DOMAIN_CODES = CONTENT_TAXONOMY.map(({ code }) => code) as [
    ContentDomainCode,
    ...ContentDomainCode[],
];

export const CONTENT_CATEGORIES_BY_DOMAIN = Object.fromEntries(
    CONTENT_TAXONOMY.map(({ categories, label }) => [
        label,
        categories.map((category) => category.label),
    ]),
) as unknown as Record<ContentDomain, readonly ContentCategory[]>;

export const CONTENT_LEVELS = ["Débutant", "Moyen", "Avancé", "Expert"] as const;

export type ContentLevel = (typeof CONTENT_LEVELS)[number];

export function isContentDomain(value: string | null | undefined): value is ContentDomain {
    return Boolean(value) && CONTENT_DOMAINS.includes(value as ContentDomain);
}

export function isContentDomainCode(
    value: string | null | undefined,
): value is ContentDomainCode {
    return Boolean(value) && CONTENT_DOMAIN_CODES.includes(value as ContentDomainCode);
}

export function getCategoriesForDomain(
    domain: string | null | undefined,
): readonly ContentCategory[] {
    return isContentDomain(domain) ? CONTENT_CATEGORIES_BY_DOMAIN[domain] : [];
}

export function isContentCategoryForDomain(
    domain: string | null | undefined,
    category: string | null | undefined,
): category is ContentCategory {
    return Boolean(category) && getCategoriesForDomain(domain).includes(category as ContentCategory);
}

export function getContentDomainByCode(
    code: string | null | undefined,
): ContentTaxonomyDomain | null {
    return CONTENT_TAXONOMY.find((domain) => domain.code === code) ?? null;
}

export function getContentDomainCode(
    domain: string | null | undefined,
): ContentDomainCode | null {
    return CONTENT_TAXONOMY.find((candidate) => candidate.label === domain)?.code ?? null;
}

export function getContentCategoryCode(
    domain: string | null | undefined,
    category: string | null | undefined,
): ContentCategoryCode | null {
    if (!isContentDomain(domain) || !category) {
        return null;
    }

    return CONTENT_TAXONOMY.find((candidate) => candidate.label === domain)
        ?.categories.find((candidate) => candidate.label === category)?.code ?? null;
}

export const ALL_CONTENT_CATEGORIES = Array.from(
    new Set(CONTENT_TAXONOMY.flatMap(({ categories }) => categories.map(({ label }) => label))),
) as ContentCategory[];
