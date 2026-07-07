import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import { mapDbRoleplayToUi } from "@/features/roleplays/data/roleplay-ui-adapter";
import { extractNotationScore } from "@/features/roleplays/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRoleplayDuration } from "./roleplay.mapper";
import { fetchRoleplaysByIds } from "./roleplay-query";

interface SessionHistoryRow {
    created_at: string | null;
    duration_seconds: number | null;
    id: string;
    notation_json: unknown;
    scenario_id: string | null;
}

export interface RoleplaySessionHistoryItem {
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

interface ListRoleplaySessionHistoryInput {
    scenarioId?: string | null;
    userId: string;
}

function formatSessionDate(value: string | null) {
    if (!value) return "Date inconnue";

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
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
        .order("created_at", { ascending: false });

    if (scenarioId) {
        query = query.eq("scenario_id", scenarioId);
    }

    const { data, error } = await query.returns<SessionHistoryRow[]>();

    if (error) throw error;

    const sessions = data ?? [];
    if (sessions.length === 0) return [];

    const roleplays = await fetchRoleplaysByIds(supabase, uniqueScenarioIds(sessions));
    const roleplaysById = new Map(roleplays.map((roleplay) => [roleplay.id, mapDbRoleplayToUi(roleplay)]));

    return sessions.flatMap((session) => {
        if (!session.scenario_id) return [];

        const roleplay = roleplaysById.get(session.scenario_id);
        if (!roleplay) return [];

        return [
            {
                roleplay,
                session: {
                    date: formatSessionDate(session.created_at),
                    duration: formatRoleplayDuration(session.duration_seconds),
                    id: session.id,
                    roleplayId: roleplay.id,
                    score: extractNotationScore(session.notation_json) ?? 0,
                },
            },
        ];
    });
}
