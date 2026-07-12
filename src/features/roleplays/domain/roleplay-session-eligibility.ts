export const MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS = 30;

export const ROLEPLAY_SESSION_EVALUATION_SKIP_REASON = {
    durationBelowMinimum: "duration_below_minimum",
} as const;

export type RoleplaySessionEvaluationSkipReason =
    (typeof ROLEPLAY_SESSION_EVALUATION_SKIP_REASON)[keyof typeof ROLEPLAY_SESSION_EVALUATION_SKIP_REASON];

export interface RoleplaySessionEvaluationDecision {
    eligible: boolean;
    minimumDurationSeconds: number;
    skipReason: RoleplaySessionEvaluationSkipReason | null;
}

export function isRoleplaySessionEligibleForEvaluation(durationSeconds: number | null | undefined) {
    return (
        typeof durationSeconds === "number" &&
        Number.isFinite(durationSeconds) &&
        durationSeconds >= MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS
    );
}

export function getRoleplaySessionEvaluationDecision(
    durationSeconds: number | null | undefined,
): RoleplaySessionEvaluationDecision {
    const eligible = isRoleplaySessionEligibleForEvaluation(durationSeconds);

    return {
        eligible,
        minimumDurationSeconds: MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
        skipReason: eligible ? null : ROLEPLAY_SESSION_EVALUATION_SKIP_REASON.durationBelowMinimum,
    };
}
