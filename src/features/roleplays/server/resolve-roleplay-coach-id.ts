import type { SupabaseClient } from "@supabase/supabase-js";

interface ResolveRoleplayCoachIdOptions {
    explicitCoachId?: string;
    fallbackCoachId?: string;
    scenarioId?: string;
}

interface ScenarioCoachRow {
    coach_id: string | null;
}

export async function resolveRoleplayCoachId(
    supabase: SupabaseClient,
    { explicitCoachId, fallbackCoachId, scenarioId }: ResolveRoleplayCoachIdOptions,
) {
    if (explicitCoachId) return explicitCoachId;

    if (scenarioId) {
        const { data, error } = await supabase
            .from("scenarios")
            .select("coach_id")
            .eq("id", scenarioId)
            .maybeSingle<ScenarioCoachRow>();

        if (error) throw error;
        if (data?.coach_id) return data.coach_id;
    }

    return fallbackCoachId;
}
