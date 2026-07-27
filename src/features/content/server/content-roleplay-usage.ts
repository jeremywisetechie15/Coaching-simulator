import type { SupabaseClient } from "@supabase/supabase-js";

type ScenarioDependencyColumn = "method_id" | "scorecard_id";

export async function hasRoleplaySessionsForScenarioDependency(
    supabase: SupabaseClient,
    column: ScenarioDependencyColumn,
    dependencyId: string,
) {
    const { count, error } = await supabase
        .from("sessions")
        .select("id, scenarios!inner(id)", { count: "exact", head: true })
        .eq(`scenarios.${column}`, dependencyId);

    if (error) throw error;

    return (count ?? 0) > 0;
}
