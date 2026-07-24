/**
 * Source unique de vérité (SSOT) pour les domaines, catégories et niveaux de contenu.
 *
 * Déclarés ici une seule fois puis réutilisés par toutes les features
 * (évaluations, scorecards, méthodes, …) — ne pas redéclarer ces listes ailleurs.
 */

export const CONTENT_DOMAINS = [
    "Commercial",
    "Relation client",
    "Management",
    "Communication",
    "Ressources humaines",
] as const;

export type ContentDomain = (typeof CONTENT_DOMAINS)[number];

/** Catégories disponibles pour chaque domaine. */
export const CONTENT_CATEGORIES_BY_DOMAIN = {
    Commercial: ["Prospection", "Négociation", "Vente", "Recommandation", "Prise de rendez-vous"],
    "Relation client": ["Gestion des conflits", "Accueil client"],
    Communication: ["Prise de parole", "Communication écrite", "Gestion des conflits"],
    Management: ["Entretien de Remobilisation", "Feedback", "Pilotage"],
    "Ressources humaines": ["Recrutement", "Onboarding"],
} as const satisfies Record<ContentDomain, readonly string[]>;

export type ContentCategory = (typeof CONTENT_CATEGORIES_BY_DOMAIN)[ContentDomain][number];

export const CONTENT_LEVELS = ["Débutant", "Moyen", "Avancé", "Expert"] as const;

export type ContentLevel = (typeof CONTENT_LEVELS)[number];

/** Catégories d'un domaine (vide si aucun domaine sélectionné ou domaine inconnu). */
export function isContentDomain(value: string | null | undefined): value is ContentDomain {
    return Boolean(value) && CONTENT_DOMAINS.includes(value as ContentDomain);
}

export function getCategoriesForDomain(domain: string | null | undefined): readonly ContentCategory[] {
    if (!isContentDomain(domain)) {
        return [];
    }

    return CONTENT_CATEGORIES_BY_DOMAIN[domain];
}

export function isContentCategoryForDomain(
    domain: string | null | undefined,
    category: string | null | undefined,
): category is ContentCategory {
    if (!category) {
        return false;
    }

    return getCategoriesForDomain(domain).some((candidate) => candidate === category);
}

/** Toutes les catégories, tous domaines confondus (dédupliquées). */
export const ALL_CONTENT_CATEGORIES = Array.from(
    new Set(Object.values(CONTENT_CATEGORIES_BY_DOMAIN).flat()),
) as ContentCategory[];
