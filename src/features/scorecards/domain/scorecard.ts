import {
    CONTENT_VISIBILITY_SCOPE,
    CONTENT_VISIBILITY_CHOICE,
    CONTENT_VISIBILITY_CHOICE_DESCRIPTIONS,
    CONTENT_VISIBILITY_CHOICE_LABELS,
    CONTENT_VISIBILITY_CHOICES,
    type ContentStatus,
    type OrganizationContentVisibilityScope,
    type ContentVisibilityChoice,
} from "@/features/content/domain";
import type { MethodSelectionOption } from "@/features/methods/domain/method";
import type { SkillDimension } from "@/features/skills/domain/skills";

function encodeRouteSegment(value: string) {
    return encodeURIComponent(value);
}

export const SCORECARD_ROUTES = {
    api: {
        collection: "/api/scorecards",
        detail: (scorecardId: string) => `/api/scorecards/${encodeRouteSegment(scorecardId)}`,
        duplicate: (scorecardId: string) => `/api/scorecards/${encodeRouteSegment(scorecardId)}/duplicate`,
    },
    app: {
        collection: "/scorecards",
        create: "/scorecards/new",
        detail: (scorecardId: string) => `/scorecards/${encodeRouteSegment(scorecardId)}`,
        edit: (scorecardId: string) => `/scorecards/${encodeRouteSegment(scorecardId)}/edit`,
    },
} as const;

export const SCORECARD_VISIBILITY = CONTENT_VISIBILITY_CHOICE;

export const SCORECARD_VISIBILITIES = CONTENT_VISIBILITY_CHOICES;

export type ScorecardVisibility = ContentVisibilityChoice;

export const SCORECARD_VISIBILITY_LABELS = CONTENT_VISIBILITY_CHOICE_LABELS;

export const SCORECARD_VISIBILITY_DESCRIPTIONS = CONTENT_VISIBILITY_CHOICE_DESCRIPTIONS;

export const SCORECARD_SCOPE = {
    organization: CONTENT_VISIBILITY_SCOPE.organization,
    public: CONTENT_VISIBILITY_SCOPE.public,
} as const;

export type ScorecardScope = OrganizationContentVisibilityScope;

export const SCORECARD_CRITERION_DIMENSIONS = ["savoir_faire", "savoir_etre"] as const satisfies readonly SkillDimension[];

export type ScorecardCriterionDimension = (typeof SCORECARD_CRITERION_DIMENSIONS)[number];

export const SCORECARD_CRITERION_DIMENSION_LABELS: Record<ScorecardCriterionDimension, string> = {
    savoir_etre: "Savoir-être",
    savoir_faire: "Savoir-faire",
};

export type ScorecardMethodOption = MethodSelectionOption;

export interface ScorecardOrganizationOption {
    id: string;
    name: string;
}

export interface ScorecardMethodStep {
    id: string;
    order: number;
    title: string;
}

export interface ScorecardListItem {
    category: string;
    criteriaCount: number;
    description: string;
    domain: string;
    id: string;
    level: string;
    methodName: string;
    name: string;
    status: ContentStatus;
    stepCount: number;
    visibility: ScorecardVisibility;
}

export interface ScorecardCriterion {
    aiInstruction: string;
    competenceId: string;
    dimension: ScorecardCriterionDimension;
    dimensionItemId: string | null;
    expectedEvidence: string;
    id: string;
    key: string;
    maxPoints: number;
    order: number;
    verbatim: string;
}

export interface ScorecardStep {
    criteria: ScorecardCriterion[];
    id: string;
    methodStepId: string;
    name: string;
    order: number;
    weightPercent: number;
}

export interface ScorecardDetail extends ScorecardListItem {
    createdAt: string | null;
    methodId: string;
    organizationId: string | null;
    steps: ScorecardStep[];
}

export function scorecardVisibilityToScope(visibility: ScorecardVisibility): ScorecardScope {
    return visibility === SCORECARD_VISIBILITY.private ? SCORECARD_SCOPE.organization : SCORECARD_SCOPE.public;
}

export function scorecardScopeToVisibility(scope: string | null | undefined): ScorecardVisibility {
    return scope === SCORECARD_SCOPE.organization ? SCORECARD_VISIBILITY.private : SCORECARD_VISIBILITY.public;
}
