export const ROLEPLAY_SESSION_LIFECYCLE_EVENT = "maia:roleplay-session-lifecycle";

export const ROLEPLAY_SESSION_LIFECYCLE_STATUS = {
    notationCompleted: "notation_completed",
    notationFailed: "notation_failed",
    saved: "saved",
    saveFailed: "save_failed",
    skipped: "skipped",
} as const;

export type RoleplaySessionLifecycleStatus =
    (typeof ROLEPLAY_SESSION_LIFECYCLE_STATUS)[keyof typeof ROLEPLAY_SESSION_LIFECYCLE_STATUS];

export interface RoleplaySessionLifecycleEvent {
    error: string | null;
    evaluationEligible: boolean;
    scenarioId: string;
    sessionId: string | null;
    status: RoleplaySessionLifecycleStatus;
    type: typeof ROLEPLAY_SESSION_LIFECYCLE_EVENT;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export function isRoleplaySessionLifecycleEvent(value: unknown): value is RoleplaySessionLifecycleEvent {
    if (!isRecord(value) || value.type !== ROLEPLAY_SESSION_LIFECYCLE_EVENT) return false;

    return (
        typeof value.scenarioId === "string" &&
        (typeof value.sessionId === "string" || value.sessionId === null) &&
        typeof value.evaluationEligible === "boolean" &&
        (typeof value.error === "string" || value.error === null) &&
        Object.values(ROLEPLAY_SESSION_LIFECYCLE_STATUS).includes(value.status as RoleplaySessionLifecycleStatus)
    );
}
