import {
    CONTENT_VISIBILITY_SCOPE,
    CONTENT_VISIBILITY_SCOPE_LABELS,
    CONTENT_VISIBILITY_SCOPES,
    type ContentCategory,
    type ContentDomain,
    type ContentStatus,
    type ContentVisibilityScope,
    type EntitySelectionAvailability,
} from "@/features/content/domain";

function encodeRouteSegment(value: string) {
    return encodeURIComponent(value);
}

export const SKILL_ROUTES = {
    api: {
        collection: "/api/skills",
        detail: (skillId: string) => `/api/skills/${encodeRouteSegment(skillId)}`,
        duplicate: (skillId: string) => `/api/skills/${encodeRouteSegment(skillId)}/duplicate`,
    },
    app: {
        collection: "/skills",
        create: "/skills/new",
        detail: (skillId: string) => `/skills/${encodeRouteSegment(skillId)}`,
        edit: (skillId: string) => `/skills/${encodeRouteSegment(skillId)}/edit`,
    },
} as const;

export const SKILL_TYPES = ["Métier", "Comportementale", "Transversale"] as const;

export type SkillType = (typeof SKILL_TYPES)[number];

export function isSkillType(value: string | null | undefined): value is SkillType {
    return Boolean(value) && SKILL_TYPES.includes(value as SkillType);
}

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

/** Libellés SSOT des niveaux de maîtrise d'une compétence. */
export const SKILL_LEVEL = {
    weak: "Faible",
    needsStrengthening: "À renforcer",
    progressing: "En progression",
    mastered: "Maîtrisée",
} as const;

export type SkillLevel = (typeof SKILL_LEVEL)[keyof typeof SKILL_LEVEL];

/** Seuils SSOT, ordonnés du niveau le plus faible au plus élevé. */
export const SKILL_LEVEL_DEFINITIONS = [
    { level: SKILL_LEVEL.weak, minimumScore: 0 },
    { level: SKILL_LEVEL.needsStrengthening, minimumScore: 40 },
    { level: SKILL_LEVEL.progressing, minimumScore: 60 },
    { level: SKILL_LEVEL.mastered, minimumScore: 80 },
] as const satisfies readonly {
    level: SkillLevel;
    minimumScore: number;
}[];

export const SKILL_LEVELS: readonly SkillLevel[] = SKILL_LEVEL_DEFINITIONS.map(
    ({ level }) => level,
);

/** Déduit le niveau de maîtrise à partir d'un score (0-100). */
export function getSkillLevel(score: number): SkillLevel {
    return SKILL_LEVEL_DEFINITIONS.reduce<SkillLevel>(
        (level, definition) =>
            score >= definition.minimumScore ? definition.level : level,
        SKILL_LEVEL.weak,
    );
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
    category: ContentCategory | null;
    description: string;
    domain: ContentDomain | null;
    groupId: string | null;
    id: string;
    isActive: boolean;
    name: string;
    organizationId: string | null;
    scope: SkillVisibilityScope;
    status: ContentStatus;
    type: SkillType;
    assignedUserId: string | null;
}

export interface SkillMethodFilterOption {
    id: string;
    name: string;
}

export interface SkillMethodFilterData {
    methodIdsBySkillId: Record<string, string[]>;
    methodOptions: SkillMethodFilterOption[];
}

export interface SkillDetail extends SkillListItem {
    dimensionItems: SkillDimensionItem[];
}

export interface SkillEditorDetail extends SkillDetail {
    hasProtectedUsage: boolean;
}

export interface SkillOption extends EntitySelectionAvailability {
    dimensionItems: SkillDimensionItem[];
    domain: ContentDomain | null;
    id: string;
    name: string;
}

export const skillTypeOptions = ["Tous les types", ...SKILL_TYPES];
