export const SCORECARD_USAGE_EDIT_RESTRICTION_MESSAGE =
    "Cette scorecard est déjà utilisée. Seuls les champs texte et numériques existants peuvent être modifiés.";

export interface ScorecardUsageLockedCriterion {
    competenceId: string | null;
    dimension: string | null;
    dimensionItemId: string | null;
    id: string | null;
}

export interface ScorecardUsageLockedStep {
    criteria: ScorecardUsageLockedCriterion[];
    id: string | null;
    methodStepId: string;
    order: number;
}

export interface ScorecardUsageLockedConfiguration {
    category: string | null;
    domain: string | null;
    level: string | null;
    methodId: string;
    organizationId: string | null;
    steps: ScorecardUsageLockedStep[];
    visibility: string;
}

export function hasScorecardUsageLockedConfigurationChanged(
    current: ScorecardUsageLockedConfiguration,
    next: ScorecardUsageLockedConfiguration,
) {
    return JSON.stringify(current) !== JSON.stringify(next);
}
