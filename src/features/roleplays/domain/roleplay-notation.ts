export const ROLEPLAY_NOTATION_SOURCE = {
    legacyPdf: "legacy_pdf",
    scorecard: "scorecard",
} as const;

export type RoleplayNotationSource = (typeof ROLEPLAY_NOTATION_SOURCE)[keyof typeof ROLEPLAY_NOTATION_SOURCE];

export const ROLEPLAY_NOTATION_STATUS = {
    completed: "completed",
    failed: "failed",
    notStarted: "not_started",
    processing: "processing",
    skipped: "skipped",
} as const;

export type RoleplayNotationStatus = (typeof ROLEPLAY_NOTATION_STATUS)[keyof typeof ROLEPLAY_NOTATION_STATUS];

/** Limite métier commune aux prompts, à la normalisation et aux vues de notation. */
export const MAX_ROLEPLAY_PROGRESS_PLAN_ITEMS = 3;

export function isForcedRoleplayNotationRegeneration(value: unknown): value is true {
    return value === true;
}

export function shouldReuseCompletedRoleplayNotation({
    forceRegeneration,
    hasNotation,
    notationStatus,
}: {
    forceRegeneration: boolean;
    hasNotation: boolean;
    notationStatus: string | null;
}) {
    return !forceRegeneration && hasNotation && notationStatus === ROLEPLAY_NOTATION_STATUS.completed;
}

export interface RoleplayNotationStepRef {
    code: string;
    methodStepId: string | null;
    order: number;
    ref: string;
    scorecardStepId: string;
    title: string;
    weightPercent: number;
}

export interface RoleplayNotationCriterionRef {
    criterionKey: string;
    dimension: "savoir" | "savoir_faire" | "savoir_etre";
    dimensionItemId: string | null;
    dimensionItemLabel: string | null;
    expectedEvidence: string;
    maxPoints: number;
    methodStepId: string | null;
    ref: string;
    scorecardCriterionId: string;
    scorecardStepId: string;
    skillId: string;
    skillName: string;
    stepOrder: number;
    stepRef: string;
    stepTitle: string;
    verbatim: string;
}

export interface RoleplayNotationCriterionResult {
    advice: string;
    coachComment: string;
    evidence: string;
    pointsAwarded: number;
    pointsMax: number;
    ref: string;
    scorePercent: number;
}

export interface RoleplayNotationStepResult {
    coachComment: string;
    criteria: RoleplayNotationCriterionResult[];
    methodStepId: string | null;
    pointsAwarded: number;
    pointsMax: number;
    scorePercent: number;
    scorecardStepId: string;
    stepOrder: number;
    title: string;
    weightPercent: number;
}

export interface RoleplayNotationScoreResult {
    criteria: RoleplayNotationCriterionResult[];
    globalScorePercent: number;
    pointsAwarded: number;
    pointsMax: number;
    steps: RoleplayNotationStepResult[];
}
