import { requireAdmin } from "@/features/auth/server";
import {
    MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
} from "@/features/roleplays/domain";
import {
    USER_AI_INTERACTION_TYPE,
    type UserAiInteractionMetric,
    type UserAiInteractions,
} from "@/features/users/domain";
import { createAdminClient } from "@/lib/supabase/admin";

interface RoleplaySessionRow {
    created_at: string | null;
    duration_seconds: number | null;
    ended_at: string | null;
    id: string;
}

interface AiConversationSessionRow {
    active_duration_seconds: number | null;
    ended_at: string | null;
    id: string;
    interaction_type: "ask_persona" | "coach";
    started_at: string | null;
}

interface UserAiInteractionSource {
    aiConversations: AiConversationSessionRow[];
    roleplaySessions: RoleplaySessionRow[];
}

const interactionLabels = {
    [USER_AI_INTERACTION_TYPE.askPersona]: "Ask IA Persona",
    [USER_AI_INTERACTION_TYPE.coach]: "Coach IA",
    [USER_AI_INTERACTION_TYPE.simulation]: "Simulations IA",
} satisfies Record<UserAiInteractionMetric["type"], string>;

function normalizeDuration(value: number | null | undefined) {
    return typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, value)
        : 0;
}

function getLatestDate(values: Array<string | null | undefined>) {
    return values.reduce<string | null>((latest, value) => {
        if (!value) return latest;
        if (!latest) return value;
        return new Date(value).getTime() > new Date(latest).getTime() ? value : latest;
    }, null);
}

export function buildUserAiInteractions({
    aiConversations,
    roleplaySessions,
}: UserAiInteractionSource): UserAiInteractions {
    const askPersonaSessions = aiConversations.filter(
        (conversation) => conversation.interaction_type === "ask_persona",
    );
    const coachSessions = aiConversations.filter(
        (conversation) => conversation.interaction_type === "coach",
    );
    const items: UserAiInteractionMetric[] = [
        {
            durationSeconds: roleplaySessions.reduce(
                (total, session) => total + normalizeDuration(session.duration_seconds),
                0,
            ),
            label: interactionLabels[USER_AI_INTERACTION_TYPE.simulation],
            lastUsedAt: getLatestDate(
                roleplaySessions.map((session) => session.ended_at ?? session.created_at),
            ),
            sessions: roleplaySessions.length,
            type: USER_AI_INTERACTION_TYPE.simulation,
        },
        {
            durationSeconds: askPersonaSessions.reduce(
                (total, session) => total + normalizeDuration(session.active_duration_seconds),
                0,
            ),
            label: interactionLabels[USER_AI_INTERACTION_TYPE.askPersona],
            lastUsedAt: getLatestDate(
                askPersonaSessions.map((session) => session.ended_at ?? session.started_at),
            ),
            sessions: askPersonaSessions.length,
            type: USER_AI_INTERACTION_TYPE.askPersona,
        },
        {
            durationSeconds: coachSessions.reduce(
                (total, session) => total + normalizeDuration(session.active_duration_seconds),
                0,
            ),
            label: interactionLabels[USER_AI_INTERACTION_TYPE.coach],
            lastUsedAt: getLatestDate(
                coachSessions.map((session) => session.ended_at ?? session.started_at),
            ),
            sessions: coachSessions.length,
            type: USER_AI_INTERACTION_TYPE.coach,
        },
    ];

    return {
        items,
        totalDurationSeconds: items.reduce(
            (total, interaction) => total + interaction.durationSeconds,
            0,
        ),
    };
}

export async function listUserAiInteractions(userId: string): Promise<UserAiInteractions> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const [roleplayResult, aiConversationResult] = await Promise.all([
        adminSupabase
            .from("sessions")
            .select("id, duration_seconds, created_at, ended_at")
            .eq("user_id", userId)
            .eq("status", "completed")
            .eq("technical_error", false)
            .gte(
                "duration_seconds",
                MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
            )
            .returns<RoleplaySessionRow[]>(),
        adminSupabase
            .from("ai_conversation_sessions")
            .select("id, interaction_type, active_duration_seconds, started_at, ended_at")
            .eq("user_id", userId)
            .eq("status", "completed")
            .eq("technical_error", false)
            .returns<AiConversationSessionRow[]>(),
    ]);

    if (roleplayResult.error) throw roleplayResult.error;
    if (aiConversationResult.error) throw aiConversationResult.error;

    return buildUserAiInteractions({
        aiConversations: aiConversationResult.data ?? [],
        roleplaySessions: roleplayResult.data ?? [],
    });
}
