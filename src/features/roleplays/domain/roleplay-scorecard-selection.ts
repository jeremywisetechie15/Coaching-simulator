import type { RoleplayScorecardOption } from "./roleplay";

export interface RoleplayScorecardSelectionCandidate {
    id: string;
    isSelectable?: boolean;
    methodId: string | null;
}

export function isRoleplayScorecardAssignableForMethod(
    scorecard: RoleplayScorecardSelectionCandidate,
    methodId: string | null | undefined,
) {
    return Boolean(
        methodId &&
        scorecard.isSelectable !== false &&
        scorecard.methodId === methodId,
    );
}

export function getAssignableRoleplayScorecardOptions(
    scorecards: readonly RoleplayScorecardOption[],
    methodId: string | null | undefined,
) {
    return scorecards.filter((scorecard) =>
        isRoleplayScorecardAssignableForMethod(scorecard, methodId),
    );
}
