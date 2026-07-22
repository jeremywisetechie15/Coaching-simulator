import {
    ACTIVITY_TRACKING_ROUTES,
    type ActiveDurationHeartbeat,
    type AiConversationStatus,
    type AiConversationType,
} from "@/features/activity-tracking/domain";

interface ApiErrorPayload {
    error?: string;
}

async function expectSuccessfulResponse(response: Response, fallbackMessage: string) {
    if (response.ok) return response;
    const payload = await response.json().catch(() => null) as ApiErrorPayload | null;
    throw new Error(payload?.error ?? fallbackMessage);
}

export async function createTrackedAiConversation(interactionType: AiConversationType) {
    const response = await fetch(ACTIVITY_TRACKING_ROUTES.aiConversations, {
        body: JSON.stringify({ interactionType }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });
    await expectSuccessfulResponse(response, "Impossible de démarrer le suivi de la conversation IA.");
    const payload = await response.json() as { conversation: { id: string } };
    return payload.conversation.id;
}

export async function updateTrackedAiConversation(
    conversationId: string,
    heartbeat: ActiveDurationHeartbeat,
    status: AiConversationStatus,
    options: { keepalive?: boolean } = {},
) {
    const response = await fetch(ACTIVITY_TRACKING_ROUTES.aiConversation(conversationId), {
        body: JSON.stringify({ ...heartbeat, status }),
        headers: { "Content-Type": "application/json" },
        keepalive: options.keepalive,
        method: "PATCH",
    });
    await expectSuccessfulResponse(response, "Impossible d'enregistrer l'activité de la conversation IA.");
}

export async function recordQuizActiveDuration(
    quizId: string,
    attemptId: string,
    heartbeat: ActiveDurationHeartbeat,
    options: { keepalive?: boolean } = {},
) {
    const response = await fetch(ACTIVITY_TRACKING_ROUTES.quizAttempt(quizId, attemptId), {
        body: JSON.stringify(heartbeat),
        headers: { "Content-Type": "application/json" },
        keepalive: options.keepalive,
        method: "PATCH",
    });
    await expectSuccessfulResponse(response, "Impossible d'enregistrer le temps actif du quiz.");
}

export async function recordSuccessfulLogin() {
    const response = await fetch(ACTIVITY_TRACKING_ROUTES.loginEvents, {
        keepalive: true,
        method: "POST",
    });
    await expectSuccessfulResponse(response, "Impossible d'enregistrer la connexion.");
}
