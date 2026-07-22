export const ACTIVE_DURATION_HEARTBEAT_INTERVAL_MS = 30_000;
export const ACTIVE_DURATION_INACTIVITY_TIMEOUT_MS = 5 * 60_000;
export const ACTIVE_DURATION_MAX_INCREMENT_SECONDS = 60;

export const AI_CONVERSATION_TYPE = {
    askPersona: "ask_persona",
    coach: "coach",
} as const;

export type AiConversationType =
    (typeof AI_CONVERSATION_TYPE)[keyof typeof AI_CONVERSATION_TYPE];

export const AI_CONVERSATION_STATUS = {
    abandoned: "abandoned",
    active: "active",
    completed: "completed",
    error: "error",
    timedOut: "timed_out",
} as const;

export type AiConversationStatus =
    (typeof AI_CONVERSATION_STATUS)[keyof typeof AI_CONVERSATION_STATUS];

export const ACTIVITY_TRACKING_ROUTES = {
    aiConversation: (conversationId: string) =>
        `/api/ai-conversations/${encodeURIComponent(conversationId)}`,
    aiConversations: "/api/ai-conversations",
    loginEvents: "/api/auth/login-events",
    quizAttempt: (quizId: string, attemptId: string) =>
        `/api/quizzes/${encodeURIComponent(quizId)}/attempts/${encodeURIComponent(attemptId)}/activity`,
} as const;

export interface ActiveDurationHeartbeat {
    activeSeconds: number;
    aiMessageDelta: number;
    userMessageDelta: number;
}

export function canAccumulateActiveDuration(input: {
    isVisible: boolean;
    lastActivityAtMs: number;
    nowMs: number;
}) {
    return input.isVisible
        && input.nowMs - input.lastActivityAtMs <= ACTIVE_DURATION_INACTIVITY_TIMEOUT_MS;
}

export function getAcceptedActiveDurationIncrement(input: {
    lastActivityAt: string | null;
    now: Date;
    requestedSeconds: number;
}) {
    const requestedSeconds = Math.max(
        0,
        Math.min(ACTIVE_DURATION_MAX_INCREMENT_SECONDS, Math.floor(input.requestedSeconds)),
    );

    if (requestedSeconds === 0 || !input.lastActivityAt) {
        return requestedSeconds;
    }

    const lastActivityTimestamp = new Date(input.lastActivityAt).getTime();
    if (!Number.isFinite(lastActivityTimestamp)) return 0;

    const elapsedSeconds = Math.max(
        0,
        Math.ceil((input.now.getTime() - lastActivityTimestamp) / 1_000),
    );

    return Math.min(requestedSeconds, elapsedSeconds);
}
