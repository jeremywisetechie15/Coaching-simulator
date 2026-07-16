import {
    CONTENT_DOMAINS,
    CONTENT_VISIBILITY_SCOPE,
    CONTENT_VISIBILITY_SCOPE_LABELS,
    CONTENT_VISIBILITY_SCOPES,
    type ContentStatus,
    type ContentVisibilityScope,
} from "@/features/content/domain";

export const SKILL_CATEGORIES = ["Métier", "Comportementale", "Transversale"] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const SKILL_VISIBILITY_SCOPE = CONTENT_VISIBILITY_SCOPE;

export const SKILL_VISIBILITY_SCOPES = CONTENT_VISIBILITY_SCOPES;

export type SkillVisibilityScope = ContentVisibilityScope;

export const SKILL_VISIBILITY_SCOPE_LABELS = CONTENT_VISIBILITY_SCOPE_LABELS;

export interface SkillDimensions {
    /** Savoir — « Knowledge requis » */
    savoir: string[];
    /** Savoir-faire — « Dimensions pratiques » */
    savoir_faire: string[];
    /** Savoir-être — « Dimensions comportementales » */
    savoir_etre: string[];
}

export type SkillDimension = keyof SkillDimensions;

/** Libellés des 3 dimensions tels qu'affichés sur le site (identiques pour toutes les compétences). */
export const SKILL_DIMENSIONS = ["savoir", "savoir_faire", "savoir_etre"] as const;

export const SKILL_DIMENSION_TITLES: Record<SkillDimension, string> = {
    savoir: "Savoir",
    savoir_faire: "Savoir-faire",
    savoir_etre: "Savoir-être",
};

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
    groupId: string | null;
    id: string;
    isActive: boolean;
    name: string;
    organizationId: string | null;
    scope: SkillVisibilityScope;
    status: ContentStatus;
    assignedUserId: string | null;
}

export interface SkillDetail extends SkillListItem {
    dimensionItems: SkillDimensionItem[];
}

export interface SkillOption {
    dimensionItems: SkillDimensionItem[];
    domain: string;
    id: string;
    name: string;
}

export const skillCategoryStyles: Record<SkillCategory, { bg: string; border: string; text: string }> = {
    Métier: { bg: "#EFF6FF", border: "#93C5FD", text: "#2563EB" },
    Comportementale: { bg: "#FAF5FF", border: "#D8B4FE", text: "#9333EA" },
    Transversale: { bg: "#ECFDF5", border: "#6EE7B7", text: "#059669" },
};

export const skillDomainOptions = ["Tous les domaines", ...CONTENT_DOMAINS];

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
