import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";

export interface UserTargetContext {
    groupIds: string[];
    organizationIds: string[];
}

export type UserVisibleAssignmentScope =
    | { scope: typeof CONTENT_VISIBILITY_SCOPE.public }
    | { assignedUserId: string; scope: typeof CONTENT_VISIBILITY_SCOPE.user }
    | { groupIds: string[]; scope: typeof CONTENT_VISIBILITY_SCOPE.group }
    | { organizationIds: string[]; scope: typeof CONTENT_VISIBILITY_SCOPE.organization };

export const USER_VISIBLE_ASSIGNMENT_ACTIVE = true;
export const USER_VISIBLE_ASSIGNMENT_STATUS = CONTENT_STATUS.published;

export function getUserVisibleAssignmentScopes(
    userId: string,
    context: UserTargetContext,
): UserVisibleAssignmentScope[] {
    return [
        { scope: CONTENT_VISIBILITY_SCOPE.public },
        { assignedUserId: userId, scope: CONTENT_VISIBILITY_SCOPE.user },
        ...(context.groupIds.length > 0
            ? [{ groupIds: context.groupIds, scope: CONTENT_VISIBILITY_SCOPE.group } as const]
            : []),
        ...(context.organizationIds.length > 0
            ? [{ organizationIds: context.organizationIds, scope: CONTENT_VISIBILITY_SCOPE.organization } as const]
            : []),
    ];
}

export function normalizeAssignmentScore(value: number | string | null | undefined) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(0, Math.min(100, Math.round(value)));
    }

    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value.replace("%", "").trim());
        if (Number.isFinite(parsed)) {
            return Math.max(0, Math.min(100, Math.round(parsed)));
        }
    }

    return null;
}

export function extractAssignmentScore(notationJson: unknown): number | null {
    if (!notationJson || typeof notationJson !== "object") {
        return null;
    }

    const record = notationJson as Record<string, unknown>;
    const scoreGlobal = record.score_global as Record<string, unknown> | undefined;
    const candidates = [
        record.note_globale,
        record.score,
        scoreGlobal?.valeur,
        scoreGlobal?.score,
        scoreGlobal?.score_process,
        record.score_global,
        record.global_score,
        record.note,
        (record.synthese as Record<string, unknown> | undefined)?.note_globale,
        (record.synthese as Record<string, unknown> | undefined)?.score,
    ];

    for (const candidate of candidates) {
        const score = normalizeAssignmentScore(candidate as number | string | null | undefined);
        if (score !== null) {
            return score;
        }
    }

    return null;
}
