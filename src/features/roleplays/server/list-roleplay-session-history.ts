import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import { mapDbRoleplayToUi } from "@/features/roleplays/data/roleplay-ui-adapter";
import {
    extractNotationScore,
    MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
} from "@/features/roleplays/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatRoleplayDate, formatRoleplayDuration, formatRoleplayTime } from "./roleplay.mapper";
import { fetchRoleplaysByIds } from "./roleplay-query";

interface SessionHistoryRow {
    created_at: string | null;
    duration_seconds: number | null;
    id: string;
    notation_json: unknown;
    scenario_id: string | null;
}

export interface RoleplaySessionHistoryItem {
    occurredAt: string;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

interface ListRoleplaySessionHistoryInput {
    scenarioId?: string | null;
    userId: string;
}

function buildAttemptNumbers(sessions: SessionHistoryRow[]) {
    const countByScenario = new Map<string, number>();
    const attemptNumberBySession = new Map<string, number>();

    for (const session of sessions.slice().reverse()) {
        if (!session.scenario_id) continue;

        const attemptNumber = (countByScenario.get(session.scenario_id) ?? 0) + 1;
        countByScenario.set(session.scenario_id, attemptNumber);
        attemptNumberBySession.set(session.id, attemptNumber);
    }

    return attemptNumberBySession;
}

function uniqueScenarioIds(sessions: SessionHistoryRow[]) {
    return Array.from(new Set(sessions.map((session) => session.scenario_id).filter((id): id is string => Boolean(id))));
}

export async function listRoleplaySessionHistory({
    scenarioId,
    userId,
}: ListRoleplaySessionHistoryInput): Promise<RoleplaySessionHistoryItem[]> {
    const supabase = createAdminClient();
    let query = supabase
        .from("sessions")
        .select("id, scenario_id, created_at, duration_seconds, notation_json")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("duration_seconds", MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS)
        .order("created_at", { ascending: false });

    if (scenarioId) {
        query = query.eq("scenario_id", scenarioId);
    }

    const { data, error } = await query.returns<SessionHistoryRow[]>();

    if (error) throw error;

    const sessions = data ?? [];
    if (sessions.length === 0) return [];

    const quizAccessClient = await createClient();
    const roleplays = await fetchRoleplaysByIds(supabase, uniqueScenarioIds(sessions), {
        quizAccessClient,
    });
    const roleplaysById = new Map(roleplays.map((roleplay) => [roleplay.id, mapDbRoleplayToUi(roleplay)]));
    const attemptNumberBySession = buildAttemptNumbers(sessions);

    return sessions.flatMap((session) => {
        if (!session.scenario_id) return [];

        const roleplay = roleplaysById.get(session.scenario_id);
        if (!roleplay) return [];

        return [
            {
                occurredAt: session.created_at ?? "",
                roleplay,
                session: {
                    attemptNumber: attemptNumberBySession.get(session.id) ?? 1,
                    date: formatRoleplayDate(session.created_at),
                    duration: formatRoleplayDuration(session.duration_seconds),
                    id: session.id,
                    roleplayId: roleplay.id,
                    score: extractNotationScore(session.notation_json) ?? 0,
                    time: formatRoleplayTime(session.created_at),
                },
            },
        ];
    });
}
